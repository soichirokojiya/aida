import OpenAI from "openai";
import { prisma } from "../db/prisma";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
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
  ctx: LlmContext = { purpose: "chat" }
): Promise<string> {
  const model = selectModel(ctx.purpose);
  const start = Date.now();
  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });
  const elapsed = Date.now() - start;
  trackUsage(ctx, model, response.usage ?? undefined, elapsed);
  return response.choices[0]?.message?.content || "";
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
    max_tokens: 256,
    response_format: { type: "json_object" },
  });
  const elapsed = Date.now() - start;
  trackUsage(ctx, model, response.usage ?? undefined, elapsed);
  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}
