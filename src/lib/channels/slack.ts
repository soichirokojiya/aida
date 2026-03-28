import crypto from "crypto";
import { prisma } from "../db/prisma";
import { ChannelAdapter, NormalizedMessageEvent } from "./types";

interface SlackFile {
  id: string;
  name?: string;
  mimetype?: string;
  filetype?: string;
  url_private?: string;
  url_private_download?: string;
}

interface SlackEvent {
  type: string;
  subtype?: string;
  user?: string;
  text?: string;
  channel?: string;
  channel_type?: string;
  ts?: string;
  thread_ts?: string;
  bot_id?: string;
  files?: SlackFile[];
}

interface SlackEventPayload {
  type: string;
  challenge?: string;
  team_id?: string;
  event?: SlackEvent;
  event_id?: string;
}

// Cache bot tokens in memory (teamId -> token)
const tokenCache = new Map<string, { token: string; botUserId: string | null; expires: number }>();

async function getBotTokenForTeam(teamId: string): Promise<string> {
  const cached = tokenCache.get(teamId);
  if (cached && cached.expires > Date.now()) return cached.token;

  const workspace = await prisma.slackWorkspace.findUnique({ where: { teamId } });
  if (!workspace) {
    // Fallback to env var for backwards compatibility
    const envToken = process.env.SLACK_BOT_TOKEN;
    if (envToken) return envToken;
    throw new Error(`No bot token for team ${teamId}`);
  }

  tokenCache.set(teamId, {
    token: workspace.botToken,
    botUserId: workspace.botUserId,
    expires: Date.now() + 5 * 60 * 1000, // 5 min cache
  });
  return workspace.botToken;
}

async function getBotUserIdForTeam(teamId: string): Promise<string | null> {
  const cached = tokenCache.get(teamId);
  if (cached && cached.expires > Date.now()) return cached.botUserId;
  await getBotTokenForTeam(teamId); // populates cache
  return tokenCache.get(teamId)?.botUserId || null;
}

export function verifySlackRequest(body: string, timestamp: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET || "";
  if (!secret) return false;

  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = "v0=" + crypto
    .createHmac("sha256", secret)
    .update(sigBasestring)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

export function parseSlackPayload(body: unknown): SlackEventPayload {
  return body as SlackEventPayload;
}

async function getUserDisplayName(userId: string, teamId: string): Promise<string | null> {
  try {
    const token = await getBotTokenForTeam(teamId);
    const res = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.user?.profile?.display_name || data.user?.real_name || null;
  } catch {
    return null;
  }
}

// Track Slack user in DB (create if not exists, update last active)
async function trackSlackUser(userId: string, teamId: string, displayName?: string | null) {
  try {
    await prisma.slackUser.upsert({
      where: { slackUserId_teamId: { slackUserId: userId, teamId } },
      update: { lastActiveAt: new Date(), ...(displayName ? { displayName } : {}) },
      create: {
        slackUserId: userId,
        teamId,
        displayName: displayName || null,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day trial
      },
    });
  } catch {
    // Non-blocking
  }
}

export function createSlackAdapter(teamId: string): ChannelAdapter {
  return {
    channelType: "slack",

    async validateRequest(): Promise<boolean> {
      return true; // Handled in route
    },

    normalizeEvents(body: unknown): NormalizedMessageEvent[] {
      const payload = body as SlackEventPayload;
      const eventType = payload.event?.type;
      if (!payload.event || (eventType !== "message" && eventType !== "app_mention")) {
        return [];
      }
      // Skip bot messages, but allow file_share subtype
      if (payload.event.bot_id) return [];
      if (payload.event.subtype && payload.event.subtype !== "file_share") return [];

      const event = payload.event;
      const isDm = event.channel_type === "im";

      return [{
        channelType: "slack" as const,
        externalThreadId: event.channel || "unknown",
        externalMessageId: event.ts || Date.now().toString(),
        senderId: event.user || "unknown",
        text: (event.text || "").replace(/<@[A-Z0-9]+>/g, "").trim(),
        timestamp: new Date(parseFloat(event.ts || "0") * 1000),
        isDirectMessage: isDm,
        rawEvent: { ...event, team_id: teamId },
      }];
    },

    async sendReply(_replyToken: string, text: string): Promise<void> {
      // Not used for Slack
    },

    async sendPush(channelId: string, text: string): Promise<void> {
      const token = await getBotTokenForTeam(teamId);
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channel: channelId, text }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("Slack sendPush error:", data.error, "channel:", channelId, "team:", teamId);
      }
    },
  };
}

// Legacy adapter for backwards compat (uses env var token)
export const slackAdapter: ChannelAdapter = createSlackAdapter("__legacy__");

// Enrich Slack event with file content (images, audio, PDF)
async function enrichSlackEvent(event: NormalizedMessageEvent): Promise<NormalizedMessageEvent> {
  const rawEvent = event.rawEvent as SlackEvent & { team_id?: string };
  const files = rawEvent.files;
  if (!files?.length) return event;

  const teamId = rawEvent.team_id || "__legacy__";
  const token = await getBotTokenForTeam(teamId);

  for (const file of files) {
    const url = file.url_private_download || file.url_private;
    if (!url) continue;

    const mime = file.mimetype || "";
    const name = file.name || "";

    try {
      if (mime.startsWith("image/")) {
        // Download image and convert to base64
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const dataUrl = `data:${mime};base64,${base64}`;
        event.imageUrls = [...(event.imageUrls || []), dataUrl];
        if (!event.text || event.text.trim() === "") event.text = "[画像]";

      } else if (mime.startsWith("audio/")) {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        event.audioUrl = `data:${mime};base64,${base64}`;
        if (!event.text || event.text.trim() === "") event.text = "[音声メッセージ]";

      } else if (mime === "application/pdf") {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        // Use same PDF extraction as LINE
        const { getOpenAI } = await import("../llm/client");
        const response = await getOpenAI().chat.completions.create({
          model: "gpt-5.4-mini",
          messages: [
            { role: "system", content: "添付されたPDFの内容をできるだけ正確に文字起こししてください。表やレイアウトも可能な範囲でテキストとして再現してください。" },
            {
              role: "user",
              content: [
                { type: "file", file: { file_data: `data:application/pdf;base64,${Buffer.from(buffer).toString("base64")}`, filename: name } },
                { type: "text", text: "このPDFの内容を読み取ってください。" },
              ] as never,
            },
          ],
          max_completion_tokens: 4096,
        });
        const pdfText = response.choices[0]?.message?.content || "";
        if (pdfText) {
          event.text = `[PDF: ${name}]\n${pdfText}`;
        } else {
          event.text = `[PDF: ${name}（読み取れませんでした）]`;
        }

      } else if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mime === "application/msword" || name.endsWith(".docx") || name.endsWith(".doc")) {
        // Word documents: download and use LLM to extract content from the file
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        const { getOpenAI } = await import("../llm/client");
        const response = await getOpenAI().chat.completions.create({
          model: "gpt-5.4-mini",
          messages: [
            { role: "system", content: "添付されたWord文書の内容をできるだけ正確に文字起こししてください。" },
            {
              role: "user",
              content: [
                { type: "file", file: { file_data: `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`, filename: name } },
                { type: "text", text: "この文書の内容を読み取ってください。" },
              ] as never,
            },
          ],
          max_completion_tokens: 4096,
        });
        const docText = response.choices[0]?.message?.content || "";
        if (docText) {
          event.text = `[文書: ${name}]\n${docText}`;
        } else {
          event.text = `[文書: ${name}（読み取れませんでした）]`;
        }

      } else if (mime === "video/mp4" || mime.startsWith("video/")) {
        event.text = "[動画]";
      }
    } catch (err) {
      console.warn("Slack file processing failed:", name, err instanceof Error ? err.message : err);
    }
  }

  return event;
}

export { getUserDisplayName as getSlackUserDisplayName, trackSlackUser, getBotUserIdForTeam, enrichSlackEvent };
