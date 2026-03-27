import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function toJST(date: Date): string {
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function UsersPage() {
  const users = await prisma.lineUser.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { dmSubscription: true },
  });

  // Group memberships
  const memberships = await prisma.groupMembership.findMany();
  const userGroups = new Map<string, string[]>();
  for (const m of memberships) {
    if (!userGroups.has(m.lineUserId)) userGroups.set(m.lineUserId, []);
    userGroups.get(m.lineUserId)!.push(m.groupId);
  }

  // All group subscriptions
  const allGroupSubs = await prisma.groupSubscription.findMany();
  const groupSubMap = new Map(allGroupSubs.map(g => [g.groupId, g]));

  // Groups paid by each user
  const paidGroupsByUser = new Map<string, { groupId: string; status: string }[]>();
  for (const sub of allGroupSubs) {
    if (!paidGroupsByUser.has(sub.payerLineUserId)) paidGroupsByUser.set(sub.payerLineUserId, []);
    paidGroupsByUser.get(sub.payerLineUserId)!.push({ groupId: sub.groupId, status: sub.status });
  }

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ユーザー一覧</h1>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-sm text-gray-500">合計: {users.length}人</p>
        <a href="/api/admin/export?type=users" className="text-sm text-blue-600 hover:underline">CSV出力</a>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>LINE ID</TableHead>
            <TableHead>トライアル</TableHead>
            <TableHead>DM契約</TableHead>
            <TableHead>グループ契約</TableHead>
            <TableHead>参加グループ</TableHead>
            <TableHead>最終アクティブ</TableHead>
            <TableHead>登録日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const inTrial = u.trialEndsAt > now;
            const dmStatus = u.dmSubscription?.status;
            const groups = userGroups.get(u.lineUserId) || [];
            const paidGroups = paidGroupsByUser.get(u.lineUserId) || [];
            return (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs">{u.lineUserId}</TableCell>
                <TableCell>
                  {inTrial ? (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      〜{u.trialEndsAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
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
                  {paidGroups.length > 0 ? (
                    <div className="text-xs space-y-1">
                      {paidGroups.map((g, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className={g.status === "active" ? "text-green-600" : "text-red-400"}>
                            {g.status === "active" ? "●" : "○"}
                          </span>
                          <span className="font-mono">{g.groupId.slice(0, 12)}...</span>
                          <span className="text-gray-400">({g.status})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {groups.length > 0 ? (
                    <div className="text-xs space-y-1">
                      {groups.map((gId, i) => {
                        const sub = groupSubMap.get(gId);
                        return (
                          <div key={i} className="flex items-center gap-1">
                            <span className={sub?.status === "active" ? "text-green-600" : "text-gray-400"}>
                              {sub?.status === "active" ? "●" : "○"}
                            </span>
                            <span className="font-mono">{gId.slice(0, 12)}...</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {u.lastActiveAt ? toJST(u.lastActiveAt) : "-"}
                </TableCell>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {toJST(u.createdAt)}
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
