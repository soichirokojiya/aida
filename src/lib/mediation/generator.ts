import { chatCompletion } from "../llm/client";
import { getMediatorPromptForContext } from "../prompts/system";

export async function generateMediation(
  recentMessages: string[],
  contextType: string,
  conflictReason: string
): Promise<string> {
  const systemPrompt = getMediatorPromptForContext(contextType);

  const userPrompt = `以下の会話で温度が上がっています。

対立の理由: ${conflictReason}

直近の会話:
${recentMessages.map((m, i) => `${i + 1}. ${m}`).join("\n")}

中立のファシリテーターとして、温度を下げ、論点を整理し、次の一歩を提案するメッセージを生成してください。
200文字以内で、自然な日本語で出力してください。`;

  console.log("generateMediation called:", { messageCount: recentMessages.length, contextType, conflictReason: conflictReason.slice(0, 50) });
  const start = Date.now();
  try {
    const result = await chatCompletion(systemPrompt, userPrompt, { purpose: "mediation" });
    console.log("generateMediation result:", { elapsed: Date.now() - start, length: result.length, preview: result.slice(0, 50) });
    return result;
  } catch (err) {
    console.error("generateMediation error:", { elapsed: Date.now() - start, error: err instanceof Error ? err.message : err });
    throw err;
  }
}
