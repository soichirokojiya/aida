import { prisma } from "@/lib/db/prisma";
import { AnalyticsDashboard } from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const metrics = await prisma.dailyMetric.findMany({
    orderBy: { date: "asc" },
    take: 90,
  });

  const data = metrics.map((m) => ({
    date: m.date.toISOString().slice(5, 10),
    // LINE
    lineNewUsers: m.lineNewUsers,
    lineUnfollows: m.lineUnfollows,
    lineTrialUsers: m.lineTrialUsers,
    lineActiveDm: m.lineActiveDmSubs,
    lineActiveGroup: m.lineActiveGroupSubs,
    lineCanceledDm: m.lineCanceledDmSubs,
    lineCanceledGroup: m.lineCanceledGroupSubs,
    lineDau: m.lineDau,
    lineMrr: (m.lineActiveDmSubs + m.lineActiveGroupSubs) * 980,
    // Slack
    slackNewUsers: m.slackNewUsers,
    slackWorkspaces: m.slackWorkspaces,
    slackTrialUsers: m.slackTrialUsers,
    slackActiveDm: m.slackActiveDmSubs,
    slackActiveChannel: m.slackActiveChannelSubs,
    slackCanceledDm: m.slackCanceledDmSubs,
    slackCanceledChannel: m.slackCanceledChannelSubs,
    slackDau: m.slackDau,
    slackMrr: (m.slackActiveDmSubs + m.slackActiveChannelSubs) * 980,
    // 全体
    messages: m.totalMessages,
    interventions: m.totalInterventions,
    mrr: m.mrrJpy,
    apiCost: m.apiCostJpy,
  }));

  return <AnalyticsDashboard data={data} />;
}
