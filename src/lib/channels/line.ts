import { ChannelAdapter, NormalizedMessageEvent } from "./types";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { type: string; groupId?: string; roomId?: string; userId?: string };
  message?: { id: string; type: string; text?: string };
  timestamp: number;
}

interface LineWebhookBody {
  events: LineEvent[];
}

function getAccessToken(): string {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
}

export const lineAdapter: ChannelAdapter = {
  channelType: "line",

  async validateRequest(): Promise<boolean> {
    // Validation is handled in the route handler
    return true;
  },

  normalizeEvents(body: unknown): NormalizedMessageEvent[] {
    const webhookBody = body as LineWebhookBody;
    if (!webhookBody.events) return [];

    return webhookBody.events
      .filter((e) => e.type === "message" && e.message?.type === "text")
      .map((e) => {
        const isGroup = e.source?.type === "group" || e.source?.type === "room";
        const threadId = e.source?.groupId || e.source?.roomId || e.source?.userId || "unknown";

        return {
          channelType: "line" as const,
          externalThreadId: threadId,
          externalMessageId: e.message!.id,
          senderId: e.source?.userId || "unknown",
          text: e.message!.text!,
          timestamp: new Date(e.timestamp),
          replyToken: e.replyToken,
          isDirectMessage: !isGroup,
          rawEvent: e,
        };
      });
  },

  async sendReply(replyToken: string, text: string): Promise<void> {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
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
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        to: externalThreadId,
        messages: [{ type: "text", text }],
      }),
    });
  },
};
