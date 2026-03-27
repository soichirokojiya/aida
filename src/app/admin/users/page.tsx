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
    include: { dmSubscription: true },
  });

  const groupCounts = await prisma.groupMembership.groupBy({
    by: ["lineUserId"],
    _count: true,
  });
  const groupCountMap = new Map(groupCounts.map(g => [g.lineUserId, g._count]));

  const groupSubs = await prisma.groupSubscription.findMany({ where: { status: "active" } });
  const activeGroupIds = new Set(groupSubs.map(g => g.groupId));

  const memberships = await prisma.groupMembership.findMany();
  const userGroups = new Map<string, { groupId: string; active: boolean }[]>();
  for (const m of memberships) {
    if (!userGroups.has(m.lineUserId)) userGroups.set(m.lineUserId, []);
    userGroups.get(m.lineUserId)!.push({
      groupId: m.groupId,
      active: activeGroupIds.has(m.groupId),
    });
  }

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ユーザー一覧</h1>
      <p className="text-sm text-gray-500 mb-4">合計: {users.length}人</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>LINE ID</TableHead>
            <TableHead>トライアル</TableHead>
            <TableHead>DM契約</TableHead>
            <TableHead>参加グループ</TableHead>
            <TableHead>最終アクティブ</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead>ブロック</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const inTrial = u.trialEndsAt > now;
            const dmStatus = u.dmSubscription?.status;
            const groups = userGroups.get(u.lineUserId) || [];
            return (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs">{u.lineUserId}</TableCell>
                <TableCell>
                  {inTrial ? (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      〜{u.trialEndsAt.toLocaleDateString("ja-JP")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">終了</span>
                  )}
                </TableCell>
                <TableCell>
                  {dmStatus === "active" ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">有効</Badge>
                  ) : dmStatus === "canceled" ? (
                    <Badge className="bg-red-100 text-red-700 text-xs">解約済</Badge>
                  ) : (
                    <span className="text-xs text-gray-400">未契約</span>
                  )}
                </TableCell>
                <TableCell>
                  {groups.length > 0 ? (
                    <div className="text-xs">
                      {groups.map((g, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className={g.active ? "text-green-600" : "text-gray-400"}>
                            {g.active ? "●" : "○"}
                          </span>
                          <span className="font-mono">{g.groupId.slice(0, 15)}...</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {u.lastActiveAt?.toLocaleString("ja-JP") || "-"}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {u.createdAt.toLocaleDateString("ja-JP")}
                </TableCell>
                <TableCell className="text-xs">
                  {u.unfollowedAt ? (
                    <Badge variant="destructive" className="text-xs">ブロック</Badge>
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
