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

  // Get group counts per user
  const groupCounts = await prisma.groupMembership.groupBy({
    by: ["lineUserId"],
    _count: true,
  });
  const groupCountMap = new Map(groupCounts.map(g => [g.lineUserId, g._count]));

  // Get member counts per group (how many people in each group)
  const groupMemberCounts = await prisma.groupMembership.groupBy({
    by: ["groupId"],
    _count: true,
  });
  const groupMemberMap = new Map(groupMemberCounts.map(g => [g.groupId, g._count]));

  // Get group memberships per user for detail
  const memberships = await prisma.groupMembership.findMany();
  const userGroups = new Map<string, { groupId: string; memberCount: number }[]>();
  for (const m of memberships) {
    if (!userGroups.has(m.lineUserId)) userGroups.set(m.lineUserId, []);
    userGroups.get(m.lineUserId)!.push({
      groupId: m.groupId,
      memberCount: groupMemberMap.get(m.groupId) || 0,
    });
  }

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
            <TableHead>参加グループ数</TableHead>
            <TableHead>トライアル終了</TableHead>
            <TableHead>最終アクティブ</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead>ブロック</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const groups = userGroups.get(u.lineUserId) || [];
            const groupCount = groupCounts ? (groupCountMap.get(u.lineUserId) || 0) : 0;
            return (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs">{u.lineUserId}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[u.billingStatus] || "bg-gray-100"}`}>
                    {u.billingStatus}
                  </span>
                </TableCell>
                <TableCell>
                  {groupCount > 0 ? (
                    <div>
                      <span className="font-medium">{groupCount}グループ</span>
                      <div className="text-xs text-gray-400 mt-1">
                        {groups.map((g, i) => (
                          <div key={i}>{g.groupId}（{g.memberCount + 1}人）</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">DMのみ</span>
                  )}
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
            );
          })}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                まだユーザーがいません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
