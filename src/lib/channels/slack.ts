import crypto from "crypto";
import { prisma } from "../db/prisma";
import { ChannelAdapter, NormalizedMessageEvent } from "./types";

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
      if (payload.event.bot_id || payload.event.subtype) {
        return [];
      }

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

export { getUserDisplayName as getSlackUserDisplayName, trackSlackUser, getBotUserIdForTeam };
