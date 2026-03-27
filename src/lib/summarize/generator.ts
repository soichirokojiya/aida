import { chatCompletion } from "../llm/client";
import { SUMMARY_PROMPT, AGREEMENT_MEMO_PROMPT } from "../prompts/system";

export type SummaryMode = "summary" | "action_items" | "agreement_memo";

export async function generateSummary(
  messages: string[],
  mode: SummaryMode = "summary"
): Promise<string> {
  const conversation = messages.map((m, i) => `${i + 1}. ${m}`).join("\n");

  if (mode === "agreement_memo") {
    return chatCompletion(
      AGREEMENT_MEMO_PROMPT,
      `以下の会話から合意メモを作成してください:\n\n${conversation}`,
      { purpose: "summary" }
    );
  }

  if (mode === "action_items") {
    return chatCompletion(
      SUMMARY_PROMPT,
      `以下の会話からアクションアイテムを抽出してください。箇条書きで、担当者が明確なものは担当者も記載してください:\n\n${conversation}`,
      { purpose: "summary" }
    );
  }

  return chatCompletion(
    SUMMARY_PROMPT,
    `以下の会話を要約してください:\n\n${conversation}`,
    { purpose: "summary" }
  );
}
