import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function KpiPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // --- ユーザー数 ---
  const totalUsers = await prisma.lineUser.count();
  const trialUsers = await prisma.lineUser.count({ where: { billingStatus: "trial" } });
  const activeUsers = await prisma.lineUser.count({ where: { billingStatus: "active" } });
  const expiredUsers = await prisma.lineUser.count({ where: { billingStatus: "expired" } });
  const cancelledUsers = await prisma.lineUser.count({ where: { billingStatus: "cancelled" } });
  const blockedUsers = await prisma.lineUser.count({ where: { unfollowedAt: { not: null } } });

  // --- MRR ---
  const mrr = activeUsers * 980;

  // --- Churn (過去30日で expired + cancelled になったユーザー / 30日前の有料ユーザー数) ---
  const churnedLast30 = await prisma.lineUser.count({
    where: {
      billingStatus: { in: ["expired", "cancelled"] },
      updatedAt: { gte: thirtyDaysAgo },
    },
  });
  // 30日前の有料ユーザー数 ≒ 現在active + churned
  const paidBase = activeUsers + churnedLast30;
  const churnRate = paidBase > 0 ? Math.round((churnedLast30 / paidBase) * 100) : 0;

  // --- Trial→Paid 転換率 ---
  const allExpiredOrActive = await prisma.lineUser.count({
    where: { billingStatus: { in: ["active", "expired", "cancelled"] } },
  });
  const conversionRate = allExpiredOrActive > 0
    ? Math.round((activeUsers / allExpiredOrActive) * 100)
    : 0;

  // --- DAU / WAU / MAU ---
  const dau = await prisma.lineUser.count({
    where: { lastActiveAt: { gte: today } },
  });
  const wau = await prisma.lineUser.count({
    where: { lastActiveAt: { gte: sevenDaysAgo } },
  });
  const mau = await prisma.lineUser.count({
    where: { lastActiveAt: { gte: thirtyDaysAgo } },
  });

  // --- メッセージ数 ---
  const totalMessages = await prisma.message.count();
  const todayMessages = await prisma.message.count({
    where: { createdAt: { gte: today } },
  });
  const monthMessages = await prisma.message.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // --- 介入数 ---
  const totalInterventions = await prisma.intervention.count();
  const monthInterventions = await prisma.intervention.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // --- グループ数 ---
  const totalGroups = await prisma.conversation.count({
    where: { channelType: "line", externalThreadId: { not: { startsWith: "U" } } },
  });
  const dmCount = await prisma.conversation.count({
    where: { channelType: "line", externalThreadId: { startsWith: "U" } },
  });

  // --- APIコスト ---
  const monthUsage = await prisma.llmUsage.aggregate({
    where: { createdAt: { gte: thirtyDaysAgo } },
    _sum: { inputTokens: true, outputTokens: true },
    _count: true,
  });
  const monthInputCost = ((monthUsage._sum.inputTokens || 0) / 1_000_000) * 0.15;
  const monthOutputCost = ((monthUsage._sum.outputTokens || 0) / 1_000_000) * 0.60;
  const monthCostJpy = Math.round((monthInputCost + monthOutputCost) * 150);
  const costPerUser = activeUsers > 0 ? Math.round(monthCostJpy / activeUsers) : 0;

  // --- ARPU ---
  const arpu = activeUsers > 0 ? Math.round(mrr / activeUsers) : 0;

  // --- LTV (ARPU / churnRate) ---
  const ltv = churnRate > 0 ? Math.round(arpu / (churnRate / 100)) : 0;

  function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    );
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="mb-10">
        <h2 className="font-semibold text-lg mb-4">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">KPIダッシュボード</h1>

      <Section title="収益">
        <Card label="MRR" value={`¥${mrr.toLocaleString()}`} />
        <Card label="有料ユーザー" value={activeUsers} />
        <Card label="ARPU" value={`¥${arpu.toLocaleString()}`} sub="有料ユーザーあたり月額" />
        <Card label="LTV" value={ltv > 0 ? `¥${ltv.toLocaleString()}` : "-"} sub="ARPU ÷ 月次チャーン率" />
      </Section>

      <Section title="ユーザー">
        <Card label="総ユーザー" value={totalUsers} />
        <Card label="トライアル中" value={trialUsers} />
        <Card label="有料" value={activeUsers} />
        <Card label="期限切れ" value={expiredUsers} />
        <Card label="解約" value={cancelledUsers} />
        <Card label="ブロック" value={blockedUsers} />
        <Card label="転換率" value={`${conversionRate}%`} sub="トライアル→有料" />
        <Card label="月次チャーン率" value={`${churnRate}%`} sub="過去30日" />
      </Section>

      <Section title="アクティブユーザー">
        <Card label="DAU（今日）" value={dau} />
        <Card label="WAU（7日）" value={wau} />
        <Card label="MAU（30日）" value={mau} />
        <Card label="DAU/MAU" value={mau > 0 ? `${Math.round((dau / mau) * 100)}%` : "-"} sub="スティッキネス" />
      </Section>

      <Section title="利用状況">
        <Card label="今日のメッセージ" value={todayMessages} />
        <Card label="月間メッセージ" value={monthMessages.toLocaleString()} />
        <Card label="累計メッセージ" value={totalMessages.toLocaleString()} />
        <Card label="月間介入数" value={monthInterventions} />
        <Card label="累計介入数" value={totalInterventions} />
        <Card label="グループ数" value={totalGroups} />
        <Card label="DM数" value={dmCount} />
      </Section>

      <Section title="コスト">
        <Card label="月間APIコスト" value={`¥${monthCostJpy.toLocaleString()}`} />
        <Card label="月間APIコール" value={monthUsage._count.toLocaleString()} />
        <Card label="有料ユーザーあたりコスト" value={costPerUser > 0 ? `¥${costPerUser}` : "-"} sub="/月" />
        <Card label="粗利率" value={mrr > 0 ? `${Math.round(((mrr - monthCostJpy) / mrr) * 100)}%` : "-"} />
      </Section>
    </div>
  );
}
