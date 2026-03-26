import { chatCompletionJson } from "../llm/client";
import { CONFLICT_SCORING_PROMPT } from "../prompts/system";

export type SuggestedAction =
  | "none"
  | "rewrite"
  | "summarize"
  | "soft_intervention"
  | "cooldown"
  | "ask_clarification";

export interface ConflictResult {
  score: number;
  reason: string;
  suggestedAction: SuggestedAction;
}

const NEGATIVE_PATTERNS = [
  /なんで.*(ない|できない|やらない)/,
  /いつも/,
  /絶対/,
  /ありえない/,
  /ふざけ(るな|んな)/,
  /知らない/,
  /勝手に/,
  /信じられない/,
  /最悪/,
  /ひどい/,
  /バカ/i,
  /アホ/i,
  /無理/,
  /うざい/i,
  /だから言ったのに/,
  /何回言えば/,
  /もういい/,
  /話にならない/,
];

const EXCLAMATION_WEIGHT = 3;
const NEGATIVE_WORD_WEIGHT = 8;
const LENGTH_THRESHOLD = 200;
const LONG_MESSAGE_WEIGHT = 5;

function ruleBasedScore(text: string): number {
  let score = 0;

  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(text)) {
      score += NEGATIVE_WORD_WEIGHT;
    }
  }

  const exclamations = (text.match(/[！!]{1,}/g) || []).length;
  score += exclamations * EXCLAMATION_WEIGHT;

  const questions = (text.match(/[？?]{2,}/g) || []).length;
  score += questions * 5;

  if (text.length > LENGTH_THRESHOLD) {
    score += LONG_MESSAGE_WEIGHT;
  }

  return Math.min(score, 100);
}

function suggestAction(score: number): SuggestedAction {
  if (score < 20) return "none";
  if (score < 40) return "rewrite";
  if (score < 60) return "soft_intervention";
  if (score < 80) return "cooldown";
  return "cooldown";
}

export async function scoreConflict(
  text: string,
  recentMessages?: string[]
): Promise<ConflictResult> {
  const ruleScore = ruleBasedScore(text);

  // If rule-based score is clearly low, skip LLM
  if (ruleScore < 15) {
    return {
      score: ruleScore,
      reason: "ルールベース判定: 穏やかな会話",
      suggestedAction: "none",
    };
  }

  // Use LLM for borderline or high scores
  try {
    const context = recentMessages
      ? recentMessages.slice(-5).join("\n---\n") + "\n---\n" + text
      : text;

    const llmResult = await chatCompletionJson<ConflictResult>(
      CONFLICT_SCORING_PROMPT,
      context
    );

    // Blend rule-based and LLM scores
    const blendedScore = Math.round(ruleScore * 0.4 + (llmResult.score || 0) * 0.6);

    return {
      score: Math.min(blendedScore, 100),
      reason: llmResult.reason || "LLM判定",
      suggestedAction: llmResult.suggestedAction || suggestAction(blendedScore),
    };
  } catch {
    return {
      score: ruleScore,
      reason: "ルールベース判定（LLMフォールバック）",
      suggestedAction: suggestAction(ruleScore),
    };
  }
}
