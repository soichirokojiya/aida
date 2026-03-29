import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await snapshotDailyMetrics();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Daily metrics snapshot error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function snapshotDailyMetrics() {
  // JST の「昨日」を対象にする（cronは毎日 0:15 UTC = 9:15 JST）
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const jstYesterday = new Date(jstNow);
  jstYesterday.setDate(jstYesterday.getDate() - 1);
  const dateStr = jstYesterday.toISOString().slice(0, 10); // YYYY-MM-DD

  const dayStart = new Date(`${dateStr}T00:00:00+09:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999+09:00`);

  // --- LINE ---
  const lineNewUsers = await prisma.lineUser.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  });
  const lineUnfollows = await prisma.lineUser.count({
    where: { unfollowedAt: { gte: dayStart, lte: dayEnd } },
  });
  const lineTrialUsers = await prisma.lineUser.count({
    where: { trialEndsAt: { gt: dayEnd } },
  });
  const lineActiveDmSubs = await prisma.dmSubscription.count({
    where: { status: "active" },
  });
  const lineActiveGroupSubs = await prisma.groupSubscription.count({
    where: { status: "active" },
  });
  const lineCanceledDmSubs = await prisma.dmSubscription.count({
    where: { status: "canceled", updatedAt: { gte: dayStart, lte: dayEnd } },
  });
  const lineCanceledGroupSubs = await prisma.groupSubscription.count({
    where: { status: "canceled", updatedAt: { gte: dayStart, lte: dayEnd } },
  });
  const lineDau = await prisma.lineUser.count({
    where: { lastActiveAt: { gte: dayStart, lte: dayEnd } },
  });

  // --- Slack ---
  const slackNewUsers = await prisma.slackUser.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  });
  const slackWorkspaces = await prisma.slackWorkspace.count();
  const slackTrialUsers = await prisma.slackUser.count({
    where: { trialEndsAt: { gt: dayEnd } },
  });
  const slackActiveDmSubs = await prisma.slackDmSubscription.count({
    where: { status: "active" },
  });
  const slackActiveChannelSubs = await prisma.slackChannelSubscription.count({
    where: { status: "active" },
  });
  const slackCanceledDmSubs = await prisma.slackDmSubscription.count({
    where: { status: "canceled", updatedAt: { gte: dayStart, lte: dayEnd } },
  });
  const slackCanceledChannelSubs = await prisma.slackChannelSubscription.count({
    where: { status: "canceled", updatedAt: { gte: dayStart, lte: dayEnd } },
  });
  const slackDau = await prisma.slackUser.count({
    where: { lastActiveAt: { gte: dayStart, lte: dayEnd } },
  });

  // --- 全体 ---
  const totalMessages = await prisma.message.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  });
  const totalInterventions = await prisma.intervention.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  });

  const lineSubs = lineActiveDmSubs + lineActiveGroupSubs;
  const slackSubs = slackActiveDmSubs + slackActiveChannelSubs;
  const mrrJpy = (lineSubs + slackSubs) * 980;

  const usage = await prisma.llmUsage.aggregate({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
    _sum: { inputTokens: true, outputTokens: true },
  });
  const inputCost = ((usage._sum.inputTokens || 0) / 1_000_000) * 0.15;
  const outputCost = ((usage._sum.outputTokens || 0) / 1_000_000) * 0.60;
  const apiCostJpy = Math.round((inputCost + outputCost) * 150);

  const dateValue = new Date(`${dateStr}T00:00:00.000Z`);

  return prisma.dailyMetric.upsert({
    where: { date: dateValue },
    create: {
      date: dateValue,
      lineNewUsers, lineUnfollows, lineTrialUsers,
      lineActiveDmSubs, lineActiveGroupSubs,
      lineCanceledDmSubs, lineCanceledGroupSubs, lineDau,
      slackNewUsers, slackWorkspaces, slackTrialUsers,
      slackActiveDmSubs, slackActiveChannelSubs,
      slackCanceledDmSubs, slackCanceledChannelSubs, slackDau,
      totalMessages, totalInterventions, mrrJpy, apiCostJpy,
    },
    update: {
      lineNewUsers, lineUnfollows, lineTrialUsers,
      lineActiveDmSubs, lineActiveGroupSubs,
      lineCanceledDmSubs, lineCanceledGroupSubs, lineDau,
      slackNewUsers, slackWorkspaces, slackTrialUsers,
      slackActiveDmSubs, slackActiveChannelSubs,
      slackCanceledDmSubs, slackCanceledChannelSubs, slackDau,
      totalMessages, totalInterventions, mrrJpy, apiCostJpy,
    },
  });
}
