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
  const trialUsers = await prisma.lineUser.count({ where: { trialEndsAt: { gt: now } } });
  const blockedUsers = await prisma.lineUser.count({ where: { unfollowedAt: { not: null } } });

  // --- Slackユーザー数 ---
  const totalSlackUsers = await prisma.slackUser.count();
  const slackTrialUsers = await prisma.slackUser.count({ where: { trialEndsAt: { gt: now } } });
  const slackWorkspaces = await prisma.slackWorkspace.count();

  // --- サブスクリプション ---
  const activeDmSubs = await prisma.dmSubscription.count({ where: { status: "active" } });
  const canceledDmSubs = await prisma.dmSubscription.count({ where: { status: "canceled" } });
  const activeGroupSubs = await prisma.groupSubscription.count({ where: { status: "active" } });
  const canceledGroupSubs = await prisma.groupSubscription.count({ where: { status: "canceled" } });

  // --- MRR ---
  const dmMrr = activeDmSubs * 490;
  const groupMrr = activeGroupSubs * 980;
  const totalMrr = dmMrr + groupMrr;

  // --- Churn ---
  const churnedDm = await prisma.dmSubscription.count({
    where: { status: "canceled", updatedAt: { gte: thirtyDaysAgo } },
  });
  const churnedGroup = await prisma.groupSubscription.count({
    where: { status: "canceled", updatedAt: { gte: thirtyDaysAgo } },
  });
  const dmBase = activeDmSubs + churnedDm;
  const dmChurnRate = dmBase > 0 ? Math.round((churnedDm / dmBase) * 100) : 0;
  const groupBase = activeGroupSubs + churnedGroup;
  const groupChurnRate = groupBase > 0 ? Math.round((churnedGroup / groupBase) * 100) : 0;

  // --- DAU / WAU / MAU (LINE) ---
  const lineDau = await prisma.lineUser.count({ where: { lastActiveAt: { gte: today } } });
  const lineWau = await prisma.lineUser.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } });
  const lineMau = await prisma.lineUser.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } });

  // --- DAU / WAU / MAU (Slack) ---
  const slackDau = await prisma.slackUser.count({ where: { lastActiveAt: { gte: today } } });
  const slackWau = await prisma.slackUser.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } });
  const slackMau = await prisma.slackUser.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } });

  const dau = lineDau + slackDau;
  const wau = lineWau + slackWau;
  const mau = lineMau + slackMau;

  // --- メッセージ数 ---
  const totalMessages = await prisma.message.count();
  const todayMessages = await prisma.message.count({ where: { createdAt: { gte: today } } });
  const monthMessages = await prisma.message.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

  // --- 介入数 ---
  const totalInterventions = await prisma.intervention.count();
  const monthInterventions = await prisma.intervention.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

  // --- グループ・DM数 ---
  const lineGroups = await prisma.conversation.count({
    where: { channelType: "line", externalThreadId: { not: { startsWith: "U" } } },
  });
  const lineDms = await prisma.conversation.count({
    where: { channelType: "line", externalThreadId: { startsWith: "U" } },
  });
  const slackChannels = await prisma.conversation.count({
    where: { channelType: "slack", externalThreadId: { not: { startsWith: "D" } } },
  });
  const slackDms = await prisma.conversation.count({
    where: { channelType: "slack", externalThreadId: { startsWith: "D" } },
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
  const paidUsers = activeDmSubs + activeGroupSubs;
  const costPerPaid = paidUsers > 0 ? Math.round(monthCostJpy / paidUsers) : 0;

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
        <Card label="MRR" value={`¥${totalMrr.toLocaleString()}`} sub={`DM ¥${dmMrr} + グループ ¥${groupMrr}`} />
        <Card label="DM契約数" value={activeDmSubs} sub="¥490/月" />
        <Card label="グループ契約数" value={activeGroupSubs} sub="¥980/月" />
        <Card label="粗利率" value={totalMrr > 0 ? `${Math.round(((totalMrr - monthCostJpy) / totalMrr) * 100)}%` : "-"} />
      </Section>

      <Section title="ユーザー（LINE）">
        <Card label="LINEユーザー" value={totalUsers} />
        <Card label="トライアル中" value={trialUsers} />
        <Card label="ブロック" value={blockedUsers} />
        <Card label="DMチャーン率" value={`${dmChurnRate}%`} sub="過去30日" />
        <Card label="グループチャーン率" value={`${groupChurnRate}%`} sub="過去30日" />
        <Card label="DM解約数" value={canceledDmSubs} />
        <Card label="グループ解約数" value={canceledGroupSubs} />
      </Section>

      <Section title="ユーザー（Slack）">
        <Card label="Slackワークスペース" value={slackWorkspaces} />
        <Card label="Slackユーザー" value={totalSlackUsers} />
        <Card label="Slackトライアル中" value={slackTrialUsers} />
      </Section>

      <Section title="アクティブユーザー（合計）">
        <Card label="DAU（今日）" value={dau} sub={`LINE ${lineDau} / Slack ${slackDau}`} />
        <Card label="WAU（7日）" value={wau} sub={`LINE ${lineWau} / Slack ${slackWau}`} />
        <Card label="MAU（30日）" value={mau} sub={`LINE ${lineMau} / Slack ${slackMau}`} />
        <Card label="DAU/MAU" value={mau > 0 ? `${Math.round((dau / mau) * 100)}%` : "-"} sub="スティッキネス" />
      </Section>

      <Section title="利用状況">
        <Card label="今日のメッセージ" value={todayMessages} />
        <Card label="月間メッセージ" value={monthMessages.toLocaleString()} />
        <Card label="累計メッセージ" value={totalMessages.toLocaleString()} />
        <Card label="月間介入数" value={monthInterventions} />
        <Card label="LINEグループ" value={lineGroups} />
        <Card label="LINE DM" value={lineDms} />
        <Card label="Slackチャンネル" value={slackChannels} />
        <Card label="Slack DM" value={slackDms} />
      </Section>

      <Section title="コスト">
        <Card label="月間APIコスト" value={`¥${monthCostJpy.toLocaleString()}`} />
        <Card label="月間APIコール" value={monthUsage._count.toLocaleString()} />
        <Card label="有料契約あたりコスト" value={costPerPaid > 0 ? `¥${costPerPaid}` : "-"} sub="/月" />
      </Section>
    </div>
  );
}
