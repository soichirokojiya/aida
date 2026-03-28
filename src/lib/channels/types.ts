export type ChannelType = "line" | "slack" | "teams" | "web";

export interface NormalizedMessageEvent {
  channelType: ChannelType;
  externalThreadId: string;
  externalMessageId: string;
  senderId: string;
  senderDisplayName?: string;
  text: string;
  imageUrls?: string[];       // base64 data URLs or https URLs
  audioUrl?: string;          // URL to audio content
  timestamp: Date;
  replyToken?: string;
  isDirectMessage: boolean;
  rawEvent: unknown;
}

export interface ChannelAdapter {
  channelType: ChannelType;
  validateRequest(request: Request): Promise<boolean>;
  normalizeEvents(body: unknown): NormalizedMessageEvent[];
  sendReply(replyToken: string, text: string): Promise<void>;
  sendPush(externalThreadId: string, text: string): Promise<void>;
}
