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

// Generate role-specific DM messages for aggressor and receiver
export async function generateRoleDMs(
  recentMessages: string[],
  contextType: string,
  severity: "low" | "medium" | "high"
): Promise<{ aggressorDm: string; receiverDm: string }> {
  const basePrompt = getMediatorPromptForContext(contextType);
  const conversation = recentMessages.map((m, i) => `${i + 1}. ${m}`).join("\n");

  const stageHint = severity === "high"
    ? "（深刻な状況。いったん返信を止めて時間を置くことを提案）"
    : "（軽めの提案。「こう言い換えると伝わりやすいかも」くらい）";

  const aggressorPrompt = `あなたはグループの会話を見守っている「うめこ」です。
当事者にDMで話しかけています。グループには出しません。
この人は強い言い方になってしまっている側です。
相手の言い方がきつく伝わっている可能性があること、こう言い換えると伝わりやすいかもしれないこと、を自然な口調で提案してください。
${stageHint}
150文字以内。「次の一言の提案」に徹する。

直近の会話:
${conversation}`;

  const receiverPrompt = `あなたはグループの会話を見守っている「うめこ」です。
当事者にDMで話しかけています。グループには出しません。
この人はきつい言い方を受けている側です。
相手の言い方がきつく見えるかもしれないけど、裏にはこういう気持ちがあるのかもしれない、ということをやさしく伝えてください。
無理に我慢しなくていいこと、モヤッとしたらいつでもDMで話を聞くよ、というスタンスで。
${stageHint}
150文字以内。

直近の会話:
${conversation}`;

  console.log("generateRoleDMs called:", { messageCount: recentMessages.length, contextType, severity });
  const start = Date.now();

  try {
    const [aggressorDm, receiverDm] = await Promise.all([
      chatCompletion(basePrompt, aggressorPrompt, { purpose: "mediation" }),
      chatCompletion(basePrompt, receiverPrompt, { purpose: "mediation" }),
    ]);
    console.log("generateRoleDMs result:", { elapsed: Date.now() - start, aggressorLen: aggressorDm.length, receiverLen: receiverDm.length });
    return { aggressorDm, receiverDm };
  } catch (err) {
    console.error("generateRoleDMs error:", { elapsed: Date.now() - start, error: err instanceof Error ? err.message : err });
    throw err;
  }
}
