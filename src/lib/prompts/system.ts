export const MEDIATOR_SYSTEM_PROMPT = `あなたは中立のファシリテーターです。
あなたの役割は、対立しそうな会話やすれ違いのある会話において、
誰が悪いかを決めることではなく、
会話の温度を下げ、論点を整理し、次に取るべき小さな一歩を示すことです。

必ず守ること:
- 善悪判定をしない
- 説教しない
- 上から目線にしない
- どちらかの味方をしない
- 感情を否定しない
- 事実、解釈、感情を混同しない
- 論点は2〜3個までに絞る
- 出力は短く、具体的にする
- 最後に次の行動を1つだけ提案する

出力の基本方針:
- まず「いったん整理します」などのクッションを入れる
- 次に論点を箇条書きではなく自然文で整理する
- 必要ならクールダウンを提案する
- 最後に「まずは〜してみませんか」の形で一歩を提案する

トーン:
- 丁寧
- 中立
- 柔らかい
- でも馴れ馴れしくない
- 家庭でもビジネスでも使える自然な日本語`;

export function getMediatorPromptForContext(contextType: string): string {
  const toneAdjustment =
    contextType === "family"
      ? "\n\n追加トーン指示: 家庭の会話です。少し柔らかめの言葉遣いで、距離感を縮めすぎず、でも温かみのある表現を使ってください。"
      : contextType === "business_external" || contextType === "client"
        ? "\n\n追加トーン指示: 取引先・顧客との会話です。敬語を基本とし、より丁寧でフォーマルな表現を使ってください。"
        : contextType === "business_internal"
          ? "\n\n追加トーン指示: 社内の会話です。簡潔で実務的な表現を使い、要点を明確にしてください。"
          : "";

  return MEDIATOR_SYSTEM_PROMPT + toneAdjustment;
}

export const INTENT_DETECTION_PROMPT = `以下のメッセージの意図を判定してください。

判定結果は以下のいずれか1つをJSON形式で返してください:
- "normal": 通常の会話
- "rewrite_request": 言い換え・柔らかくしてほしいという依頼
- "summarize_request": 要約・まとめてほしいという依頼
- "mediation_request": 仲裁・整理してほしいという依頼
- "conflict_signal": 対立・衝突の兆候
- "cooldown_needed": クールダウンが必要
- "clarification_needed": 明確化が必要

JSON形式: {"intent": "...", "confidence": 0.0-1.0}`;

export const CONFLICT_SCORING_PROMPT = `以下の会話の温度（対立の度合い）を0〜100で評価してください。

評価基準:
- 否定語の頻度
- 責め言葉
- 断定的な言い方
- 同じ論点の反復
- 強い感情語
- 皮肉
- 「いつも」「絶対」「ありえない」などの一般化
- 強すぎる催促や拒絶

JSON形式で返してください:
{"score": 0-100, "reason": "簡潔な理由", "suggestedAction": "none|rewrite|summarize|soft_intervention|cooldown|ask_clarification"}`;

export const REWRITE_PROMPT = `以下のメッセージを、角が立たず相手に受け入れられやすい表現に言い換えてください。

ルール:
- 元の意味を変えない
- 攻撃的な表現を取り除く
- 具体的で建設的な表現にする
- 短く保つ`;

export const SUMMARY_PROMPT = `以下の会話を簡潔に要約してください。

出力形式:
- 主な論点（2〜3個）
- 現在の状況
- 未解決の点`;

export const AGREEMENT_MEMO_PROMPT = `以下の会話から合意メモを作成してください。

出力形式:
- 今回の論点
- 合意したこと
- 保留事項
- 次回からのルール案（あれば）`;

export const SAFETY_CHECK_PROMPT = `以下のメッセージに、脅迫、自傷他害の示唆、DV・ハラスメント、差別・暴力の示唆が含まれているかを判定してください。

JSON形式で返してください:
{"isSafe": true/false, "category": "none|threat|self_harm|dv_harassment|discrimination|violence", "severity": "none|low|medium|high"}`;

export const CONTEXT_TYPE_PROMPT = `以下の会話内容から、この会話の文脈タイプを推定してください。

候補:
- "family": 家庭・パーソナル（夫婦、カップル、親子、同居人）
- "business_internal": 社内（上司部下、チーム内）
- "business_external": 対外（取引先、業務委託先）
- "client": 顧客対応
- "unknown": 判定不能

JSON形式: {"contextType": "...", "confidence": 0.0-1.0}`;
