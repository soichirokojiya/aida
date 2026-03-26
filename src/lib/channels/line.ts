import crypto from "crypto";
import { ChannelAdapter, NormalizedMessageEvent } from "./types";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { type: string; groupId?: string; userId?: string };
  message?: { id: string; type: string; text?: string };
  timestamp: number;
}

interface LineWebhookBody {
  events: LineEvent[];
}

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

function validateSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("SHA256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export const lineAdapter: ChannelAdapter = {
  channelType: "line",

  async validateRequest(request: Request): Promise<boolean> {
    const signature = request.headers.get("x-line-signature");
    if (!signature) return false;
    const body = await request.clone().text();
    return validateSignature(body, signature);
  },

  normalizeEvents(body: unknown): NormalizedMessageEvent[] {
    const webhookBody = body as LineWebhookBody;
    if (!webhookBody.events) return [];

    return webhookBody.events
      .filter(
        (e) =>
          e.type === "message" &&
          e.message?.type === "text" &&
          e.source?.groupId
      )
      .map((e) => ({
        channelType: "line" as const,
        externalThreadId: e.source!.groupId!,
        externalMessageId: e.message!.id,
        senderId: e.source!.userId || "unknown",
        text: e.message!.text!,
        timestamp: new Date(e.timestamp),
        replyToken: e.replyToken,
        rawEvent: e,
      }));
  },

  async sendReply(replyToken: string, text: string): Promise<void> {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }],
      }),
    });
  },

  async sendPush(externalThreadId: string, text: string): Promise<void> {
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: externalThreadId,
        messages: [{ type: "text", text }],
      }),
    });
  },
};
