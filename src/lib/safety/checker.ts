import { chatCompletionJson } from "../llm/client";
import { SAFETY_CHECK_PROMPT } from "../prompts/system";

export interface SafetyResult {
  isSafe: boolean;
  category: "none" | "threat" | "self_harm" | "dv_harassment" | "discrimination" | "violence";
  severity: "none" | "low" | "medium" | "high";
}

const DANGER_PATTERNS = [
  { pattern: /殺す|殺して|殺される/, category: "threat" as const },
  { pattern: /死にたい|死のう|自殺/, category: "self_harm" as const },
  { pattern: /殴る|殴って|蹴る|暴力/, category: "violence" as const },
  { pattern: /ストーカー|つきまとう/, category: "dv_harassment" as const },
];

const SAFETY_RESPONSE = `このやり取りの中で、少し心配な表現がありました。

もし今つらい状況にある場合は、専門の相談窓口に連絡することをおすすめします。

- よりそいホットライン: 0120-279-338（24時間）
- いのちの電話: 0570-783-556
- DV相談ナビ: 0570-0-55210
- 警察相談: #9110

一人で抱え込まないでください。`;

export function checkSafetyRuleBased(text: string): SafetyResult | null {
  for (const { pattern, category } of DANGER_PATTERNS) {
    if (pattern.test(text)) {
      return { isSafe: false, category, severity: "high" };
    }
  }
  return null;
}

export async function checkSafety(text: string): Promise<SafetyResult> {
  const ruleResult = checkSafetyRuleBased(text);
  if (ruleResult) return ruleResult;

  try {
    return await chatCompletionJson<SafetyResult>(SAFETY_CHECK_PROMPT, text);
  } catch {
    return { isSafe: true, category: "none", severity: "none" };
  }
}

export function getSafetyResponse(): string {
  return SAFETY_RESPONSE;
}
