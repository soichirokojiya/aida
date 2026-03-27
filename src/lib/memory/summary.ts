import { prisma } from "../db/prisma";
import { chatCompletion } from "../llm/client";

const SUMMARY_THRESHOLD = 30; // Generate summary after this many unsummarized messages

const SUMMARY_PROMPT = `あなたは会話の要約を担当しています。

既存の要約と新しい会話メッセージを受け取り、統合した要約を生成してください。

ルール:
- 重要な事実、決定事項、話題の流れを優先的に残す
- メンバー間の関係性や雰囲気がわかる情報は保持する
- 日常的な挨拶や雑談の詳細は省略してよい
- 繰り返し出てくる話題やすれ違いのパターンは記録する
- 人の名前は使わず「メンバー同士」「やりとりの中で」のように書く
- 300文字以内に収める
- 日本語で出力する`;

export async function getConversationMemory(conversationId: string): Promise<string | null> {
  const latest = await prisma.conversationSummary.findFirst({
    where: { conversationId },
    orderBy: { version: "desc" },
  });
  return latest?.summary || null;
}

export async function maybeUpdateSummary(conversationId: string): Promise<void> {
  // Get latest summary
  const latest = await prisma.conversationSummary.findFirst({
    where: { conversationId },
    orderBy: { version: "desc" },
  });

  // Count messages since last summary
  const whereClause = latest
    ? { conversationId, timestamp: { gt: latest.messageRangeEnd } }
    : { conversationId };

  const unsummarizedCount = await prisma.message.count({ where: whereClause });

  if (unsummarizedCount < SUMMARY_THRESHOLD) return;

  // Get unsummarized messages
  const newMessages = await prisma.message.findMany({
    where: whereClause,
    orderBy: { timestamp: "asc" },
  });

  if (newMessages.length === 0) return;

  // Format messages for summarization (anonymous)
  const senderMap = new Map<string, string>();
  let idx = 0;
  const labels = ["A", "B", "C", "D", "E"];

  const formattedMessages = newMessages.map((m) => {
    if (m.senderRole === "bot") return `うめこ: ${m.text}`;
    if (!senderMap.has(m.senderId)) {
      senderMap.set(m.senderId, labels[idx % labels.length]);
      idx++;
    }
    return `${senderMap.get(m.senderId)}: ${m.text}`;
  });

  const previousSummary = latest?.summary || "（まだ要約なし）";

  const newSummary = await chatCompletion(
    SUMMARY_PROMPT,
    `【既存の要約】\n${previousSummary}\n\n【新しい会話（${newMessages.length}件）】\n${formattedMessages.join("\n")}`,
    { purpose: "summary", conversationId }
  );

  const lastMessage = newMessages[newMessages.length - 1];

  await prisma.conversationSummary.create({
    data: {
      conversationId,
      summary: newSummary,
      messagesCount: (latest?.messagesCount || 0) + newMessages.length,
      messageRangeEnd: lastMessage.timestamp,
      version: (latest?.version || 0) + 1,
    },
  });
}
