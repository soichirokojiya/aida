import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function toJST(date: Date): string {
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function ConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { messages: true, interventions: true } },
    },
  });

  const groupMemberCounts = await prisma.groupMembership.groupBy({
    by: ["groupId"],
    _count: true,
  });
  const memberCountMap = new Map(groupMemberCounts.map(g => [g.groupId, g._count]));

  const groupSubs = await prisma.groupSubscription.findMany();
  const groupSubMap = new Map(groupSubs.map(g => [g.groupId, g.status]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">会話一覧</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>スレッドID</TableHead>
            <TableHead>種別</TableHead>
            <TableHead>人数</TableHead>
            <TableHead>契約</TableHead>
            <TableHead>最新メッセージ</TableHead>
            <TableHead>件数</TableHead>
            <TableHead>介入</TableHead>
            <TableHead>更新日時</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conv) => {
            const lastMsg = conv.messages[0];
            const isGroup = !conv.externalThreadId.startsWith("U");
            const memberCount = memberCountMap.get(conv.externalThreadId);
            const groupStatus = groupSubMap.get(conv.externalThreadId);
            return (
              <TableRow key={conv.id}>
                <TableCell>
                  <Link
                    href={`/admin/conversations/${conv.id}`}
                    className="text-blue-600 hover:underline font-mono text-xs"
                  >
                    {conv.externalThreadId}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{isGroup ? "グループ" : "DM"}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {isGroup ? (memberCount ? `${memberCount + 1}人` : "-") : "-"}
                </TableCell>
                <TableCell>
                  {isGroup ? (
                    groupStatus === "active"
                      ? <Badge className="bg-green-100 text-green-700 text-xs">有効</Badge>
                      : <span className="text-xs text-gray-400">未契約</span>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-sm max-w-md">
                  <p className="whitespace-pre-wrap break-words">{lastMsg?.text || "-"}</p>
                </TableCell>
                <TableCell className="text-sm">{conv._count.messages}</TableCell>
                <TableCell className="text-sm">{conv._count.interventions}</TableCell>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {toJST(conv.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
          {conversations.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                まだ会話がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
