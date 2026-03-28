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

interface LlmContext {
  purpose: string;
  conversationId?: string;
  messageId?: string;
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
      { role: "system", content: systemPrompt },
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
  const text = await responsesApi({
    model,
    instructions: systemPrompt,
    tools: [{ type: "web_search_preview" }],
    input: userMessage,
  });
  const elapsed = Date.now() - start;
  trackUsage(ctx, model, undefined, elapsed);
  return text;
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
      { role: "system", content: systemPrompt },
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
