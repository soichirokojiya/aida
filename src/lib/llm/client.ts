import OpenAI from "openai";
import { prisma } from "../db/prisma";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

interface LlmContext {
  purpose: string;
  conversationId?: string;
  messageId?: string;
}

async function trackUsage(
  ctx: LlmContext,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined,
  responseTimeMs: number
) {
  try {
    await prisma.llmUsage.create({
      data: {
        conversationId: ctx.conversationId,
        messageId: ctx.messageId,
        purpose: ctx.purpose,
        model: MODEL,
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
  const start = Date.now();
  const response = await getOpenAI().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });
  const elapsed = Date.now() - start;
  trackUsage(ctx, response.usage ?? undefined, elapsed);
  return response.choices[0]?.message?.content || "";
}

export async function chatCompletionJson<T>(
  systemPrompt: string,
  userMessage: string,
  ctx: LlmContext = { purpose: "chat" }
): Promise<T> {
  const start = Date.now();
  const response = await getOpenAI().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1,
    max_tokens: 256,
    response_format: { type: "json_object" },
  });
  const elapsed = Date.now() - start;
  trackUsage(ctx, response.usage ?? undefined, elapsed);
  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}
