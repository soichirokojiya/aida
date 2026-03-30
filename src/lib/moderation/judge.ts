import { chatCompletionJson } from "../llm/client";
import { prisma } from "../db/prisma";

export interface ModerationJudgment {
  action: "ignore" | "respond" | "intervene";
  severity: "low" | "medium" | "high";
  reason: string;
  aggressorLabel?: string;  // e.g. "相手1" — the person whose tone is harsh
  receiverLabel?: string;   // e.g. "相手2" — the person on the receiving end
}

// Layer 0: OpenAI Moderation API (free)
export async function moderationCheck(text: string): Promise<{ flagged: boolean; categories: Record<string, boolean>; scores: Record<string, number> }> {
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });
    const data = await res.json();
    const result = data.results?.[0];
    return {
      flagged: result?.flagged || false,
      categories: result?.categories || {},
      scores: result?.category_scores || {},
    };
  } catch {
    return { flagged: false, categories: {}, scores: {} };
  }
}

// Layer 1: LLM judgment (gpt-5.4-mini) - unified decision
export async function judgeGroupMessage(
  recentMessages: string[],
  currentMessage: string,
  groupContext: string,
  relationshipContext?: string
): Promise<ModerationJudgment> {
  try {
    const relationshipHint = relationshipContext
      ? `\n\nグループの関係性情報:\n${relationshipContext}`
      : "";

    const result = await chatCompletionJson<ModerationJudgment>(
      `あなたはグループチャットの空気を見守る「うめこ」です。
最新のメッセージを見て、うめこが今どうすべきかをJSON形式で判定してください。

action:
- "ignore": 普通の会話。うめこは黙っている（大半のメッセージはこれ）
- "respond": うめこに話しかけている、または質問されている
- "intervene": 会話の空気が悪くなっている、感情的な衝突がある、誰かが傷つきそう

severity（interventeの場合のみ重要）:
- "low": 軽いすれ違い、ちょっとしたモヤモヤ
- "medium": 明確な不満、怒り、口論
- "high": 人格否定、最後通告、関係断絶の示唆、安全上の懸念

aggressorLabel（interventeの場合のみ）:
- 会話の中で強い言い方・攻撃的なトーンの発言者のラベル（例: "相手1"）。特定できない場合はnull

receiverLabel（interventeの場合のみ）:
- その発言を受けている相手のラベル（例: "相手2"）。特定できない場合はnull

重要な判定基準:
- たとえ1人の発言でも、強い怒りや「もう無理」「受け入れられない」「関係を見直す」等があればintervene
- 「不快」「いい加減にして」「我慢の限界」「信じられない」等の感情的に強い表現はmedium以上
- 「うめこ」「梅子」と名前を呼ばれていたらrespond
- 雑談、報告、お礼、業務連絡はignore

{"action": "ignore/respond/intervene", "severity": "low/medium/high", "reason": "判定理由を一言で", "aggressorLabel": "相手X or null", "receiverLabel": "相手Y or null"}`,
      `${groupContext}${relationshipHint}\n\n直近の会話:\n${recentMessages.slice(-5).join("\n")}\n\n最新のメッセージ: ${currentMessage}`,
      { purpose: "intent" }
    );

    return {
      action: result.action || "ignore",
      severity: result.severity || "low",
      reason: result.reason || "",
      aggressorLabel: result.aggressorLabel || undefined,
      receiverLabel: result.receiverLabel || undefined,
    };
  } catch (err) {
    console.warn("judgeGroupMessage failed:", err instanceof Error ? err.message : err);
    return { action: "ignore", severity: "low", reason: "judgment failed" };
  }
}

// Cooldown check based on severity
export async function shouldIntervene(
  conversationId: string,
  severity: "low" | "medium" | "high"
): Promise<boolean> {
  const limits: Record<string, { cooldownMs: number; maxPerThirtyMin: number }> = {
    low: { cooldownMs: 10 * 60 * 1000, maxPerThirtyMin: 1 },
    medium: { cooldownMs: 3 * 60 * 1000, maxPerThirtyMin: 3 },
    high: { cooldownMs: 0, maxPerThirtyMin: 999 },
  };

  const { cooldownMs, maxPerThirtyMin } = limits[severity];

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recentInterventions = await prisma.intervention.findMany({
    where: {
      conversationId,
      triggerType: "auto_mediation",
      createdAt: { gte: thirtyMinAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  const count = recentInterventions.length;
  if (count >= maxPerThirtyMin) return false;

  const last = recentInterventions[0];
  if (last && cooldownMs > 0 && (Date.now() - last.createdAt.getTime() < cooldownMs)) return false;

  return true;
}
