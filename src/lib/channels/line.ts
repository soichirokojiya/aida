import { ChannelAdapter, NormalizedMessageEvent } from "./types";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { type: string; groupId?: string; roomId?: string; userId?: string };
  message?: { id: string; type: string; text?: string; duration?: number; fileName?: string; fileSize?: number; contentProvider?: { type: string } };
  timestamp: number;
}

interface LineWebhookBody {
  events: LineEvent[];
}

function getAccessToken(): string {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
}

async function getGroupMemberDisplayName(
  groupId: string,
  userId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`,
      {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.displayName || null;
  } catch {
    return null;
  }
}

async function getUserDisplayName(userId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.displayName || null;
  } catch {
    return null;
  }
}

// Fetch binary content from LINE Content API and return as base64 data URL
async function getLineContent(messageId: string, mimeType: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      { headers: { Authorization: `Bearer ${getAccessToken()}` } }
    );
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return null;
  }
}

const SUPPORTED_MESSAGE_TYPES = new Set(["text", "image", "audio", "file"]);

export const lineAdapter: ChannelAdapter = {
  channelType: "line",

  async validateRequest(): Promise<boolean> {
    return true;
  },

  normalizeEvents(body: unknown): NormalizedMessageEvent[] {
    const webhookBody = body as LineWebhookBody;
    if (!webhookBody.events) return [];

    return webhookBody.events
      .filter((e) => e.type === "message" && e.message && SUPPORTED_MESSAGE_TYPES.has(e.message.type))
      .map((e) => {
        const isGroup = e.source?.type === "group" || e.source?.type === "room";
        const threadId = e.source?.groupId || e.source?.roomId || e.source?.userId || "unknown";
        const msgType = e.message!.type;

        return {
          channelType: "line" as const,
          externalThreadId: threadId,
          externalMessageId: e.message!.id,
          senderId: e.source?.userId || "unknown",
          text: msgType === "text" ? e.message!.text! : "",
          // image/audio content will be fetched asynchronously in enrichLineEvent
          _messageType: msgType,
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

async function getGroupMemberCount(groupId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/group/${groupId}/members/count`,
      { headers: { Authorization: `Bearer ${getAccessToken()}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.count ?? null;
  } catch {
    return null;
  }
}

// Extract text from a PDF buffer using pdf-parse or fallback to image conversion
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    // Use OpenAI to read the PDF as images (convert pages to base64 images)
    // PDF.js is heavy, so we send the file to OpenAI's file API for extraction
    const { getOpenAI } = await import("../llm/client");
    const file = new File([buffer], "document.pdf", { type: "application/pdf" });
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        { role: "system", content: "添付されたPDFの内容をできるだけ正確に文字起こししてください。表やレイアウトも可能な範囲でテキストとして再現してください。" },
        {
          role: "user",
          content: [
            { type: "file", file: { file_data: `data:application/pdf;base64,${Buffer.from(buffer).toString("base64")}`, filename: "document.pdf" } },
            { type: "text", text: "このPDFの内容を読み取ってください。" },
          ] as never,
        },
      ],
      max_completion_tokens: 4096,
    });
    return response.choices[0]?.message?.content || "";
  } catch (err) {
    console.warn("PDF extraction failed:", err instanceof Error ? err.message : err);
    return "";
  }
}

// Enrich a normalized event with image/audio/file content (async fetch from LINE Content API)
async function enrichLineEvent(event: NormalizedMessageEvent): Promise<NormalizedMessageEvent> {
  const rawEvent = event.rawEvent as LineEvent;
  const msgType = rawEvent.message?.type;
  const msgId = rawEvent.message?.id;

  if (!msgId) return event;

  if (msgType === "image") {
    const dataUrl = await getLineContent(msgId, "image/jpeg");
    if (dataUrl) {
      event.imageUrls = [dataUrl];
      if (!event.text) event.text = "[画像]";
    }
  } else if (msgType === "audio") {
    const dataUrl = await getLineContent(msgId, "audio/m4a");
    if (dataUrl) {
      event.audioUrl = dataUrl;
      if (!event.text) event.text = "[音声メッセージ]";
    }
  } else if (msgType === "file") {
    const fileName = rawEvent.message?.fileName || "";
    if (fileName.toLowerCase().endsWith(".pdf")) {
      try {
        const res = await fetch(
          `https://api-data.line.me/v2/bot/message/${msgId}/content`,
          { headers: { Authorization: `Bearer ${getAccessToken()}` } }
        );
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const pdfText = await extractPdfText(buffer);
          if (pdfText) {
            event.text = `[PDF: ${fileName}]\n${pdfText}`;
          } else {
            event.text = `[PDF: ${fileName}（読み取れませんでした）]`;
          }
        }
      } catch (err) {
        console.warn("PDF fetch failed:", err instanceof Error ? err.message : err);
        event.text = `[PDF: ${fileName}（取得に失敗しました）]`;
      }
    } else {
      event.text = `[ファイル: ${fileName}]`;
    }
  }

  return event;
}

export { getGroupMemberDisplayName, getUserDisplayName, getGroupMemberCount, enrichLineEvent };
