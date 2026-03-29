import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function toJST(date: Date): string {
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function SlackAdminPage() {
  const workspaces = await prisma.slackWorkspace.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true } },
    },
  });

  const slackUsers = await prisma.slackUser.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { workspace: true, dmSubscription: true },
  });

  // Subscriptions
  const activeDmSubs = await prisma.slackDmSubscription.count({ where: { status: "active" } });
  const activeChannelSubs = await prisma.slackChannelSubscription.count({ where: { status: "active" } });
  const channelSubs = await prisma.slackChannelSubscription.findMany({ orderBy: { createdAt: "desc" } });

  // Conversations
  const slackChannels = await prisma.conversation.count({
    where: { channelType: "slack", externalThreadId: { not: { startsWith: "D" } } },
  });
  const slackDms = await prisma.conversation.count({
    where: { channelType: "slack", externalThreadId: { startsWith: "D" } },
  });

  // MRR (unified plan = 980)
  const totalSubs = activeDmSubs + activeChannelSubs;
  const slackMrr = totalSubs * 980;

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Slack管理</h1>

      {/* サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">ワークスペース</p>
          <p className="text-2xl font-bold">{workspaces.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Slackユーザー</p>
          <p className="text-2xl font-bold">{slackUsers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">契約数</p>
          <p className="text-2xl font-bold">{totalSubs}</p>
          <p className="text-xs text-gray-400 mt-1">DM {activeDmSubs} / CH {activeChannelSubs}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Slack MRR</p>
          <p className="text-2xl font-bold">¥{slackMrr.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">¥980/月</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">チャンネル数</p>
          <p className="text-2xl font-bold">{slackChannels}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Slack DM数</p>
          <p className="text-2xl font-bold">{slackDms}</p>
        </div>
      </div>

      {/* ワークスペース一覧 */}
      <h2 className="font-semibold text-lg mb-4">ワークスペース一覧</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>チーム名</TableHead>
            <TableHead>Team ID</TableHead>
            <TableHead>インストール者</TableHead>
            <TableHead>ユーザー数</TableHead>
            <TableHead>インストール日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((ws) => (
            <TableRow key={ws.id}>
              <TableCell className="font-medium">{ws.teamName}</TableCell>
              <TableCell className="font-mono text-xs">{ws.teamId}</TableCell>
              <TableCell className="text-sm">{ws.installedByName || ws.installedByUserId || "-"}</TableCell>
              <TableCell className="text-sm">{ws._count.users}</TableCell>
              <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                {toJST(ws.createdAt)}
              </TableCell>
            </TableRow>
          ))}
          {workspaces.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                まだワークスペースがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* チャンネル契約一覧 */}
      <h2 className="font-semibold text-lg mt-10 mb-4">チャンネル契約一覧</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel ID</TableHead>
            <TableHead>Team ID</TableHead>
            <TableHead>支払者</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>契約日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channelSubs.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="font-mono text-xs">{sub.channelId}</TableCell>
              <TableCell className="font-mono text-xs">{sub.teamId}</TableCell>
              <TableCell className="font-mono text-xs">{sub.payerSlackUserId}</TableCell>
              <TableCell>
                {sub.status === "active" ? (
                  <Badge className="bg-green-100 text-green-700 text-xs">有効</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 text-xs">{sub.status}</Badge>
                )}
              </TableCell>
              <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                {toJST(sub.createdAt)}
              </TableCell>
            </TableRow>
          ))}
          {channelSubs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                まだチャンネル契約がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Slackユーザー一覧 */}
      <h2 className="font-semibold text-lg mt-10 mb-4">Slackユーザー一覧</h2>
      <p className="text-sm text-gray-500 mb-4">合計: {slackUsers.length}人</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slack User ID</TableHead>
            <TableHead>表示名</TableHead>
            <TableHead>ワークスペース</TableHead>
            <TableHead>トライアル</TableHead>
            <TableHead>DM契約</TableHead>
            <TableHead>最終アクティブ</TableHead>
            <TableHead>登録日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slackUsers.map((u) => {
            const inTrial = u.trialEndsAt > now;
            const dmStatus = u.dmSubscription?.status;
            return (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs">{u.slackUserId}</TableCell>
                <TableCell className="text-sm">{u.displayName || "-"}</TableCell>
                <TableCell className="text-sm">{u.workspace.teamName}</TableCell>
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
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {u.lastActiveAt ? toJST(u.lastActiveAt) : "-"}
                </TableCell>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {toJST(u.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
          {slackUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                まだSlackユーザーがいません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
