import { chatCompletion } from "../llm/client";
import { REWRITE_PROMPT } from "../prompts/system";

export type RewriteMode =
  | "soft"
  | "business_polite"
  | "concise"
  | "neutral"
  | "assertive_but_calm";

export async function rewriteMessage(
  text: string,
  mode: RewriteMode = "soft",
  contextType: string = "unknown"
): Promise<string> {
  const modeInstructions: Record<RewriteMode, string> = {
    soft: "柔らかく、受け入れやすい表現にしてください。",
    business_polite: "ビジネスで使える丁寧な敬語表現にしてください。",
    concise: "簡潔で要点を押さえた表現にしてください。",
    neutral: "中立的で感情を抑えた表現にしてください。",
    assertive_but_calm: "自分の意見はしっかり伝えつつ、穏やかな表現にしてください。",
  };

  const contextHint =
    contextType === "family"
      ? "（家庭での会話です）"
      : contextType.startsWith("business")
        ? "（ビジネスの場面です）"
        : "";

  const userPrompt = `${contextHint}
モード: ${modeInstructions[mode]}

元のメッセージ:
${text}

言い換え後のメッセージのみを出力してください。説明は不要です。`;

  return chatCompletion(REWRITE_PROMPT, userPrompt, { purpose: "rewrite" });
}
