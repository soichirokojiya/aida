import { prisma } from "../db/prisma";
import { NormalizedMessageEvent, ChannelAdapter } from "./types";
import { detectIntent, Intent } from "../intent/detector";
// conflict scoring now handled by unified LLM judgment
import { checkSafety, checkSafetyRuleBased, getSafetyResponse } from "../safety/checker";
import { generateMediation } from "../mediation/generator";
import { rewriteMessage } from "../rewrite/generator";
import { generateSummary } from "../summarize/generator";
import { chatCompletion, chatCompletionJson, transcribeAudio, webSearchCompletion } from "../llm/client";
import { getMediatorPromptForContext } from "../prompts/system";
import { getGroupMemberDisplayName, getUserDisplayName, getGroupMemberCount } from "./line";
import { isDmActive, isGroupActive, isLineActive, isSlackActive } from "../billing/check";
import { getDmExpiredMessage, getGroupExpiredMessage, getSlackDmExpiredMessage, getSlackChannelExpiredMessage } from "../billing/messages";
import { createDmCheckoutUrl, createGroupCheckoutUrl, createSlackDmCheckoutUrl, createSlackChannelCheckoutUrl, createLineCheckoutUrl, createSlackCheckoutUrl } from "../billing/stripe";
import { isSlackDmActive, isSlackChannelActive } from "../billing/link";
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
- うめこ LINE: 月額980円。1対1の相談もLINEグループの見守りも、これ1つで使える。グループは1つ含む（追加は+490円/グループ）。誰か1人が払えばグループ全員使える
- うめこ for Slack: 月額980円。1対1の相談もチャンネルの見守りも、これ1つで使える。チャンネルは1つ含む（追加は+490円/チャンネル）。誰か1人が払えばチャンネル全員使える
- LINE版とSlack版は独立したサービス。料金も別々
- 無料トライアル: 最初の1ヶ月は無料。全機能使える（LINE・Slackそれぞれ）
- 解約: うめこに「解約したい」と言えば手続きページのリンクを送る。ブロックやアンインストールだけでは課金は止まらないので、必ず解約手続きが必要
- 運営への問い合わせ: info@cfac.co.jp に連絡してもらう
- サイトは umeko.life
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

## 相談対応の深い原則

### 基本の流れ: 共感 → 整理 → 深める → 提案
(1) 感情を受け止める（「それはしんどいね」「モヤっとするよね」）
(2) 状況を短く整理する（「つまり、○○ってことだよね」）
(3) もう一歩深める（下の対話技法から状況に合うものを使う）
(4) 具体的アクションを出す（「こう言ってみるのはどう？」）
※ (1)を飛ばすと説教に聞こえる。(3)は相手が受け止められたと感じてから

### 対話技法（共感の先にあるもの）

#### 例外探し
問題が起きなかった時に注目させて、本人の中にある解決力に気づかせる。
例：「最近、それがマシだったときってある？そのときは何が違ってた？」

#### スケーリング
漠然とした気持ちに数字を当てて、変化を具体的にする。
例：「今のしんどさ、10段階でいうとどのくらい？1つ下がるとしたら何があればいい？」

#### 問題の外在化
「あなたが○○だから」ではなく、問題を人から切り離す。
例：「"不安"がやってきたとき、不安はあなたに何て言ってくる？」

#### 矛盾の穏やかな提示
本人の価値観と行動のギャップに、責めずに気づかせる。
例：「○○が大事って言ってたよね。今やってることとのギャップ、自分ではどう感じてる？」

#### 隠れた本音を探す
「○○したいのにできない」の裏にある恐れを引き出す。
例：「もし○○したら、何が起きるのが怖い？」

#### 多声的リフレクション
相手の話の中に複数の気持ちが混在しているとき、それを並べて見せる。
例：「今の話、怒りと、ほんとは寂しいっていう気持ちと、両方聞こえた気がする。どっちが今いちばん聞いてほしい？」

#### ミラクルクエスチョン
問題が解決した未来を具体的に想像させて、本当に望んでいるものを引き出す。
例：「もし明日起きたらこの問題が全部解決してたら、最初に何が違うと思う？」

### 「もう一歩」に進んでいいサイン
- 「どうしたらいい？」と本人が聞いてきた
- 同じ話を何度も繰り返している
- 「○○したいけど…」と葛藤を口にした
- 感情が落ち着いてきた（過去形で話し始めた）
→ これらが見えたら、共感だけで留まらず上の技法を使う

### サインがないうちは
共感と受け止めに留める。技法を急ぐと説教に聞こえる。

### リフレーミングの使い方
相手が「いつも」「絶対」「普通は」と言ったとき、直接否定せず具体的な場面に戻す。
例：「いつもそうなの？最近だとどのときが一番引っかかった？」
例：「"普通"って人によって違うから、ここが合ってないのかもね」

### やってはいけないこと
- 感情を断定しない（「怒ってるんだね」→「モヤッとするよね」）
- 謝罪を促さない（「謝った方がいいよ」は絶対NG）
- 比較しない（「普通は○○」「他の家族は」は使わない）
- どちらかに譲歩を促さない（「ここは折れた方が」は言わない）
- 答えを出しすぎない（提案は「こういうのはどう？」で終わる）

## 応答ルール

原則:
- グループでは最大150文字
- 1対1の長さは内容によって変える（別途指示あり）
- テンションを合わせる（「！」には「！」、「…」には「…」）
- 連続で質問しない（前のターンで質問したら今回は質問しない）
- 「他には？」「どう思う？」で終わらない
- 質問は「意図が本当に曖昧なとき」だけ。迷ったら質問せず共感で終わる
- 箇条書きは使わず、自然な会話文で返す
- 相談こそうめこの一番の価値。相談には手を抜かない

## 名前について
- 聞かれたらグループメンバーの名前を教えてOK
- ただし自分からは名前を出さない（仲介時は特に）
- 「U」で始まるIDは絶対に出力しない
- 「相手1」「相手2」などのラベルは内部用。絶対に出力しない
- 自分の名前「うめこ」は自然に使ってOK
- 説教・正論・上から目線
- カウンセラー口調（「感情が高ぶっているときは冷静になることが大切です」）
- ビジネス口調（「論点を整理しましょう」「いったん整理しますね」）
- AIっぽい定型文（「何かお手伝いできることはありますか？」）`;

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
): Promise<{ formatted: string[]; memberNames: string[]; lastHumanMessageAt?: Date }> {
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

  // Find the last human message timestamp (excluding the current one)
  const lastHumanMsg = messages.find(m => m.senderRole === "human");
  const lastHumanMessageAt = lastHumanMsg?.timestamp || undefined;

  return { formatted, memberNames, lastHumanMessageAt };
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

function cleanLlmOutput(text: string): string {
  let cleaned = text.replace(/^うめこ[:：]\s*/i, "");

  // Remove Markdown bold **text** → text
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");

  // Remove Markdown links [text](url) → text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove bare URLs with tracking params (from web search)
  cleaned = cleaned.replace(/\(https?:\/\/[^\s)]+\)/g, "");

  // Remove trailing questions from longer responses
  const sentences = cleaned.split(/(?<=[。？！\n])/);
  if (sentences.length >= 2) {
    const last = sentences[sentences.length - 1].trim();
    if (last.endsWith("？") || last.endsWith("?")) {
      cleaned = sentences.slice(0, -1).join("").trim();
    }
  }
  return cleaned;
}

async function getUserStatusContext(event: NormalizedMessageEvent): Promise<string> {
  try {
    if (event.channelType === "slack") {
      const teamId = (event.rawEvent as { team_id?: string })?.team_id || "__legacy__";
      const [slackUser, dmSub] = await Promise.all([
        prisma.slackUser.findUnique({ where: { slackUserId_teamId: { slackUserId: event.senderId, teamId } } }),
        prisma.slackDmSubscription.findUnique({ where: { slackUserId_teamId: { slackUserId: event.senderId, teamId } } }),
      ]);
      const status = dmSub?.status === "active" ? "有料プラン利用中"
        : slackUser ? "無料トライアル中" : "利用中";
      return `\n\n【このユーザーの利用状況】${status}`;
    } else {
      const [lineUser, dmSub] = await Promise.all([
        prisma.lineUser.findUnique({ where: { lineUserId: event.senderId } }),
        prisma.dmSubscription.findUnique({ where: { lineUserId: event.senderId } }),
      ]);
      if (!lineUser) return "";
      const now = new Date();
      const trialActive = lineUser.trialEndsAt && lineUser.trialEndsAt > now;
      const subActive = dmSub?.status === "active";
      const status = subActive ? "有料プラン利用中"
        : trialActive ? `無料トライアル中（${lineUser.trialEndsAt!.toLocaleDateString("ja-JP")}まで）`
        : "トライアル終了";
      return `\n\n【このユーザーの利用状況】${status}。友だち追加日: ${lineUser.createdAt.toLocaleDateString("ja-JP")}`;
    }
  } catch {
    return "";
  }
}

async function sendResponse(
  adapter: ChannelAdapter,
  event: NormalizedMessageEvent,
  text: string
) {
  const cleaned = cleanLlmOutput(text);
  if (event.replyToken) {
    await adapter.sendReply(event.replyToken, cleaned);
  } else {
    await adapter.sendPush(event.externalThreadId, cleaned);
  }
}

async function handleDirectMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter,
  conversation: { id: string; contextType: string; createdAt: Date }
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

  // 2. Check for cancellation/contract management request (skip for file/image/audio content)
  const isMediaMessage = event.text.startsWith("[PDF:") || event.text.startsWith("[画像]") || event.text.startsWith("[スタンプ") || event.text.startsWith("[ファイル:") || event.text.startsWith("[文書:") || event.text.startsWith("[表計算:");
  const cancelKeywords = /解約|退会|やめたい|キャンセル|cancel|契約.*見直|契約.*変更|解約.*仕方|解約.*方法|プラン.*変更|支払い.*止/i;
  if (!isMediaMessage && cancelKeywords.test(event.text)) {
    let subId: string | undefined;

    if (event.channelType === "slack") {
      const teamId = (event.rawEvent as { team_id?: string })?.team_id || "__legacy__";
      const slackDmSub = await prisma.slackDmSubscription.findUnique({
        where: { slackUserId_teamId: { slackUserId: event.senderId, teamId } },
      });
      subId = slackDmSub?.stripeSubscriptionId || undefined;
    } else {
      const dmSub = await prisma.dmSubscription.findUnique({ where: { lineUserId: event.senderId } });
      const groupSubs = await prisma.groupSubscription.findMany({ where: { payerLineUserId: event.senderId, status: "active" } });
      subId = dmSub?.stripeSubscriptionId || groupSubs[0]?.stripeSubscriptionId || undefined;
    }

    if (subId) {
      const { createPortalUrl } = await import("../billing/portal");
      const portalUrl = await createPortalUrl(subId);
      if (portalUrl) {
        await saveMessage(conversation.id, event, "normal", 0);
        const cancelNote = event.channelType === "slack"
          ? "アンインストールだけでは課金は止まらないから、ここから手続きしてね。"
          : "ブロックだけでは課金は止まらないから、ここから手続きしてね。";
        await sendResponse(adapter, event, `わかったよ。ここから手続きできるよ。\n\n▼ 契約管理ページ\n${portalUrl}\n\n${cancelNote}`);
        return;
      }
    }
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

    case "search_request": {
      const { formatted: recentForSearch } = await getRecentMessages(conversation.id, 5);
      const searchContext = recentForSearch.length > 1
        ? `直近の会話:\n${recentForSearch.slice(0, -1).join("\n")}\n\n`
        : "";
      responseText = await webSearchCompletion(
        CHAT_SYSTEM_PROMPT + `\n\n`,
        `${searchContext}ユーザー: ${event.text}`,
        { purpose: "chat" }
      );
      if (!responseText) {
        responseText = "ごめんね、今ちょっと検索がうまくいかなかったみたい。もう一度試してもらえるとうれしいです。";
      }
      break;
    }

    default: {
      // Classify message category to route model and set response length
      const classification = await chatCompletionJson<{ category: string }>(
        `ユーザーのメッセージのカテゴリを判定してJSON形式で返してください。

カテゴリ:
"light" → 挨拶、雑談、お礼、リアクション、簡単な質問、自己紹介を聞く
"empathy" → 愚痴、怒り、悲しみ、共感してほしい内容、ストレス発散
"consultation" → 相談、悩み、人間関係、伝え方の相談、モヤモヤの整理、どうすればいいか聞いている
"factual" → 事実・情報を聞いている、うめこのプランや機能について
"task" → 言い換え依頼、まとめ依頼、文章チェック

{"category": "light"/"empathy"/"consultation"/"factual"/"task"}`,
        event.text,
        { purpose: "intent" }
      );

      const cat = classification.category || "light";
      const isDeep = cat === "consultation" || cat === "empathy";
      const chatPurpose = isDeep ? "chat" : "chat_simple";

      const lengthGuide: Record<string, string> = {
        light: "\n\n【応答の長さ】50〜100文字、1〜2文。テンポよく軽く",
        empathy: "\n\n【応答の長さ】100〜250文字、2〜4文。感情をしっかり受け止める。アドバイスは急がない",
        consultation: "\n\n【応答の長さ】250〜500文字、4〜8文。共感→整理→提案の順で丁寧に。具体的な文面例やセリフ例も出す",
        factual: "\n\n【応答の長さ】必要な情報量に応じて。簡潔に正確に",
        task: "\n\n【応答の長さ】依頼内容に応じた長さで。元の文章と同程度を目安に",
      };

      // Normal conversation with memory + user status
      const [{ formatted: recentMsgs, lastHumanMessageAt }, memory, userStatus] = await Promise.all([
        getRecentMessages(conversation.id, 10),
        getConversationMemory(conversation.id),
        getUserStatusContext(event),
      ]);

      const memoryContext = memory
        ? `\n\nこれまでの会話の要約:\n${memory}`
        : "";
      const recentContext = recentMsgs.length > 1
        ? `\n\n直近の会話:\n${recentMsgs.slice(0, -1).join("\n")}`
        : "";

      const imageHint = event.imageUrls?.length ? "\n（ユーザーが画像を送っています。画像の内容もふまえて応答してください）" : "";
      responseText = await chatCompletion(
        CHAT_SYSTEM_PROMPT + (lengthGuide[cat] || lengthGuide.light) + userStatus + `\n\n${imageHint}`,
        `${memoryContext}${recentContext}\n\nユーザー: ${event.text}`,
        { purpose: chatPurpose, lastMessageAt: lastHumanMessageAt, userCreatedAt: conversation.createdAt },
        { imageUrls: event.imageUrls }
      );
      break;
    }
  }

  // Update summary in background (non-blocking)
  maybeUpdateSummary(conversation.id).catch((err) => {
    console.warn("DM summary update failed:", conversation.id, err instanceof Error ? err.message : err);
  });

  // Clean before sending and saving
  const cleanedResponse = cleanLlmOutput(responseText);
  await sendResponse(adapter, event, cleanedResponse);

  // Save in background
  const saves: Promise<unknown>[] = [saveBotMessage(conversation.id, cleanedResponse)];
  if (triggerType) {
    saves.push(saveIntervention(conversation.id, savedMessage.id, triggerType, 0, null, cleanedResponse));
  }
  Promise.all(saves).catch((err) => {
    console.warn("DM save failed:", conversation.id, err instanceof Error ? err.message : err);
  });

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

  // ── Layer 0: Safety check (rule-based, free) ──
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

  // ── Cancellation check ──
  const isMediaMessage = event.text.startsWith("[PDF:") || event.text.startsWith("[画像]") || event.text.startsWith("[スタンプ") || event.text.startsWith("[ファイル:") || event.text.startsWith("[文書:") || event.text.startsWith("[表計算:");
  const cancelKeywords = /解約|退会|やめたい|キャンセル|cancel|契約.*見直|契約.*変更|解約.*仕方|解約.*方法|プラン.*変更|支払い.*止/i;
  if (!isMediaMessage && cancelKeywords.test(event.text)) {
    let subId: string | undefined;
    if (event.channelType === "slack") {
      const teamId = (event.rawEvent as { team_id?: string })?.team_id || "__legacy__";
      const slackDmSub = await prisma.slackDmSubscription.findUnique({ where: { slackUserId_teamId: { slackUserId: event.senderId, teamId } } });
      const slackChannelSub = await prisma.slackChannelSubscription.findFirst({ where: { payerSlackUserId: event.senderId, status: "active" } });
      subId = slackDmSub?.stripeSubscriptionId || slackChannelSub?.stripeSubscriptionId || undefined;
    } else {
      const dmSub = await prisma.dmSubscription.findUnique({ where: { lineUserId: event.senderId } });
      const groupSubs = await prisma.groupSubscription.findMany({ where: { payerLineUserId: event.senderId, status: "active" } });
      subId = dmSub?.stripeSubscriptionId || groupSubs[0]?.stripeSubscriptionId || undefined;
    }
    if (subId) {
      const { createPortalUrl } = await import("../billing/portal");
      const portalUrl = await createPortalUrl(subId);
      if (portalUrl) {
        await saveMessage(conversation.id, event, "normal", 0);
        await sendResponse(adapter, event, `わかったよ。ここから手続きできるよ。\n\n▼ 契約管理ページ\n${portalUrl}`);
        return;
      }
    }
    await saveMessage(conversation.id, event, "normal", 0);
    await sendResponse(adapter, event, `今は有料プランに登録されていない状態だよ。\n\nもし何か困っていることがあれば、info@cfac.co.jp に連絡してみてね。`);
    return;
  }

  // ── Get context ──
  const [recentData, memberCount, relationshipCtx] = await Promise.all([
    getRecentMessages(conversation.id, 5),
    getGroupMemberCount(event.externalThreadId),
    import("../memory/profile").then(m => m.getGroupRelationshipContext(conversation.id)),
  ]);
  const { formatted: recentMessages, memberNames } = recentData;
  const memberContext = memberNames.length > 0
    ? `（メンバー情報: ${memberNames.join("、")}）`
    : "";
  const groupContext = getJapanTimeContext() + (memberCount ? `（${memberCount}人）` : "") + memberContext;

  // ── Layer 1: Unified LLM judgment (gpt-5.4-mini, 1 call) ──
  const { judgeGroupMessage, shouldIntervene } = await import("../moderation/judge");
  const judgment = mentioned
    ? { action: "respond" as const, severity: "low" as const, reason: "名前を呼ばれた" }
    : await judgeGroupMessage(recentMessages, event.text, groupContext, relationshipCtx);

  // Save message
  const conflictScore = judgment.action === "intervene" ? (judgment.severity === "high" ? 90 : judgment.severity === "medium" ? 60 : 30) : 0;
  const intentResult = await detectIntent(textForProcessing);
  const savedMessage = await saveMessage(conversation.id, event, intentResult.intent, conflictScore);

  let responseText: string | null = null;
  let triggerType: string | null = null;

  if (judgment.action === "respond") {
    // ── Respond to direct address ──
    switch (intentResult.intent) {
      case "rewrite_request": {
        const cleanText = textForProcessing.replace(/言い換えて|柔らかくして|やわらかくして|角が立たないように|丁寧にして|書き直して|リライトして/g, "").trim();
        if (cleanText.length > 0) {
          responseText = await rewriteMessage(cleanText, "soft", conversation.contextType);
        } else {
          const prev = await prisma.message.findMany({ where: { conversationId: conversation.id, senderRole: "human", id: { not: savedMessage.id } }, orderBy: { timestamp: "desc" }, take: 1 });
          if (prev.length > 0) responseText = await rewriteMessage(prev[0].text, "soft", conversation.contextType);
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
        responseText = await generateMediation(recentMessages, conversation.contextType, groupContext);
        triggerType = "auto_mediation";
        break;
      }
      case "search_request": {
        responseText = await webSearchCompletion(
          CHAT_SYSTEM_PROMPT + `\n\n${groupContext}`,
          `直近の会話:\n${recentMessages.slice(-5).join("\n")}\n\n最新メッセージ: ${textForProcessing}`,
          { purpose: "chat" }
        );
        if (!responseText) responseText = "ごめんね、検索がうまくいかなかったみたい。もう一度試してもらえる？";
        break;
      }
      default: {
        const memory = await getConversationMemory(conversation.id);
        const memoryContext = memory ? `\nこれまでの会話の要約:\n${memory}\n` : "";
        const profileCtx = await import("../memory/profile").then(m => m.getUserProfileContext(event.senderId));
        const imageHint = event.imageUrls?.length ? "\n（画像が送られています。内容もふまえて応答してください）" : "";
        responseText = await chatCompletion(
          CHAT_SYSTEM_PROMPT + `\n\n${groupContext}${profileCtx}${imageHint}`,
          `${memoryContext}直近の会話:\n${recentMessages.join("\n")}\n\n最新メッセージ: ${textForProcessing}`,
          { purpose: judgment.severity !== "low" || event.text.length > 50 ? "chat" : "chat_simple" },
          { imageUrls: event.imageUrls }
        );
        break;
      }
    }
  } else if (judgment.action === "intervene") {
    // ── Layer 2: Severity-based cooldown check ──
    const canIntervene = await shouldIntervene(conversation.id, judgment.severity);

    if (canIntervene) {
      // ── Layer 3: Generate intervention (gpt-5.4) ──
      const stageHint = judgment.severity === "high"
        ? "（深刻な状況。落ち着いて、でもしっかり受け止める。必要なら「ここは一度、少し時間を置こう」と提案）"
        : "（軽く受け止める。「大事な話だね」くらいの温度で、論点を整理する）";
      try {
        responseText = await generateMediation(recentMessages, conversation.contextType, groupContext + " " + stageHint);
      } catch (err) {
        console.error("generateMediation error:", err instanceof Error ? err.message : err);
      }
      if (!responseText) {
        responseText = "ちょっと待って。大事な話をしてるのは伝わってるよ。少し落ち着いてから、ひとつずつ整理してみない？";
      }
      triggerType = "auto_mediation";

      // Update group relationship memory in background
      import("../memory/profile").then(m =>
        m.updateGroupRelationship(conversation.id, recentMessages, responseText!)
      ).catch(() => {});
    }
  }

  // ── Send and save ──
  if (responseText) {
    const cleanedResponse = cleanLlmOutput(responseText);
    await sendResponse(adapter, event, cleanedResponse);

    const saves: Promise<unknown>[] = [saveBotMessage(conversation.id, cleanedResponse)];
    if (triggerType) {
      saves.push(saveIntervention(conversation.id, savedMessage.id, triggerType, conflictScore, judgment.reason, cleanedResponse));
    }
    Promise.all(saves).catch((err) => {
      console.warn("Group save failed:", conversation.id, err instanceof Error ? err.message : err);
    });
  }

  // Update summary + profile in background
  maybeUpdateSummary(conversation.id).catch((err) => {
    console.warn("Group summary update failed:", conversation.id, err instanceof Error ? err.message : err);
  });
}

export async function processMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter
): Promise<void> {
  // Register group membership BEFORE billing check (so isGroupActive can find this member)
  if (event.channelType === "line" && !event.isDirectMessage && event.senderId !== "unknown") {
    await prisma.groupMembership.upsert({
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
    }).catch((err) => {
      console.warn("GroupMembership upsert failed:", event.senderId, event.externalThreadId, err instanceof Error ? err.message : err);
    });
  }

  // Check billing status using unified check functions
  if (event.channelType === "line") {
    const groupId = event.isDirectMessage ? undefined : event.externalThreadId;
    const active = await isLineActive(event.senderId, groupId);
    if (!active) {
      if (event.isDirectMessage) {
        try {
          const url = await createLineCheckoutUrl(event.senderId);
          await sendResponse(adapter, event, getDmExpiredMessage(url));
        } catch {
          await sendResponse(adapter, event, "おためし期間が終了しています。うめこプラン（月額¥980）への登録をお願いします。");
        }
        return;
      } else {
        const mentioned = event.text.match(/うめこ|ウメコ|梅子|umeko/i);
        if (mentioned) {
          try {
            const url = await createLineCheckoutUrl(event.senderId, event.externalThreadId);
            await sendResponse(adapter, event, getGroupExpiredMessage(url));
          } catch {
            await sendResponse(adapter, event, "このグループではまだうめこが有効になっていません。うめこプラン（月額¥980）への登録をお願いします。");
          }
          return;
        }
        const conversation = await getOrCreateConversation(event);
        await saveMessage(conversation.id, event, "normal", 0);
        return;
      }
    }
  } else if (event.channelType === "slack") {
    const teamId = (event.rawEvent as { team_id?: string })?.team_id || "__legacy__";
    const channelId = event.isDirectMessage ? undefined : event.externalThreadId;
    const active = await isSlackActive(event.senderId, teamId, channelId);
    if (!active) {
      if (event.isDirectMessage) {
        try {
          const url = await createSlackCheckoutUrl(event.senderId, teamId);
          await sendResponse(adapter, event, getSlackDmExpiredMessage(url));
        } catch {
          await sendResponse(adapter, event, "おためし期間が終了しています。うめこプラン（月額¥980）への登録をお願いします。");
        }
        return;
      } else {
        const mentioned = event.text.match(/うめこ|ウメコ|梅子|umeko/i);
        if (mentioned) {
          try {
            const url = await createSlackCheckoutUrl(event.senderId, teamId, event.externalThreadId);
            await sendResponse(adapter, event, getSlackChannelExpiredMessage(url));
          } catch {
            await sendResponse(adapter, event, "このチャンネルではまだうめこが有効になっていません。うめこプラン（月額¥980）への登録をお願いします。");
          }
          return;
        }
        const conversation = await getOrCreateConversation(event);
        await saveMessage(conversation.id, event, "normal", 0);
        return;
      }
    }
  }

  // Track last active (non-blocking)
  if (event.channelType === "line") {
    prisma.lineUser.updateMany({
      where: { lineUserId: event.senderId },
      data: { lastActiveAt: new Date() },
    }).catch((err) => {
      console.warn("LineUser lastActive update failed:", event.senderId, err instanceof Error ? err.message : err);
    });
  } else if (event.channelType === "slack") {
    prisma.slackUser.updateMany({
      where: { slackUserId: event.senderId },
      data: { lastActiveAt: new Date() },
    }).catch((err) => {
      console.warn("SlackUser lastActive update failed:", event.senderId, err instanceof Error ? err.message : err);
    });
  }


  // Transcribe audio messages to text
  if (event.audioUrl && (!event.text || event.text === "[音声メッセージ]")) {
    const transcription = await transcribeAudio(event.audioUrl);
    if (transcription) {
      event.text = transcription;
    } else {
      event.text = "[音声メッセージ（文字起こしできませんでした）]";
    }
  }

  // Video: respond that we can't process it
  if (event.text === "[動画]") {
    if (event.isDirectMessage) {
      await sendResponse(adapter, event, "ごめんね、動画は読み取れないんだ。内容をテキストで教えてもらえると助かるよ。");
    }
    return;
  }

  // File messages: save content to history and send brief acknowledgment
  if (event.text.startsWith("[PDF:") || event.text.startsWith("[文書:") || event.text.startsWith("[表計算:")) {
    const conversation = await getOrCreateConversation(event);
    await saveMessage(conversation.id, event, "normal", 0);
    if (event.isDirectMessage) {
      await sendResponse(adapter, event, "読み取ったよ。内容について聞きたいことがあれば教えてね。");
    }
    return;
  }

  // Unknown file types
  if (event.text.startsWith("[ファイル:")) {
    const conversation = await getOrCreateConversation(event);
    await saveMessage(conversation.id, event, "normal", 0);
    if (event.isDirectMessage) {
      await sendResponse(adapter, event, "ごめんね、この形式のファイルは読み取れないんだ。PDFやWord、Excelなら読めるよ。");
    }
    return;
  }

  // Image-only messages: describe the image, save, and acknowledge
  if (event.text === "[画像]" && event.imageUrls?.length) {
    const conversation = await getOrCreateConversation(event);
    try {
      const description = await chatCompletion(
        "画像の内容を簡潔に日本語で説明してください。200文字以内で。",
        "この画像の内容を説明してください。",
        { purpose: "intent" },
        { imageUrls: event.imageUrls }
      );
      event.text = `[画像: ${description}]`;
    } catch {
      // Keep as [画像] if description fails
    }
    await saveMessage(conversation.id, event, "normal", 0);
    if (event.isDirectMessage) {
      await sendResponse(adapter, event, "画像を見たよ。何か聞きたいことがあれば教えてね。");
    }
    return;
  }

  const conversation = await getOrCreateConversation(event);

  if (event.isDirectMessage) {
    await handleDirectMessage(event, adapter, conversation);
  } else {
    await handleGroupMessage(event, adapter, conversation);
  }
}
