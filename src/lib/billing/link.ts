// Slack billing check functions (independent from LINE)

import { prisma } from "../db/prisma";

// Check if a Slack user's DM is active (trial or paid)
export async function isSlackDmActive(slackUserId: string, teamId: string): Promise<boolean> {
  const user = await prisma.slackUser.findUnique({
    where: { slackUserId_teamId: { slackUserId, teamId } },
    include: { dmSubscription: true },
  });

  if (!user) return true; // Unknown user → will be created with trial on first message

  if (user.trialEndsAt > new Date()) return true;
  if (user.dmSubscription?.status === "active") return true;

  return false;
}

// Check if a Slack channel is active
export async function isSlackChannelActive(channelId: string, senderId?: string, teamId?: string): Promise<boolean> {
  // 1. Direct check: is the sender in trial or paid?
  if (senderId && teamId) {
    const sender = await prisma.slackUser.findUnique({
      where: { slackUserId_teamId: { slackUserId: senderId, teamId } },
      include: { dmSubscription: true },
    });
    if (sender) {
      if (sender.trialEndsAt > new Date()) return true;
      if (sender.dmSubscription?.status === "active") return true;
    }
  }

  // 2. Check channel subscription
  const channelSub = await prisma.slackChannelSubscription.findUnique({
    where: { channelId },
  });

  return channelSub?.status === "active";
}
