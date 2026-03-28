import crypto from "crypto";
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
  event?: SlackEvent;
  event_id?: string;
}

function getBotToken(): string {
  return process.env.SLACK_BOT_TOKEN || "";
}

export function verifySlackRequest(body: string, timestamp: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET || "";
  if (!secret) return false;

  // Check timestamp is within 5 minutes
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

async function getUserDisplayName(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: { Authorization: `Bearer ${getBotToken()}` },
    });
    const data = await res.json();
    return data.user?.profile?.display_name || data.user?.real_name || null;
  } catch {
    return null;
  }
}

export const slackAdapter: ChannelAdapter = {
  channelType: "slack",

  async validateRequest(): Promise<boolean> {
    return true; // Handled in route
  },

  normalizeEvents(body: unknown): NormalizedMessageEvent[] {
    const payload = body as SlackEventPayload;
    const eventType = payload.event?.type;
    if (!payload.event || (eventType !== "message" && eventType !== "app_mention")) {
      console.log("Slack normalize: skipped, event type:", eventType);
      return [];
    }
    if (payload.event.bot_id || payload.event.subtype) {
      console.log("Slack normalize: skipped bot/subtype");
      return [];
    }

    const event = payload.event;
    const isDm = event.channel_type === "im";

    return [{
      channelType: "slack" as const,
      externalThreadId: event.channel || "unknown",
      externalMessageId: event.ts || Date.now().toString(),
      senderId: event.user || "unknown",
      text: (event.text || "").replace(/<@[A-Z0-9]+>/g, "").trim(), // Strip @mentions
      timestamp: new Date(parseFloat(event.ts || "0") * 1000),
      isDirectMessage: isDm,
      rawEvent: event,
    }];
  },

  async sendReply(_replyToken: string, text: string): Promise<void> {
    // Not used for Slack - use sendPush instead
  },

  async sendPush(channelId: string, text: string): Promise<void> {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getBotToken()}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text,
      }),
    });
  },
};

export { getUserDisplayName as getSlackUserDisplayName };
