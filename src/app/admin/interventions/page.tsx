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

export default async function InterventionsPage() {
  const interventions = await prisma.intervention.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      conversation: true,
    },
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
            <TableHead>スコア</TableHead>
            <TableHead>理由</TableHead>
            <TableHead>応答</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interventions.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                {inv.createdAt.toLocaleString("ja-JP")}
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/conversations/${inv.conversationId}`}
                  className="text-blue-600 hover:underline font-mono text-xs"
                >
                  {inv.conversationId.slice(0, 8)}...
                </Link>
              </TableCell>
              <TableCell>
                <Badge>{inv.triggerType}</Badge>
              </TableCell>
              <TableCell>
                {inv.score != null ? (
                  <span
                    className={
                      inv.score >= 60
                        ? "text-red-600 font-bold"
                        : inv.score >= 30
                          ? "text-yellow-600"
                          : "text-green-600"
                    }
                  >
                    {inv.score}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm">
                {inv.reason || "-"}
              </TableCell>
              <TableCell className="max-w-sm truncate text-sm">
                {inv.responseText}
              </TableCell>
            </TableRow>
          ))}
          {interventions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                まだ介入がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
