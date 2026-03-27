import { prisma } from "@/lib/db/prisma";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function UsagePage() {
  // Summary by purpose
  const usageByPurpose = await prisma.llmUsage.groupBy({
    by: ["purpose"],
    _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
    _avg: { responseTimeMs: true },
    _count: true,
  });

  // Today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayUsage = await prisma.llmUsage.aggregate({
    where: { createdAt: { gte: today } },
    _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
    _count: true,
  });

  // Total
  const totalUsage = await prisma.llmUsage.aggregate({
    _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
    _count: true,
  });

  const totalTokens = totalUsage._sum.totalTokens || 0;
  const inputTokens = totalUsage._sum.inputTokens || 0;
  const outputTokens = totalUsage._sum.outputTokens || 0;

  // Cost estimate (gpt-4o-mini pricing)
  const inputCost = (inputTokens / 1_000_000) * 0.15;
  const outputCost = (outputTokens / 1_000_000) * 0.60;
  const totalCostUsd = inputCost + outputCost;
  const totalCostJpy = Math.round(totalCostUsd * 150);

  const todayTokens = todayUsage._sum.totalTokens || 0;
  const todayInputCost = ((todayUsage._sum.inputTokens || 0) / 1_000_000) * 0.15;
  const todayOutputCost = ((todayUsage._sum.outputTokens || 0) / 1_000_000) * 0.60;
  const todayCostJpy = Math.round((todayInputCost + todayOutputCost) * 150);

  // Recent calls
  const recentCalls = await prisma.llmUsage.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">API使用量</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">今日のコール</p>
          <p className="text-2xl font-bold">{todayUsage._count}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">今日のトークン</p>
          <p className="text-2xl font-bold">{todayTokens.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">今日のコスト</p>
          <p className="text-2xl font-bold">¥{todayCostJpy}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">累計コスト</p>
          <p className="text-2xl font-bold">¥{totalCostJpy}</p>
        </div>
      </div>

      {/* By purpose */}
      <h2 className="font-semibold mb-3">用途別サマリー</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用途</TableHead>
            <TableHead>コール数</TableHead>
            <TableHead>入力トークン</TableHead>
            <TableHead>出力トークン</TableHead>
            <TableHead>平均応答時間</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usageByPurpose.map((u) => (
            <TableRow key={u.purpose}>
              <TableCell className="font-medium">{u.purpose}</TableCell>
              <TableCell>{u._count}</TableCell>
              <TableCell>{(u._sum.inputTokens || 0).toLocaleString()}</TableCell>
              <TableCell>{(u._sum.outputTokens || 0).toLocaleString()}</TableCell>
              <TableCell>{Math.round(u._avg.responseTimeMs || 0)}ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Recent calls */}
      <h2 className="font-semibold mb-3 mt-8">直近のAPI呼び出し</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>用途</TableHead>
            <TableHead>入力</TableHead>
            <TableHead>出力</TableHead>
            <TableHead>応答時間</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentCalls.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs text-gray-500">
                {c.createdAt.toLocaleString("ja-JP")}
              </TableCell>
              <TableCell className="text-sm">{c.purpose}</TableCell>
              <TableCell className="text-sm">{c.inputTokens.toLocaleString()}</TableCell>
              <TableCell className="text-sm">{c.outputTokens.toLocaleString()}</TableCell>
              <TableCell className="text-sm">{c.responseTimeMs}ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
