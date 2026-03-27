import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function toJST(date: Date): string {
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { timestamp: "asc" } },
      interventions: { orderBy: { createdAt: "asc" } },
      summaries: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!conversation) return notFound();

  const interventionMessageIds = new Set(
    conversation.interventions.map((i) => i.triggerMessageId)
  );

  const summary = conversation.summaries[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">会話詳細</h1>
        <div className="flex gap-2 text-sm text-gray-500">
          <Badge variant="outline">{conversation.channelType}</Badge>
          <span className="font-mono text-xs">{conversation.externalThreadId}</span>
        </div>
      </div>

      {summary && (
        <div className="mb-6 bg-teal-50 rounded-lg p-4 border border-teal-100">
          <p className="text-sm font-medium text-teal-700 mb-1">会話の要約（{summary.messagesCount}件分）</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <h2 className="font-semibold mb-3">メッセージ（{conversation.messages.length}件）</h2>
          {conversation.messages.map((msg) => {
            const isBot = msg.senderRole === "bot";
            const hasIntervention = interventionMessageIds.has(msg.id);
            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-sm ${
                  isBot
                    ? "bg-teal-50 border-l-4 border-teal-400"
                    : hasIntervention
                      ? "bg-yellow-50 border-l-4 border-yellow-400"
                      : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">
                    {isBot ? "うめこ" : msg.senderId}
                  </span>
                  <span className="text-xs text-gray-400">
                    {toJST(msg.timestamp)}
                  </span>
                  {msg.detectedIntent && msg.detectedIntent !== "normal" && (
                    <Badge variant="outline" className="text-xs">
                      {msg.detectedIntent}
                    </Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="font-semibold mb-3">介入履歴（{conversation.interventions.length}件）</h2>
          <div className="space-y-3">
            {conversation.interventions.map((inv) => (
              <Card key={inv.id}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge>{inv.triggerType}</Badge>
                    <span className="text-xs text-gray-400">{toJST(inv.createdAt)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-sm whitespace-pre-wrap break-words">{inv.responseText}</p>
                </CardContent>
              </Card>
            ))}
            {conversation.interventions.length === 0 && (
              <p className="text-gray-400 text-sm">介入なし</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
