import { prisma } from "../db/prisma";
import { NormalizedMessageEvent, ChannelAdapter } from "./types";
import { detectIntent, Intent } from "../intent/detector";
import { scoreConflict, ConflictResult } from "../conflict/scorer";
import { checkSafety, getSafetyResponse } from "../safety/checker";
import { generateMediation } from "../mediation/generator";
import { rewriteMessage } from "../rewrite/generator";
import { generateSummary } from "../summarize/generator";

const AUTO_MEDIATION_THRESHOLD = Number(
  process.env.CONFLICT_THRESHOLD || "50"
);

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
    const name = m.senderDisplayName || m.senderId.slice(0, 6);
    return `${name}: ${m.text}`;
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

export async function processMessage(
  event: NormalizedMessageEvent,
  adapter: ChannelAdapter
): Promise<void> {
  // 1. Get or create conversation
  const conversation = await getOrCreateConversation(event);

  // 2. Safety check first
  const safetyResult = await checkSafety(event.text);
  if (!safetyResult.isSafe) {
    const safetyResponse = getSafetyResponse();
    const savedMsg = await saveMessage(
      conversation.id,
      event,
      "normal",
      100
    );
    await saveIntervention(
      conversation.id,
      savedMsg.id,
      "safety_escalation",
      100,
      `Safety flag: ${safetyResult.category}`,
      safetyResponse
    );
    if (event.replyToken) {
      await adapter.sendReply(event.replyToken, safetyResponse);
    }
    return;
  }

  // 3. Detect intent
  const intentResult = await detectIntent(event.text);

  // 4. Score conflict
  const recentMessages = await getRecentMessages(conversation.id);
  const conflictResult = await scoreConflict(event.text, recentMessages);

  // 5. Save message
  const savedMessage = await saveMessage(
    conversation.id,
    event,
    intentResult.intent,
    conflictResult.score
  );

  // 6. Handle based on intent
  let responseText: string | null = null;
  let triggerType: string | null = null;

  switch (intentResult.intent) {
    case "rewrite_request": {
      // Find the previous message to rewrite
      const prevMessages = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
          senderRole: "human",
          id: { not: savedMessage.id },
        },
        orderBy: { timestamp: "desc" },
        take: 1,
      });
      if (prevMessages.length > 0) {
        responseText = await rewriteMessage(
          prevMessages[0].text,
          "soft",
          conversation.contextType
        );
        triggerType = "manual_rewrite";
      }
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
      responseText = await generateMediation(
        msgs,
        conversation.contextType,
        "ユーザーからの仲介リクエスト"
      );
      triggerType = "auto_mediation";
      break;
    }

    default: {
      // Auto-mediate if conflict score is high
      if (conflictResult.score >= AUTO_MEDIATION_THRESHOLD) {
        const msgs = await getRecentMessages(conversation.id);
        responseText = await generateMediation(
          msgs,
          conversation.contextType,
          conflictResult.reason
        );
        triggerType = "auto_mediation";
      }
      break;
    }
  }

  // 7. Send response and save intervention
  if (responseText && triggerType) {
    await saveIntervention(
      conversation.id,
      savedMessage.id,
      triggerType,
      conflictResult.score,
      conflictResult.reason,
      responseText
    );

    if (event.replyToken) {
      await adapter.sendReply(event.replyToken, responseText);
    } else {
      await adapter.sendPush(event.externalThreadId, responseText);
    }

    // Save bot message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: "aida-bot",
        senderRole: "bot",
        senderDisplayName: "Aida",
        text: responseText,
        timestamp: new Date(),
        detectedIntent: "normal",
        conflictScore: 0,
      },
    });
  }
}
