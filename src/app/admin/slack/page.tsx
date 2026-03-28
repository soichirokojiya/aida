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
    include: { workspace: true },
  });

  // Slack conversations
  const slackConversations = await prisma.conversation.count({
    where: { channelType: "slack" },
  });
  const slackChannels = await prisma.conversation.count({
    where: { channelType: "slack", externalThreadId: { not: { startsWith: "D" } } },
  });
  const slackDms = await prisma.conversation.count({
    where: { channelType: "slack", externalThreadId: { startsWith: "D" } },
  });

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
          <p className="text-xs text-gray-500 mb-1">チャンネル</p>
          <p className="text-2xl font-bold">{slackChannels}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Slack DM</p>
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
            <TableHead>最終アクティブ</TableHead>
            <TableHead>登録日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slackUsers.map((u) => {
            const inTrial = u.trialEndsAt > now;
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
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                まだSlackユーザーがいません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
