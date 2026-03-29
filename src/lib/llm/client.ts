import OpenAI from "openai";
import { prisma } from "../db/prisma";

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MODEL_MINI = process.env.OPENAI_MODEL_MINI || "gpt-5.4-mini";
const MODEL_FULL = process.env.OPENAI_MODEL_FULL || "gpt-5.4";

// Purposes that require deeper reasoning → full model
const FULL_MODEL_PURPOSES = new Set([
  "mediation",  // 仲裁・介入
  "chat",       // DM相談・グループ応答
]);

function selectModel(purpose: string): string {
  return FULL_MODEL_PURPOSES.has(purpose) ? MODEL_FULL : MODEL_MINI;
}

// === 時間感覚システム ===
// LLMに日時・季節・時間帯・経過時間・利用歴の感覚を与える

function toJST(date: Date): Date {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

function formatDatetimeJST(jst: Date): string {
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const h = jst.getUTCHours();
  const min = String(jst.getUTCMinutes()).padStart(2, "0");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdays[jst.getUTCDay()];
  return `${y}年${m}月${d}日(${w}) ${h}:${min}`;
}

function getTimeOfDay(hour: number): string {
  if (hour < 5) return "深夜";
  if (hour < 9) return "早朝";
  if (hour < 12) return "午前";
  if (hour < 14) return "お昼";
  if (hour < 17) return "午後";
  if (hour < 20) return "夕方";
  if (hour < 23) return "夜";
  return "深夜";
}

function getSeasonAndEvents(month: number, day: number): string {
  // 日本の季節行事
  if (month === 1 && day <= 3) return "お正月";
  if (month === 1) return "冬（年始）";
  if (month === 2 && day === 14) return "冬（バレンタインデー）";
  if (month === 2) return "冬";
  if (month === 3 && day >= 20) return "春（年度末）";
  if (month === 3) return "冬の終わり（年度末）";
  if (month === 4 && day <= 7) return "春（新年度・お花見シーズン）";
  if (month === 4) return "春";
  if (month === 5 && day <= 5) return "春（ゴールデンウィーク）";
  if (month === 5) return "春";
  if (month === 6) return "梅雨の時期";
  if (month === 7) return "夏";
  if (month === 8 && day >= 10 && day <= 16) return "夏（お盆）";
  if (month === 8) return "夏";
  if (month === 9) return "秋の始まり";
  if (month === 10) return "秋";
  if (month === 11) return "秋";
  if (month === 12 && day >= 25) return "冬（年末）";
  if (month === 12) return "冬（師走）";
  return "";
}

function formatElapsedTime(lastMessageAt: Date, now: Date): string {
  const diffMs = now.getTime() - lastMessageAt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "昨日";
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  return `${Math.floor(diffDays / 30)}ヶ月前`;
}

function formatMembershipDuration(createdAt: Date, now: Date): string {
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今日が初日";
  if (diffDays === 1) return "利用2日目";
  if (diffDays < 7) return `利用${diffDays + 1}日目`;
  if (diffDays < 30) return `利用${Math.floor(diffDays / 7) + 1}週目`;
  if (diffDays < 365) return `利用${Math.floor(diffDays / 30) + 1}ヶ月目`;
  return `利用${Math.floor(diffDays / 365) + 1}年目`;
}

function buildTimeContext(ctx?: LlmContext): string {
  const now = new Date();
  const jst = toJST(now);
  const hour = jst.getUTCHours();
  const month = jst.getUTCMonth() + 1;
  const day = jst.getUTCDate();

  const lines: string[] = [];
  lines.push(`現在の日時: ${formatDatetimeJST(jst)}`);
  lines.push(`時間帯: ${getTimeOfDay(hour)}`);

  const season = getSeasonAndEvents(month, day);
  if (season) lines.push(`季節: ${season}`);

  if (ctx?.lastMessageAt) {
    const elapsed = formatElapsedTime(ctx.lastMessageAt, now);
    lines.push(`前回のメッセージ: ${elapsed}`);
  }

  if (ctx?.userCreatedAt) {
    lines.push(`この人との付き合い: ${formatMembershipDuration(ctx.userCreatedAt, now)}`);
  }

  return lines.join("\n");
}

function withDatetime(systemPrompt: string, ctx?: LlmContext): string {
  return `${buildTimeContext(ctx)}\n\n${systemPrompt}`;
}

interface LlmContext {
  purpose: string;
  conversationId?: string;
  messageId?: string;
  lastMessageAt?: Date;
  userCreatedAt?: Date;
}

async function trackUsage(
  ctx: LlmContext,
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined,
  responseTimeMs: number
) {
  try {
    await prisma.llmUsage.create({
      data: {
        conversationId: ctx.conversationId,
        messageId: ctx.messageId,
        purpose: ctx.purpose,
        model,
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        responseTimeMs,
      },
    });
  } catch {
    // Don't fail the request if tracking fails
  }
}

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  ctx: LlmContext = { purpose: "chat" },
  options?: { imageUrls?: string[] }
): Promise<string> {
  const model = selectModel(ctx.purpose);
  const start = Date.now();

  // Build user content: text + optional images
  let userContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  if (options?.imageUrls?.length) {
    userContent = [
      { type: "text", text: userMessage },
      ...options.imageUrls.map((url) => ({
        type: "image_url" as const,
        image_url: { url },
      })),
    ];
  } else {
    userContent = userMessage;
  }

  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: "system", content: withDatetime(systemPrompt, ctx) },
      { role: "user", content: userContent as never },
    ],
    temperature: 0.3,
    max_completion_tokens: 1024,
  });
  const elapsed = Date.now() - start;
  trackUsage(ctx, model, response.usage ?? undefined, elapsed);
  return response.choices[0]?.message?.content || "";
}

export async function transcribeAudio(audioDataUrl: string): Promise<string> {
  // Extract base64 data from data URL
  const match = audioDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return "";

  const buffer = Buffer.from(match[2], "base64");
  const file = new File([buffer], "audio.m4a", { type: match[1] });

  try {
    const response = await getOpenAI().audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "ja",
    });
    return response.text || "";
  } catch (err) {
    console.warn("Audio transcription failed:", err instanceof Error ? err.message : err);
    return "";
  }
}

// ── Responses API helpers (for features not available in Chat Completions) ──

function extractResponseText(data: { output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }): string {
  if (!Array.isArray(data.output)) return "";
  for (const item of data.output) {
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c.type === "output_text" && c.text) return c.text;
      }
    }
  }
  return "";
}

async function responsesApi(body: Record<string, unknown>): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    console.warn("Responses API error:", data.error.message || data.error);
    return "";
  }
  return extractResponseText(data);
}

// Read file content (PDF, Word, Excel, etc.)
export async function readFileWithLlm(
  fileBase64: string,
  mimeType: string,
  fileName: string,
  instruction: string
): Promise<string> {
  return responsesApi({
    model: MODEL_MINI,
    input: [{
      role: "user",
      content: [
        { type: "input_file", file_data: `data:${mimeType};base64,${fileBase64}`, filename: fileName },
        { type: "input_text", text: instruction },
      ],
    }],
  });
}

// Web search via Responses API
export async function webSearchCompletion(
  systemPrompt: string,
  userMessage: string,
  ctx: LlmContext = { purpose: "chat" }
): Promise<string> {
  const model = selectModel(ctx.purpose);
  const start = Date.now();
  try {
    const text = await responsesApi({
      model,
      instructions: withDatetime(systemPrompt, ctx),
      tools: [{ type: "web_search_preview" }],
      input: userMessage,
    });
    const elapsed = Date.now() - start;
    trackUsage(ctx, model, undefined, elapsed);
    return text || "";
  } catch (err) {
    console.warn("webSearchCompletion failed:", err instanceof Error ? err.message : err);
    return "";
  }
}

export async function chatCompletionJson<T>(
  systemPrompt: string,
  userMessage: string,
  ctx: LlmContext = { purpose: "chat" }
): Promise<T> {
  const model = selectModel(ctx.purpose);
  const start = Date.now();
  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: "system", content: withDatetime(systemPrompt, ctx) },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1,
    max_completion_tokens: 256,
    response_format: { type: "json_object" },
  });
  const elapsed = Date.now() - start;
  trackUsage(ctx, model, response.usage ?? undefined, elapsed);
  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}
