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

export default async function InterventionsPage() {
  const interventions = await prisma.intervention.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { conversation: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">介入一覧</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>会話</TableHead>
            <TableHead>種別</TableHead>
            <TableHead>応答</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interventions.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                {toJST(inv.createdAt)}
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/conversations/${inv.conversationId}`}
                  className="text-blue-600 hover:underline font-mono text-xs"
                >
                  {inv.conversation.externalThreadId}
                </Link>
              </TableCell>
              <TableCell>
                <Badge>{inv.triggerType}</Badge>
              </TableCell>
              <TableCell className="max-w-lg">
                <p className="text-sm whitespace-pre-wrap break-words">{inv.responseText}</p>
              </TableCell>
            </TableRow>
          ))}
          {interventions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                まだ介入がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
