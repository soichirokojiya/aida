import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
      interventions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">会話一覧</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>タイプ</TableHead>
            <TableHead>文脈</TableHead>
            <TableHead>最新メッセージ</TableHead>
            <TableHead>スコア</TableHead>
            <TableHead>介入</TableHead>
            <TableHead>更新日時</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conv) => {
            const lastMsg = conv.messages[0];
            const lastIntervention = conv.interventions[0];
            const score = lastMsg?.conflictScore ?? 0;
            return (
              <TableRow key={conv.id}>
                <TableCell>
                  <Link
                    href={`/admin/conversations/${conv.id}`}
                    className="text-blue-600 hover:underline font-mono text-xs"
                  >
                    {conv.id.slice(0, 8)}...
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{conv.channelType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{conv.contextType}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm">
                  {lastMsg?.text || "-"}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      score >= 60
                        ? "text-red-600 font-bold"
                        : score >= 30
                          ? "text-yellow-600"
                          : "text-green-600"
                    }
                  >
                    {score}
                  </span>
                </TableCell>
                <TableCell>
                  {lastIntervention ? (
                    <Badge>{lastIntervention.triggerType}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {conv.updatedAt.toLocaleString("ja-JP")}
                </TableCell>
              </TableRow>
            );
          })}
          {conversations.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                まだ会話がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
