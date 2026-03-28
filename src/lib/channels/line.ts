import { ChannelAdapter, NormalizedMessageEvent } from "./types";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { type: string; groupId?: string; roomId?: string; userId?: string };
  message?: { id: string; type: string; text?: string; duration?: number; fileName?: string; fileSize?: number; contentProvider?: { type: string }; packageId?: string; stickerId?: string; keywords?: string[] };
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

const SUPPORTED_MESSAGE_TYPES = new Set(["text", "image", "audio", "file", "sticker", "video"]);

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
async function extractFileText(buffer: ArrayBuffer, mimeType: string, fileName: string): Promise<string> {
  try {
    const { readFileWithLlm } = await import("../llm/client");
    const base64 = Buffer.from(buffer).toString("base64");
    return await readFileWithLlm(base64, mimeType, fileName, "この文書の内容をできるだけ正確に文字起こししてください。表やレイアウトも可能な範囲でテキストとして再現してください。");
  } catch (err) {
    console.warn("File extraction failed:", fileName, err instanceof Error ? err.message : err);
    return "";
  }
}

// Enrich a normalized event with image/audio/file content (async fetch from LINE Content API)
async function enrichLineEvent(event: NormalizedMessageEvent): Promise<NormalizedMessageEvent> {
  const rawEvent = event.rawEvent as LineEvent;
  const msgType = rawEvent.message?.type;
  const msgId = rawEvent.message?.id;

  if (!msgId) return event;

  console.log(`enrichLineEvent: type=${msgType} id=${msgId} fileName=${rawEvent.message?.fileName || "none"}`);

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
  } else if (msgType === "sticker") {
    const keywords = rawEvent.message?.keywords;
    if (keywords?.length) {
      event.text = `[スタンプ: ${keywords.join(", ")}]`;
    } else {
      event.text = "[スタンプ]";
    }
  } else if (msgType === "video") {
    event.text = "[動画]";
  } else if (msgType === "file") {
    const fileName = rawEvent.message?.fileName || "";
    const lowerName = fileName.toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".csv": "text/csv",
    };
    const ext = Object.keys(mimeMap).find(e => lowerName.endsWith(e));
    if (ext) {
      try {
        const res = await fetch(
          `https://api-data.line.me/v2/bot/message/${msgId}/content`,
          { headers: { Authorization: `Bearer ${getAccessToken()}` } }
        );
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const fileText = await extractFileText(buffer, mimeMap[ext], fileName);
          const label = ext === ".pdf" ? "PDF" : ext.includes("xls") || ext === ".csv" ? "表計算" : "文書";
          event.text = fileText ? `[${label}: ${fileName}]\n${fileText}` : `[${label}: ${fileName}（読み取れませんでした）]`;
        }
      } catch (err) {
        console.warn("File fetch failed:", fileName, err instanceof Error ? err.message : err);
        event.text = `[ファイル: ${fileName}（取得に失敗しました）]`;
      }
    } else {
      event.text = `[ファイル: ${fileName}]`;
    }
  }

  return event;
}

export { getGroupMemberDisplayName, getUserDisplayName, getGroupMemberCount, enrichLineEvent };
