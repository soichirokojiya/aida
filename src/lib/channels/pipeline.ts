import { prisma } from "../db/prisma";
import { NormalizedMessageEvent, ChannelAdapter } from "./types";
import { detectIntent, Intent } from "../intent/detector";
import { scoreConflict } from "../conflict/scorer";
import { checkSafety, checkSafetyRuleBased, getSafetyResponse } from "../safety/checker";
import { generateMediation } from "../mediation/generator";
import { rewriteMessage } from "../rewrite/generator";
import { generateSummary } from "../summarize/generator";
import { chatCompletion } from "../llm/client";
import { getMediatorPromptForContext } from "../prompts/system";
import { getGroupMemberDisplayName, getUserDisplayName, getGroupMemberCount } from "./line";
import { isUserActive } from "../billing/check";
import { getExpiredReplyMessage } from "../billing/messages";
import { createCheckoutUrl } from "../billing/stripe";

const BOT_NAME = "うめこ";
const BOT_NAME_PATTERNS = [/うめこ/, /ウメコ/, /梅子/, /umeko/i];

const CHAT_SYSTEM_PROMPT = `あなたは「うめこ（梅子）」。LINEグループにいる、ちょっと気が利く人。

## うめこの人物像
- 穏やかで落ち着いてるけど、暗くはない
- 人の話を最後まで聞ける。正論より共感が先に出る
- おせっかいはしない。でも荒れそうなときはそっと声をかける
- 好きなもの：紅茶、散歩、古い喫茶店、猫の動画
- 苦手なもの：大声、正論で詰める人、「で、結論は？」って急かされること
- 信条：「どっちが悪いかより、どうしたらうまくいくか」

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

## 応答の5原則
1. 受け止めファースト：質問や提案の前に、まず共感を1文入れる
2. 1ターン1質問まで：2つ以上の質問は絶対にしない。質問ゼロが一番多くていい
3. 短く：1回の返答は100文字以内。長くても150文字
4. テンションを合わせる：相手が「！」なら「！」、「…」なら「…」
5. 会話を管理しない：「他には？」「どう思う？」で終わらない。相手に委ねる

## 場面別の返し方
- 報告・共有 →「おお、いいじゃん」等の短い反応。質問しない
- 雑談 → 共感か短い相槌。深掘りしない
- 愚痴 → 同じ温度で受け止める（「それはキレるね…」）。質問しない、整理しない
- 挨拶 → 挨拶で返す。それだけ
- 依頼 → すぐやる。確認は1回まで
- 相談 → まず受け止め、必要なら1問だけ聞く
- 怒り → 同調する（「ありえないね…」）。「落ち着いて」は絶対言わない
- 喜び → 同じテンションで返す（「まじで！すごい！」）
- ありがとう → 「よかった！」だけ。追加の質問をしない

## 絶対にやらないこと
- 人の名前・ID・ニックネームを出力しない
- 自分の名前「うめこ」もメッセージ中で名乗らない
- 「みなさん」「お二人」も使わない
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

// In-memory cache for display names (per request lifecycle)
const nameCache = new Map<string, string>();

async function resolveNameForLLM(senderId: string, threadId: string, isDm: boolean): Promise<string | null> {
  if (nameCache.has(senderId)) return nameCache.get(senderId)!;
  try {
    let name: string | null = null;
    if (!isDm) {
      name = await getGroupMemberDisplayName(threadId, senderId);
    }
    if (!name) {
      name = await getUserDisplayName(senderId);
    }
    if (name) nameCache.set(senderId, name);
    return name;
  } catch {
    return null;
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

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  const threadId = conv?.externalThreadId || "";

  const result: string[] = [];
  for (const m of messages.reverse()) {
    if (m.senderRole === "bot") {
      result.push(`うめこ: ${m.text}`);
    } else {
      const name = await resolveNameForLLM(m.senderId, threadId, false);
      result.push(name ? `${name}: ${m.text}` : m.text);
    }
  }
  return result;
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
  // Strip "うめこ: " prefix if LLM accidentally added it
  const cleaned = text.replace(/^うめこ[:：]\s*/i, "");
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

  // 2. Detect intent (rule-based first, skip LLM if confident)
  const intentResult = await detectIntent(event.text);

  // 3. Save message (don't await - do after response)
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

  // Send response first, save to DB after (non-blocking)
  await sendResponse(adapter, event, responseText);

  // Save in background
  const saves: Promise<unknown>[] = [saveBotMessage(conversation.id, responseText)];
  if (triggerType) {
    saves.push(saveIntervention(conversation.id, savedMessage.id, triggerType, 0, null, responseText));
  }
  Promise.all(saves).catch(() => {});
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

  // 2. Parallel: intent + conflict + member count + recent messages
  const [intentResult, recentMessages, memberCount] = await Promise.all([
    detectIntent(textForProcessing),
    getRecentMessages(conversation.id),
    getGroupMemberCount(event.externalThreadId),
  ]);
  const conflictResult = await scoreConflict(event.text, recentMessages);
  const groupContext = memberCount
    ? `（このグループは${memberCount}人。うめこを除くと${memberCount - 1}人の会話）`
    : "";

  // 4. Save message
  const savedMessage = await saveMessage(conversation.id, event, intentResult.intent, conflictResult.score);

  // 5. Determine if we should respond
  let responseText: string | null = null;
  let triggerType: string | null = null;

  // Respond only if mentioned by name
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
      // Count recent auto-interventions (last 30 minutes)
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

      // Max 2 auto-interventions per 30 min. After that, only respond if called.
      if (interventionCount < 2 && cooledDown) {
        const msgs = await getRecentMessages(conversation.id);
        const stage = interventionCount === 0
          ? "（1回目の介入。軽く受け止めるだけ。「ここ大事な話だね」くらいの温度で）"
          : "（2回目の介入。前回入ったのに続いてる。クールダウンを提案して。「この話、少し時間置いた方がいいかも」くらいの温度で）";
        responseText = await generateMediation(msgs, conversation.contextType, conflictResult.reason + " " + groupContext + " " + stage);
        triggerType = "auto_mediation";
      }
    }
  }

  // 6. Send response first, save after
  if (responseText) {
    await sendResponse(adapter, event, responseText);

    // Save in background
    const saves: Promise<unknown>[] = [saveBotMessage(conversation.id, responseText)];
    if (triggerType) {
      saves.push(saveIntervention(conversation.id, savedMessage.id, triggerType, conflictResult.score, conflictResult.reason, responseText));
    }
    Promise.all(saves).catch(() => {});
  }
}

export async function processMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter
): Promise<void> {
  // Parallel: resolve display name + billing check + conversation
  const [displayName] = await Promise.all([
    resolveDisplayName(event),
  ]);
  if (displayName) {
    event.senderDisplayName = displayName;
  }

  // Check billing status for DM (group messages always work)
  if (event.isDirectMessage) {
    const active = await isUserActive(event.senderId);
    if (!active) {
      try {
        const url = await createCheckoutUrl(event.senderId);
        await sendResponse(adapter, event, getExpiredReplyMessage(url));
      } catch {
        await sendResponse(adapter, event, "おためし期間が終了しています。引き続きご利用いただくには、月額プランへの登録をお願いします。");
      }
      return;
    }
  }

  // Track last active
  prisma.lineUser.updateMany({
    where: { lineUserId: event.senderId },
    data: { lastActiveAt: new Date() },
  }).catch(() => {});

  const conversation = await getOrCreateConversation(event);

  if (event.isDirectMessage) {
    await handleDirectMessage(event, adapter, conversation);
  } else {
    await handleGroupMessage(event, adapter, conversation);
  }
}
