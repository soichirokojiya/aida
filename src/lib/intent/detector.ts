import { chatCompletionJson } from "../llm/client";
import { INTENT_DETECTION_PROMPT } from "../prompts/system";

export type Intent =
  | "normal"
  | "rewrite_request"
  | "summarize_request"
  | "mediation_request"
  | "search_request"
  | "conflict_signal"
  | "cooldown_needed"
  | "clarification_needed";

interface IntentResult {
  intent: Intent;
  confidence: number;
}

const REWRITE_KEYWORDS = [
  "言い換えて",
  "柔らかくして",
  "角が立たないように",
  "やわらかく",
  "丁寧にして",
  "書き直して",
  "リライトして",
];

const SUMMARY_KEYWORDS = [
  "まとめて",
  "要点整理して",
  "要約して",
  "サマリー",
  "整理して",
];

const MEDIATION_KEYWORDS = [
  "仲裁して",
  "整理して",
  "間に入って",
  "この空気やばい",
  "助けて",
  "どうすればいい",
];

const SEARCH_KEYWORDS = [
  "調べて",
  "検索して",
  "ググって",
  "最新の",
  "今の",
  "ニュース",
  "何が起きてる",
  "教えて.*について",
];

function ruleBasedDetect(text: string): IntentResult | null {
  const lower = text.toLowerCase();

  for (const kw of REWRITE_KEYWORDS) {
    if (lower.includes(kw))
      return { intent: "rewrite_request", confidence: 0.9 };
  }
  for (const kw of SUMMARY_KEYWORDS) {
    if (lower.includes(kw))
      return { intent: "summarize_request", confidence: 0.9 };
  }
  for (const kw of MEDIATION_KEYWORDS) {
    if (lower.includes(kw))
      return { intent: "mediation_request", confidence: 0.8 };
  }
  for (const kw of SEARCH_KEYWORDS) {
    if (new RegExp(kw).test(lower))
      return { intent: "search_request", confidence: 0.85 };
  }

  return null;
}

export async function detectIntent(text: string): Promise<IntentResult> {
  const ruleResult = ruleBasedDetect(text);
  if (ruleResult && ruleResult.confidence >= 0.8) {
    return ruleResult;
  }

  try {
    const llmResult = await chatCompletionJson<IntentResult>(
      INTENT_DETECTION_PROMPT,
      text,
      { purpose: "intent" }
    );
    return {
      intent: llmResult.intent || "normal",
      confidence: llmResult.confidence || 0.5,
    };
  } catch {
    return { intent: "normal", confidence: 0.3 };
  }
}
