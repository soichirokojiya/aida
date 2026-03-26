import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
    },
  });

  if (!conversation) return notFound();

  const interventionMessageIds = new Set(
    conversation.interventions.map((i) => i.triggerMessageId)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">会話詳細</h1>
        <div className="flex gap-2 text-sm text-gray-500">
          <Badge variant="outline">{conversation.channelType}</Badge>
          <Badge variant="secondary">{conversation.contextType}</Badge>
          <span>ID: {conversation.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <h2 className="font-semibold mb-3">メッセージ</h2>
          {conversation.messages.map((msg) => {
            const isBot = msg.senderRole === "bot";
            const hasIntervention = interventionMessageIds.has(msg.id);
            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-sm ${
                  isBot
                    ? "bg-blue-50 border-l-4 border-blue-400"
                    : hasIntervention
                      ? "bg-yellow-50 border-l-4 border-yellow-400"
                      : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {msg.senderDisplayName || msg.senderId.slice(0, 8)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {msg.timestamp.toLocaleString("ja-JP")}
                  </span>
                  {msg.detectedIntent && msg.detectedIntent !== "normal" && (
                    <Badge variant="outline" className="text-xs">
                      {msg.detectedIntent}
                    </Badge>
                  )}
                  {msg.conflictScore != null && msg.conflictScore > 0 && (
                    <span
                      className={`text-xs font-mono ${
                        msg.conflictScore >= 60
                          ? "text-red-600"
                          : msg.conflictScore >= 30
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      score:{msg.conflictScore}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="font-semibold mb-3">介入履歴</h2>
          <div className="space-y-3">
            {conversation.interventions.map((inv) => (
              <Card key={inv.id}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge>{inv.triggerType}</Badge>
                    {inv.score != null && (
                      <span className="text-xs font-mono">
                        score:{inv.score}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {inv.reason && (
                    <p className="text-xs text-gray-500 mb-2">{inv.reason}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">
                    {inv.responseText}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {inv.createdAt.toLocaleString("ja-JP")}
                  </p>
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
