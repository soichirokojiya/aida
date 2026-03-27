import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.lineUser.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const statusColor: Record<string, string> = {
    trial: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
    reminder_sent: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ユーザー一覧</h1>
      <p className="text-sm text-gray-500 mb-4">合計: {users.length}人</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>LINE ID</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>トライアル終了</TableHead>
            <TableHead>最終アクティブ</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead>ブロック</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-mono text-xs">{u.lineUserId.slice(0, 10)}...</TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[u.billingStatus] || "bg-gray-100"}`}>
                  {u.billingStatus}
                </span>
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {u.trialEndsAt.toLocaleDateString("ja-JP")}
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {u.lastActiveAt?.toLocaleString("ja-JP") || "-"}
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {u.createdAt.toLocaleDateString("ja-JP")}
              </TableCell>
              <TableCell className="text-xs">
                {u.unfollowedAt ? (
                  <Badge variant="destructive" className="text-xs">ブロック済</Badge>
                ) : "-"}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                まだユーザーがいません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
