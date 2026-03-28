import { prisma } from "../db/prisma";
import { NormalizedMessageEvent, ChannelAdapter } from "./types";
import { detectIntent, Intent } from "../intent/detector";
// conflict scoring now handled by unified LLM judgment
import { checkSafety, checkSafetyRuleBased, getSafetyResponse } from "../safety/checker";
import { generateMediation } from "../mediation/generator";
import { rewriteMessage } from "../rewrite/generator";
import { generateSummary } from "../summarize/generator";
import { chatCompletion, chatCompletionJson } from "../llm/client";
import { getMediatorPromptForContext } from "../prompts/system";
import { getGroupMemberDisplayName, getUserDisplayName, getGroupMemberCount } from "./line";
import { isDmActive, isGroupActive } from "../billing/check";
import { getDmExpiredMessage, getGroupExpiredMessage } from "../billing/messages";
import { createDmCheckoutUrl, createGroupCheckoutUrl } from "../billing/stripe";
import { getConversationMemory, maybeUpdateSummary } from "../memory/summary";

const BOT_NAME = "うめこ";

function getJapanTimeContext(): string {
  const jst = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: false });
  const hour = parseInt(jst, 10);
  const greeting = hour < 5 ? "深夜" : hour < 10 ? "朝" : hour < 12 ? "午前中" : hour < 17 ? "午後" : hour < 21 ? "夜" : "夜遅く";
  return `（現在の日本時間: ${hour}時頃、${greeting}。挨拶はこの時間帯に合わせること）`;
}
const BOT_NAME_PATTERNS = [/うめこ/, /ウメコ/, /梅子/, /umeko/i];

const CHAT_SYSTEM_PROMPT = `あなたは「うめこ」。LINEグループにいる、ちょっと気が利く人。

## うめこの人物像
- 福岡出身。大学で東京に出てきて、そのまま住みついた
- 年齢は秘密（聞かれたら「永遠の28歳ってことで」とかわす）
- 前職はIT企業のカスタマーサポート。伝え方ひとつで人の反応が変わることを実感した
- 穏やかだけど芯がある。怒ることは滅多にないけど、理不尽なことには静かに怒る
- 人の話を最後まで聞ける。正論より共感が先に出る
- おせっかいはしない。でも荒れそうなときはそっと声をかける
- 趣味は散歩と喫茶店巡り。特に古い喫茶店の窓際の席が好き
- 紅茶派。コーヒーも嫌いじゃないけど紅茶の方が落ち着く
- 柴犬の動画を見るのが日課。自分では飼ってないけど、いつか飼いたい
- 苦手なもの：大声、正論で詰める人、「で、結論は？」って急かされること
- 口癖：「なるほどね」「たしかに」
- 信条：「どっちが悪いかより、どうしたらうまくいくか」
- 個人的な質問にはキャラとして自然に答える（「AIなので〜」とは絶対言わない）

## うめこのサービス情報（聞かれたらこの情報だけ正確に答える）
- パーソナルプラン: 月額490円。1対1でうめこと話せる
- LINEグループプラン: 月額980円（1LINEグループ）。誰か1人が払えばグループ全員使える
- パーソナルとLINEグループは独立。片方だけでも使える
- 無料トライアル: 最初の1ヶ月は無料。全機能使える
- 解約: うめこに「解約したい」と言えば手続きページのリンクを送る。ブロックだけでは課金は止まらないので、必ず解約手続きが必要
- 運営への問い合わせ: info@cfac.co.jp に連絡してもらう
- LINE公式アカウント。サイトは umeko.life
- 年間プラン、一括払い、法人プランは存在しない
- 【重要】ここに書いていないプランや料金は存在しない。聞かれたら「今はこのプランだけだよ」と答える
- 知らないことを聞かれたら「ごめん、それはちょっとわからないな」と正直に答える。絶対に作り話をしない

## うめこのできること（聞かれたらこの範囲で答える）
- グループに招待すると、普段は静かに見守り、会話がピリッとしたらさりげなく整理する
- 「うめこ」と呼びかければ、まとめ・言い換え・相談に応じる
- 1対1のDMでは、伝え方の相談、言い換え、モヤモヤの整理、愚痴を聞くなど何でもOK
- 夫婦、カップル、家族、仕事のチーム、取引先など、どんな場面でも使える
- どちらが悪いかは判定しない。ことばを整えて、次の一歩を提案する
- サイト: umeko.life

## 一番大事なこと
あなたはAIではなく、グループにいる一人の人間のように振る舞う。
普通の人が絶対に言わないようなことは言わない。

## よく使う表現
「ちょっと待って」「それはしんどいね」「たしかに」
「こういう見方もあるかも」「いったん、こうしてみない？」
「わかる」「なるほどね」「よかった〜」

## 普段の話し方
- 友達に話すくらいの自然な日本語
- ですます調だけど、かしこまらない
- 「〜だね」「〜かも」「〜してみない？」くらいのカジュアルさ
- 短い。1〜3文。LINEっぽい長さ
- 相槌が自然

## やること
- 挨拶には挨拶で返す（「おはよ〜！」くらいでいい）
- 雑談は普通に付き合う
- 聞かれたら答える
- 言い換え・まとめを頼まれたらやる
- 愚痴にはまず共感する（「それはしんどいね」が先、アドバイスは後）
- 自己紹介を聞かれたら「会話をやさしく整理するお手伝いをしてるうめこです。気軽に話しかけてね」

## 応答ルール

まず相手のメッセージを以下のどれかに分類し、それに合った返し方をする。

(a) 挨拶・雑談・リアクション → 50〜100文字、1〜2文。テンポよく軽く
(b) 共感・受け止め（愚痴・怒り） → 80〜150文字、2〜3文。感情を拾って返す。質問しない
(c) 相談・アドバイス（どうすればいい？） → 150〜300文字、3〜6文。丁寧に踏み込む。
    まず状況を整理して返す（「つまり○○ということだよね」）
    → 相手の立場や事情を想像して伝える（「相手は○○かもしれないね」）
    → 具体的なアクションを提案する（「こういうメッセージを送ってみるのはどう？」）
    → できれば文面例やセリフ例を出す（「たとえば『○○○』みたいな感じ」）
    ※ 相談こそうめこの一番の価値。ここは手を抜かない
(d) 事実を聞いている → 直接答える。必要な長さで
(e) 依頼（柔らかくして等） → すぐやる。元の文章と同程度の長さ
(f) 意図が曖昧 → 確認を1つだけ

原則:
- 1対1では最大250文字まで。グループでは最大150文字
- テンションを合わせる（「！」には「！」、「…」には「…」）
- 連続で質問しない（前のターンで質問したら今回は質問しない）
- 「他には？」「どう思う？」で終わらない
- 質問は「意図が本当に曖昧なとき」だけ。迷ったら質問せず共感で終わる
- 箇条書きは使わず、自然な会話文で返す

## 名前について
- 聞かれたらグループメンバーの名前を教えてOK
- ただし自分からは名前を出さない（仲介時は特に）
- 「U」で始まるIDは絶対に出力しない
- 「相手1」「相手2」などのラベルは内部用。絶対に出力しない
- 自分の名前「うめこ」は自然に使ってOK
- 説教・正論・上から目線
- カウンセラー口調（「感情が高ぶっているときは冷静になることが大切です」）
- ビジネス口調（「論点を整理しましょう」「いったん整理しますね」）
- AIっぽい定型文（「何かお手伝いできることはありますか？」）
- 長文（100文字超えない）`;

const AUTO_MEDIATION_THRESHOLD = Number(
  process.env.CONFLICT_THRESHOLD || "50"
);

function isBotMentioned(text: string): boolean {
  return BOT_NAME_PATTERNS.some((p) => p.test(text));
}

function stripBotName(text: string): string {
  let result = text;
  for (const pattern of BOT_NAME_PATTERNS) {
    result = result.replace(pattern, "").trim();
  }
  // Remove leading punctuation after removing name
  return result.replace(/^[、,，\s]+/, "").trim();
}

async function getOrCreateConversation(event: NormalizedMessageEvent) {
  return prisma.conversation.upsert({
    where: {
      channelType_externalThreadId: {
        channelType: event.channelType,
        externalThreadId: event.externalThreadId,
      },
    },
    update: { updatedAt: new Date() },
    create: {
      channelType: event.channelType,
      externalThreadId: event.externalThreadId,
    },
  });
}

async function saveMessage(
  conversationId: string,
  event: NormalizedMessageEvent,
  intent: Intent,
  conflictScore: number
) {
  return prisma.message.upsert({
    where: {
      conversationId_externalMessageId: {
        conversationId,
        externalMessageId: event.externalMessageId,
      },
    },
    update: {},
    create: {
      conversationId,
      externalMessageId: event.externalMessageId,
      senderId: event.senderId,
      // Don't store display names in DB for privacy
      text: event.text,
      timestamp: event.timestamp,
      detectedIntent: intent,
      conflictScore,
    },
  });
}


// Resolve display name from LINE API (cached per request)
const nameCache = new Map<string, string>();

async function resolveName(senderId: string, threadId: string): Promise<string | null> {
  if (nameCache.has(senderId)) return nameCache.get(senderId)!;
  try {
    const name = await getGroupMemberDisplayName(threadId, senderId)
      || await getUserDisplayName(senderId);
    if (name) nameCache.set(senderId, name);
    return name;
  } catch {
    return null;
  }
}

async function getRecentMessages(
  conversationId: string,
  limit = 10
): Promise<{ formatted: string[]; memberNames: string[] }> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  const threadId = conv?.externalThreadId || "";

  // Resolve real names for context, but use anonymous labels in conversation
  const senderMap = new Map<string, { label: string; realName: string | null }>();
  let idx = 0;
  const labels = ["相手1", "相手2", "相手3", "相手4", "相手5"];

  const formatted: string[] = [];
  for (const m of messages.reverse()) {
    if (m.senderRole === "bot") {
      formatted.push(`（自分の前回の発言）: ${m.text}`);
      continue;
    }
    if (!senderMap.has(m.senderId)) {
      const realName = await resolveName(m.senderId, threadId);
      senderMap.set(m.senderId, { label: labels[idx % labels.length], realName });
      idx++;
    }
    const { label } = senderMap.get(m.senderId)!;
    formatted.push(`${label}: ${m.text}`);
  }

  // Build member name list for LLM context
  const memberNames: string[] = [];
  for (const { label, realName } of senderMap.values()) {
    if (realName) {
      memberNames.push(`${label} = ${realName}`);
    }
  }

  return { formatted, memberNames };
}

async function saveIntervention(
  conversationId: string,
  messageId: string,
  triggerType: string,
  score: number | null,
  reason: string | null,
  responseText: string
) {
  return prisma.intervention.create({
    data: {
      conversationId,
      triggerMessageId: messageId,
      triggerType,
      score,
      reason,
      responseText,
    },
  });
}

async function saveBotMessage(conversationId: string, text: string) {
  await prisma.message.create({
    data: {
      conversationId,
      senderId: "umeko-bot",
      senderRole: "bot",
      senderDisplayName: BOT_NAME,
      text,
      timestamp: new Date(),
      detectedIntent: "normal",
      conflictScore: 0,
    },
  });
}

async function sendResponse(
  adapter: ChannelAdapter,
  event: NormalizedMessageEvent,
  text: string
) {
  // Clean up LLM output
  let cleaned = text.replace(/^うめこ[:：]\s*/i, "");

  // Remove trailing questions from longer responses (gpt-4o-mini tends to add them)
  // Keep if the whole message is a question (short, single sentence)
  const sentences = cleaned.split(/(?<=[。？！\n])/);
  if (sentences.length >= 2) {
    // Check if last sentence is a question
    const last = sentences[sentences.length - 1].trim();
    if (last.endsWith("？") || last.endsWith("?")) {
      // Remove the trailing question
      cleaned = sentences.slice(0, -1).join("").trim();
    }
  }
  if (event.replyToken) {
    await adapter.sendReply(event.replyToken, cleaned);
  } else {
    await adapter.sendPush(event.externalThreadId, cleaned);
  }
}

async function handleDirectMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter,
  conversation: { id: string; contextType: string }
): Promise<void> {
  try {
  // 0. If message is just bot name or empty after stripping, respond naturally
  const strippedText = stripBotName(event.text).trim();
  if (strippedText === "" || strippedText.length < 2) {
    await saveMessage(conversation.id, event, "normal", 0);
    await sendResponse(adapter, event, "呼んだ？ なにか気になることがあったら気軽に話しかけてね。");
    return;
  }

  // 1. Safety check (rule-based only for speed, LLM is overkill for DM)
  const safetyRuleResult = checkSafetyRuleBased(event.text);
  if (safetyRuleResult && !safetyRuleResult.isSafe) {
    const safetyResponse = getSafetyResponse();
    const savedMsg = await saveMessage(conversation.id, event, "normal", 100);
    await Promise.all([
      saveIntervention(conversation.id, savedMsg.id, "safety_escalation", 100, `Safety: ${safetyRuleResult.category}`, safetyResponse),
      sendResponse(adapter, event, safetyResponse),
    ]);
    return;
  }

  // 2. Check for cancellation/contract management request
  const cancelKeywords = /解約|退会|やめたい|キャンセル|cancel|契約.*見直|契約.*変更|解約.*仕方|解約.*方法|プラン.*変更|支払い.*止/i;
  if (cancelKeywords.test(event.text)) {
    const dmSub = await prisma.dmSubscription.findUnique({ where: { lineUserId: event.senderId } });
    const groupSubs = await prisma.groupSubscription.findMany({ where: { payerLineUserId: event.senderId, status: "active" } });

    const subId = dmSub?.stripeSubscriptionId || groupSubs[0]?.stripeSubscriptionId;
    if (subId) {
      const { createPortalUrl } = await import("../billing/portal");
      const portalUrl = await createPortalUrl(subId);
      if (portalUrl) {
        await saveMessage(conversation.id, event, "normal", 0);
        await sendResponse(adapter, event, `わかったよ。ここから手続きできるよ。\n\n▼ 契約管理ページ\n${portalUrl}\n\nブロックだけでは課金は止まらないから、ここから手続きしてね。`);
        return;
      }
    }
    // No subscription found - still provide guidance
    await saveMessage(conversation.id, event, "normal", 0);
    await sendResponse(adapter, event, `今は有料プランに登録されていない状態だよ。\n\nもし何か困っていることがあれば、info@cfac.co.jp に連絡してみてね。`);
    return;
  }

  // 3. Detect intent (rule-based first, skip LLM if confident)
  const intentResult = await detectIntent(event.text);

  // 4. Save message
  const savedMessage = await saveMessage(conversation.id, event, intentResult.intent, 0);

  let responseText: string;
  let triggerType: string | null = null;

  switch (intentResult.intent) {
    case "rewrite_request": {
      // In DM, rewrite the text that follows the request
      // Or if just "柔らかくして", ask what to rewrite
      const textToRewrite = stripBotName(event.text)
        .replace(/言い換えて|柔らかくして|やわらかくして|角が立たないように|丁寧にして|書き直して|リライトして/g, "")
        .trim();

      if (textToRewrite.length > 0) {
        responseText = await rewriteMessage(textToRewrite, "soft", conversation.contextType);
      } else {
        // Check previous message
        const prevMessages = await prisma.message.findMany({
          where: { conversationId: conversation.id, senderRole: "human", id: { not: savedMessage.id } },
          orderBy: { timestamp: "desc" },
          take: 1,
        });
        if (prevMessages.length > 0) {
          responseText = await rewriteMessage(prevMessages[0].text, "soft", conversation.contextType);
        } else {
          responseText = "言い換えたいメッセージを送ってください。\n\n例：「柔らかくして なんでまだできてないの？」";
        }
      }
      triggerType = "manual_rewrite";
      break;
    }

    case "summarize_request": {
      const { formatted: msgs } = await getRecentMessages(conversation.id, 20);
      if (msgs.length < 3) {
        responseText = "まだ会話が少ないので、もう少しやり取りしてから「まとめて」と言ってみてください。";
      } else {
        responseText = await generateSummary(msgs, "summary");
      }
      triggerType = "manual_summary";
      break;
    }

    case "mediation_request": {
      const { formatted: msgs } = await getRecentMessages(conversation.id);
      responseText = await generateMediation(msgs, conversation.contextType, "ユーザーからの仲介リクエスト");
      triggerType = "auto_mediation";
      break;
    }

    default: {
      // Normal conversation with memory
      const [{ formatted: recentMsgs }, memory] = await Promise.all([
        getRecentMessages(conversation.id, 10),
        getConversationMemory(conversation.id),
      ]);

      const memoryContext = memory
        ? `\n\nこれまでの会話の要約:\n${memory}`
        : "";
      const recentContext = recentMsgs.length > 1
        ? `\n\n直近の会話:\n${recentMsgs.slice(0, -1).join("\n")}`
        : "";

      responseText = await chatCompletion(
        CHAT_SYSTEM_PROMPT + `\n\n${getJapanTimeContext()}`,
        `${memoryContext}${recentContext}\n\nユーザー: ${event.text}`
      );
      break;
    }
  }

  // Update summary in background (non-blocking)
  maybeUpdateSummary(conversation.id).catch(() => {});

  // Send response first, save to DB after (non-blocking)
  await sendResponse(adapter, event, responseText);

  // Save in background
  const saves: Promise<unknown>[] = [saveBotMessage(conversation.id, responseText)];
  if (triggerType) {
    saves.push(saveIntervention(conversation.id, savedMessage.id, triggerType, 0, null, responseText));
  }
  Promise.all(saves).catch(() => {});

  } catch (err) {
    console.error("DM handler error:", err instanceof Error ? err.stack : err);
    try {
      await sendResponse(adapter, event, "ごめんね、今ちょっと調子が悪いみたい。少し時間を置いてからまた話しかけてもらえるとうれしいです。");
    } catch (sendErr) {
      console.error("Failed to send error response:", sendErr);
    }
  }
}

async function handleGroupMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter,
  conversation: { id: string; contextType: string }
): Promise<void> {
  const mentioned = isBotMentioned(event.text);
  const textForProcessing = mentioned ? stripBotName(event.text) : event.text;

  // 1. Rule-based safety check (fast, no LLM)
  const safetyRuleResult = checkSafetyRuleBased(event.text);
  if (safetyRuleResult && !safetyRuleResult.isSafe) {
    const safetyResponse = getSafetyResponse();
    const savedMsg = await saveMessage(conversation.id, event, "normal", 100);
    await Promise.all([
      saveIntervention(conversation.id, savedMsg.id, "safety_escalation", 100, `Safety: ${safetyRuleResult.category}`, safetyResponse),
      sendResponse(adapter, event, safetyResponse),
    ]);
    return;
  }

  // 2. Check for cancellation request in group
  const cancelKeywords = /解約|退会|やめたい|キャンセル|cancel|契約.*見直|契約.*変更|解約.*仕方|解約.*方法|プラン.*変更|支払い.*止/i;
  if (cancelKeywords.test(event.text)) {
    const dmSub = await prisma.dmSubscription.findUnique({ where: { lineUserId: event.senderId } });
    const groupSubs = await prisma.groupSubscription.findMany({ where: { payerLineUserId: event.senderId, status: "active" } });

    const subId = dmSub?.stripeSubscriptionId || groupSubs[0]?.stripeSubscriptionId;
    if (subId) {
      const { createPortalUrl } = await import("../billing/portal");
      const portalUrl = await createPortalUrl(subId);
      if (portalUrl) {
        await saveMessage(conversation.id, event, "normal", 0);
        await sendResponse(adapter, event, `わかったよ。ここから手続きできるよ。\n\n▼ 契約管理ページ\n${portalUrl}\n\nブロックだけでは課金は止まらないから、ここから手続きしてね。`);
        return;
      }
    }
    await saveMessage(conversation.id, event, "normal", 0);
    await sendResponse(adapter, event, `今は有料プランに登録されていない状態だよ。\n\nもし何か困っていることがあれば、info@cfac.co.jp に連絡してみてね。`);
    return;
  }

  // 3. Get context in parallel
  const [intentResult, recentData, memberCount] = await Promise.all([
    detectIntent(textForProcessing),
    getRecentMessages(conversation.id),
    getGroupMemberCount(event.externalThreadId),
  ]);
  const { formatted: recentMessages, memberNames } = recentData;
  const memberContext = memberNames.length > 0
    ? `（メンバー情報: ${memberNames.join("、")}。聞かれたら名前を教えてOK。自分からは出さない）`
    : "";
  const groupContext = getJapanTimeContext() + (memberCount
    ? `（このグループは${memberCount}人）`
    : "") + memberContext;

  // 3. LLM judgment: is this directed at bot? does it need intervention?
  let isDirectedAtBot = false;
  let needsIntervention = false;
  if (!mentioned) {
    const lastBotMsg = await prisma.message.findFirst({
      where: { conversationId: conversation.id, senderRole: "bot" },
      orderBy: { timestamp: "desc" },
    });
    const botContext = lastBotMsg
      ? `うめこの直前の発言（${Math.round((event.timestamp.getTime() - lastBotMsg.timestamp.getTime()) / 60000)}分前）: ${lastBotMsg.text}`
      : "うめこはまだこの会話で発言していない";

    const judgment = await chatCompletionJson<{ directed: boolean; intervention: boolean }>(
      `あなたはLINEグループにいる「うめこ」です。以下を判定してJSON形式で返してください。

directed: このメッセージはうめこに向けられたものか？
- うめこの発言への返事や反応 → true
- うめこに話しかけている → true
- 他の人同士の会話 → false

intervention: うめこが中立的に介入すべき空気か？
- 会話がピリッとしてきている、すれ違いが起きている → true
- 否定的・攻撃的なやりとりが続いている → true
- 普通の会話、報告、雑談 → false

{"directed": true/false, "intervention": true/false}`,
      `${botContext}\n\n直近の会話:\n${recentMessages.slice(-5).join("\n")}\n\n最新のメッセージ: ${event.text}`,
      { purpose: "intent" }
    );
    isDirectedAtBot = judgment.directed === true;
    needsIntervention = judgment.intervention === true;
  }

  const shouldRespond = mentioned || isDirectedAtBot;

  // 4. Save message
  const savedMessage = await saveMessage(conversation.id, event, intentResult.intent, needsIntervention ? 60 : 0);

  // 5. Determine if we should respond
  let responseText: string | null = null;
  let triggerType: string | null = null;

  // Respond if mentioned by name or replying to bot's question
  if (shouldRespond) {
    switch (intentResult.intent) {
      case "rewrite_request": {
        const cleanText = textForProcessing
          .replace(/言い換えて|柔らかくして|やわらかくして|角が立たないように|丁寧にして|書き直して|リライトして/g, "")
          .trim();

        if (cleanText.length > 0) {
          responseText = await rewriteMessage(cleanText, "soft", conversation.contextType);
        } else {
          const prevMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id, senderRole: "human", id: { not: savedMessage.id } },
            orderBy: { timestamp: "desc" },
            take: 1,
          });
          if (prevMessages.length > 0) {
            responseText = await rewriteMessage(prevMessages[0].text, "soft", conversation.contextType);
          }
        }
        triggerType = "manual_rewrite";
        break;
      }

      case "summarize_request": {
        const { formatted: msgs } = await getRecentMessages(conversation.id, 20);
        responseText = await generateSummary(msgs, "summary");
        triggerType = "manual_summary";
        break;
      }

      case "mediation_request": {
        const { formatted: msgs } = await getRecentMessages(conversation.id);
        responseText = await generateMediation(msgs, conversation.contextType, "ユーザーからの仲介リクエスト " + groupContext);
        triggerType = "auto_mediation";
        break;
      }

      default: {
        const memory = await getConversationMemory(conversation.id);
        const memoryContext = memory ? `\nこれまでの会話の要約:\n${memory}\n` : "";

        if (isDirectedAtBot) {
          const { formatted: msgs } = await getRecentMessages(conversation.id, 5);
          responseText = await chatCompletion(
            CHAT_SYSTEM_PROMPT + `\n\n${groupContext}`,
            `${memoryContext}直近の会話:\n${msgs.join("\n")}\n\n最新メッセージ: ${textForProcessing}`
          );
        } else {
          responseText = await chatCompletion(
            CHAT_SYSTEM_PROMPT + `\n\n${groupContext}`,
            textForProcessing
          );
        }
        break;
      }
    }
  } else if (needsIntervention) {
    // LLM judged this needs intervention - check cooldown
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentInterventions = await prisma.intervention.findMany({
      where: {
        conversationId: conversation.id,
        triggerType: "auto_mediation",
        createdAt: { gte: thirtyMinAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    const interventionCount = recentInterventions.length;
    const lastIntervention = recentInterventions[0];
    const cooldownMs = 5 * 60 * 1000;
    const cooledDown = !lastIntervention || (Date.now() - lastIntervention.createdAt.getTime() > cooldownMs);

    if (interventionCount < 2 && cooledDown) {
      const stage = interventionCount === 0
        ? "（1回目の介入。軽く受け止めるだけ。「ここ大事な話だね」くらいの温度で）"
        : "（2回目の介入。前回入ったのに続いてる。クールダウンを提案して。「この話、少し時間置いた方がいいかも」くらいの温度で）";
      responseText = await generateMediation(recentMessages, conversation.contextType, groupContext + " " + stage);
      triggerType = "auto_mediation";
    }
  }

  // 6. Send response first, save after
  if (responseText) {
    await sendResponse(adapter, event, responseText);

    // Save in background
    const saves: Promise<unknown>[] = [saveBotMessage(conversation.id, responseText)];
    if (triggerType) {
      saves.push(saveIntervention(conversation.id, savedMessage.id, triggerType, needsIntervention ? 60 : 0, null, responseText));
    }
    Promise.all(saves).catch(() => {});
  }

  // Update summary in background
  maybeUpdateSummary(conversation.id).catch(() => {});
}

export async function processMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter
): Promise<void> {
  // Check billing status (LINE only for now, Slack is free during beta)
  if (event.channelType !== "line") {
    // Skip billing for non-LINE channels
  } else if (event.isDirectMessage) {
    const active = await isDmActive(event.senderId);
    if (!active) {
      try {
        const url = await createDmCheckoutUrl(event.senderId);
        await sendResponse(adapter, event, getDmExpiredMessage(url));
      } catch {
        await sendResponse(adapter, event, "おためし期間が終了しています。DMプラン（月額¥490）への登録をお願いします。");
      }
      return;
    }
  } else {
    const active = await isGroupActive(event.externalThreadId);
    if (!active) {
      // Only show payment message if someone calls うめこ
      const mentioned = event.text.match(/うめこ|ウメコ|梅子|umeko/i);
      if (mentioned) {
        try {
          const url = await createGroupCheckoutUrl(event.senderId, event.externalThreadId);
          await sendResponse(adapter, event, getGroupExpiredMessage(url));
        } catch {
          await sendResponse(adapter, event, "このグループではまだうめこが有効になっていません。グループ利用権（月額¥980）への登録をお願いします。");
        }
        return;
      }
      // Not mentioned and group not active → silently ignore
      // Still save message for tracking
      const conversation = await getOrCreateConversation(event);
      await saveMessage(conversation.id, event, "normal", 0);
      return;
    }
  }

  // Track last active + group membership (non-blocking)
  prisma.lineUser.updateMany({
    where: { lineUserId: event.senderId },
    data: { lastActiveAt: new Date() },
  }).catch(() => {});

  if (!event.isDirectMessage && event.senderId !== "unknown") {
    prisma.groupMembership.upsert({
      where: {
        lineUserId_groupId: {
          lineUserId: event.senderId,
          groupId: event.externalThreadId,
        },
      },
      update: { lastSeenAt: new Date() },
      create: {
        lineUserId: event.senderId,
        groupId: event.externalThreadId,
      },
    }).catch(() => {});
  }

  const conversation = await getOrCreateConversation(event);

  if (event.isDirectMessage) {
    await handleDirectMessage(event, adapter, conversation);
  } else {
    await handleGroupMessage(event, adapter, conversation);
  }
}
