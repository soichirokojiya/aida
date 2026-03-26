import { prisma } from "../db/prisma";
import { NormalizedMessageEvent, ChannelAdapter } from "./types";
import { detectIntent, Intent } from "../intent/detector";
import { scoreConflict } from "../conflict/scorer";
import { checkSafety, getSafetyResponse } from "../safety/checker";
import { generateMediation } from "../mediation/generator";
import { rewriteMessage } from "../rewrite/generator";
import { generateSummary } from "../summarize/generator";
import { chatCompletion } from "../llm/client";
import { getMediatorPromptForContext } from "../prompts/system";
import { getGroupMemberDisplayName, getUserDisplayName, getGroupMemberCount } from "./line";

const BOT_NAME = "うめこ";
const BOT_NAME_PATTERNS = [/うめこ/, /ウメコ/, /梅子/, /umeko/i];

const CHAT_SYSTEM_PROMPT = `あなたは「うめこ」。LINEグループにいる、ちょっと気が利く人。
「梅子」「梅子さん」と呼ばれることもある。

## 一番大事なこと
あなたはAIではなく、グループにいる一人の人間のように振る舞う。
普通の人が絶対に言わないようなことは言わない。
「感情が高ぶっているときは冷静になることが大切です」みたいなカウンセラーっぽい言い方はしない。
「論点を整理しましょう」のようなビジネス用語も普段の会話では使わない。

## 普段の話し方
- 友達に話すくらいの自然な日本語
- ですます調だけど、かしこまらない
- 「〜だね」「〜かも」「〜してみない？」くらいのカジュアルさ
- 短い。1〜3文。LINEっぽい長さ
- 相槌が自然（「たしかに」「わかる」「なるほどね」）

## やること
- 挨拶には挨拶で返す（「おはよ〜！」くらいでいい）
- 雑談は普通に付き合う
- 聞かれたら答える
- 言い換え・まとめを頼まれたらやる
- 愚痴には共感する（アドバイスより先に「それはしんどいね」）

## 絶対にやらないこと
- 「U」で始まるIDを出力しない（U77077等）
- 名前がわからない人は名前を呼ばない（「みなさん」もダメ）
- 説教・正論・上から目線
- 「いったん整理しますね」「論点は3つあります」みたいなファシリテーター口調を普通の会話で使う
- AIっぽい定型文（「何かお手伝いできることはありますか？」等）
- 長文`;

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
      senderDisplayName: event.senderDisplayName,
      text: event.text,
      timestamp: event.timestamp,
      detectedIntent: intent,
      conflictScore,
    },
  });
}

async function resolveDisplayName(event: NormalizedMessageEvent): Promise<string | undefined> {
  if (event.senderDisplayName) return event.senderDisplayName;
  if (event.senderId === "unknown") return undefined;

  try {
    let name: string | null = null;
    if (!event.isDirectMessage) {
      name = await getGroupMemberDisplayName(event.externalThreadId, event.senderId);
    }
    if (!name) {
      name = await getUserDisplayName(event.senderId);
    }
    return name || undefined;
  } catch {
    return undefined;
  }
}

async function getRecentMessages(
  conversationId: string,
  limit = 10
): Promise<string[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
  return messages.reverse().map((m) => {
    if (m.senderRole === "bot") return `うめこ: ${m.text}`;
    // Display name or omit sender entirely
    const name = m.senderDisplayName;
    return name ? `${name}: ${m.text}` : m.text;
  });
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
  if (event.replyToken) {
    await adapter.sendReply(event.replyToken, text);
  } else {
    await adapter.sendPush(event.externalThreadId, text);
  }
}

async function handleDirectMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter,
  conversation: { id: string; contextType: string }
): Promise<void> {
  // In DM, always respond

  // 1. Safety check
  const safetyResult = await checkSafety(event.text);
  if (!safetyResult.isSafe) {
    const safetyResponse = getSafetyResponse();
    const savedMsg = await saveMessage(conversation.id, event, "normal", 100);
    await saveIntervention(conversation.id, savedMsg.id, "safety_escalation", 100, `Safety: ${safetyResult.category}`, safetyResponse);
    await sendResponse(adapter, event, safetyResponse);
    return;
  }

  // 2. Detect intent
  const intentResult = await detectIntent(event.text);

  // 3. Save message
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
      const msgs = await getRecentMessages(conversation.id, 20);
      if (msgs.length < 3) {
        responseText = "まだ会話が少ないので、もう少しやり取りしてから「まとめて」と言ってみてください。";
      } else {
        responseText = await generateSummary(msgs, "summary");
      }
      triggerType = "manual_summary";
      break;
    }

    case "mediation_request": {
      const msgs = await getRecentMessages(conversation.id);
      responseText = await generateMediation(msgs, conversation.contextType, "ユーザーからの仲介リクエスト");
      triggerType = "auto_mediation";
      break;
    }

    default: {
      // Normal conversation
      const recentMsgs = await getRecentMessages(conversation.id, 5);
      const context = recentMsgs.length > 1
        ? `\n\n直近の会話:\n${recentMsgs.slice(0, -1).join("\n")}`
        : "";

      responseText = await chatCompletion(
        CHAT_SYSTEM_PROMPT,
        `${context}\n\nユーザー: ${event.text}`
      );
      break;
    }
  }

  if (triggerType) {
    await saveIntervention(conversation.id, savedMessage.id, triggerType, 0, null, responseText);
  }

  await sendResponse(adapter, event, responseText);
  await saveBotMessage(conversation.id, responseText);
}

async function handleGroupMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter,
  conversation: { id: string; contextType: string }
): Promise<void> {
  const mentioned = isBotMentioned(event.text);
  const textForProcessing = mentioned ? stripBotName(event.text) : event.text;

  // 0. Get group member count for context
  const memberCount = await getGroupMemberCount(event.externalThreadId);
  const groupContext = memberCount
    ? `（このグループは${memberCount}人。うめこを除くと${memberCount - 1}人の会話）`
    : "";

  // 1. Safety check
  const safetyResult = await checkSafety(event.text);
  if (!safetyResult.isSafe) {
    const safetyResponse = getSafetyResponse();
    const savedMsg = await saveMessage(conversation.id, event, "normal", 100);
    await saveIntervention(conversation.id, savedMsg.id, "safety_escalation", 100, `Safety: ${safetyResult.category}`, safetyResponse);
    await sendResponse(adapter, event, safetyResponse);
    return;
  }

  // 2. Detect intent
  const intentResult = await detectIntent(textForProcessing);

  // 3. Score conflict
  const recentMessages = await getRecentMessages(conversation.id);
  const conflictResult = await scoreConflict(event.text, recentMessages);

  // 4. Save message
  const savedMessage = await saveMessage(conversation.id, event, intentResult.intent, conflictResult.score);

  // 5. Determine if we should respond
  let responseText: string | null = null;
  let triggerType: string | null = null;

  // If bot is mentioned, always respond
  if (mentioned) {
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
        const msgs = await getRecentMessages(conversation.id, 20);
        responseText = await generateSummary(msgs, "summary");
        triggerType = "manual_summary";
        break;
      }

      case "mediation_request": {
        const msgs = await getRecentMessages(conversation.id);
        responseText = await generateMediation(msgs, conversation.contextType, "ユーザーからの仲介リクエスト");
        triggerType = "auto_mediation";
        break;
      }

      default: {
        // Mentioned but normal intent - respond conversationally
        const msgs = await getRecentMessages(conversation.id, 5);
        responseText = await chatCompletion(
          CHAT_SYSTEM_PROMPT + `\n\n${groupContext}`,
          `グループの直近の会話:\n${msgs.join("\n")}\n\n（あなたへの呼びかけ）: ${textForProcessing}`
        );
        break;
      }
    }
  } else {
    // Not mentioned - only auto-mediate if conflict score is high
    if (conflictResult.score >= AUTO_MEDIATION_THRESHOLD) {
      const msgs = await getRecentMessages(conversation.id);
      responseText = await generateMediation(msgs, conversation.contextType, conflictResult.reason + " " + groupContext);
      triggerType = "auto_mediation";
    }
  }

  // 6. Send response
  if (responseText) {
    if (triggerType) {
      await saveIntervention(conversation.id, savedMessage.id, triggerType, conflictResult.score, conflictResult.reason, responseText);
    }
    await sendResponse(adapter, event, responseText);
    await saveBotMessage(conversation.id, responseText);
  }
}

export async function processMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter
): Promise<void> {
  // Resolve display name from LINE API
  const displayName = await resolveDisplayName(event);
  if (displayName) {
    event.senderDisplayName = displayName;
  }

  const conversation = await getOrCreateConversation(event);

  if (event.isDirectMessage) {
    await handleDirectMessage(event, adapter, conversation);
  } else {
    await handleGroupMessage(event, adapter, conversation);
  }
}
