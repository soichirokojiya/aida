import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: { orderBy: { timestamp: "desc" }, take: 1 },
      interventions: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true, interventions: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">会話一覧</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>チャネル</TableHead>
            <TableHead>最新メッセージ</TableHead>
            <TableHead>メッセージ数</TableHead>
            <TableHead>介入数</TableHead>
            <TableHead>更新日時</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conv) => {
            const lastMsg = conv.messages[0];
            return (
              <TableRow key={conv.id}>
                <TableCell>
                  <Link
                    href={`/admin/conversations/${conv.id}`}
                    className="text-blue-600 hover:underline font-mono text-xs"
                  >
                    {conv.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{conv.channelType}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm">
                  {lastMsg?.text || "-"}
                </TableCell>
                <TableCell className="text-sm">{conv._count.messages}</TableCell>
                <TableCell className="text-sm">{conv._count.interventions}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  {conv.updatedAt.toLocaleString("ja-JP")}
                </TableCell>
              </TableRow>
            );
          })}
          {conversations.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                まだ会話がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
