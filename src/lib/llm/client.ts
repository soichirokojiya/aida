import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });
  return response.choices[0]?.message?.content || "";
}

export async function chatCompletionJson<T>(
  systemPrompt: string,
  userMessage: string
): Promise<T> {
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
  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}
