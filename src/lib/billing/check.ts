import { prisma } from "../db/prisma";
import { createLineCheckoutUrl } from "./stripe";
import { getDueReminderMessage } from "./messages";

const LINE_API = "https://api.line.me/v2/bot/message/push";

async function sendLineMessage(userId: string, text: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  try {
    const res = await fetch(LINE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      console.error(`LINE push failed for ${userId.slice(0, 8)}: ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`LINE push error for ${userId.slice(0, 8)}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

export async function runBillingCheck() {
  const now = new Date();
  const results = { dueReminder: 0 };

  // Find users whose trial has ended and haven't been reminded yet
  const dueUsers = await prisma.lineUser.findMany({
    where: {
      trialEndsAt: { lte: now },
      trialReminderSent: false,
    },
    include: { dmSubscription: true },
  });

  for (const user of dueUsers) {
    // Skip if already has active DM subscription
    if (user.dmSubscription?.status === "active") continue;

    const url = await createLineCheckoutUrl(user.lineUserId);
    const sent = await sendLineMessage(user.lineUserId, getDueReminderMessage(url));
    if (sent) {
      await prisma.lineUser.update({
        where: { id: user.id },
        data: { trialReminderSent: true },
      });
      results.dueReminder++;
    }
  }

  return results;
}

// ── Unified billing check (new unified plan + legacy plans) ──

// Check if a LINE user has any active entitlement (trial, DM sub, Group sub, or unified)
export async function isLineActive(lineUserId: string, groupId?: string): Promise<boolean> {
  // 1. Direct check on this user: trial or any subscription
  const user = await prisma.lineUser.findUnique({
    where: { lineUserId },
    include: { dmSubscription: true },
  });

  if (!user) return true; // Unknown user gets a pass (will be created with trial)

  const now = new Date();
  if (user.trialEndsAt > now) return true;
  if (user.dmSubscription?.status === "active") return true;

  // 2. If groupId provided, check group-level entitlements
  if (groupId) {
    // Check group subscription (legacy or unified)
    const groupSub = await prisma.groupSubscription.findUnique({ where: { groupId } });
    if (groupSub?.status === "active") return true;

    // Check if any other group member has active entitlement
    const members = await prisma.groupMembership.findMany({
      where: { groupId },
      select: { lineUserId: true },
    });
    for (const member of members) {
      if (member.lineUserId === lineUserId) continue;
      const other = await prisma.lineUser.findUnique({
        where: { lineUserId: member.lineUserId },
        include: { dmSubscription: true },
      });
      if (!other) continue;
      if (other.trialEndsAt > now) return true;
      if (other.dmSubscription?.status === "active") return true;
    }
  }

  return false;
}

// Check if a Slack user has any active entitlement (trial, DM sub, Channel sub)
export async function isSlackActive(slackUserId: string, teamId: string, channelId?: string): Promise<boolean> {
  const user = await prisma.slackUser.findUnique({
    where: { slackUserId_teamId: { slackUserId, teamId } },
    include: { dmSubscription: true },
  });

  if (!user) return true; // Unknown user → will be created with trial

  const now = new Date();
  if (user.trialEndsAt > now) return true;
  if (user.dmSubscription?.status === "active") return true;

  // If channelId, check channel subscription
  if (channelId) {
    const channelSub = await prisma.slackChannelSubscription.findUnique({ where: { channelId } });
    if (channelSub?.status === "active") return true;
  }

  return false;
}

// ── Legacy billing checks (kept for backward compatibility) ──

// Check if user can use DM
export async function isDmActive(lineUserId: string): Promise<boolean> {
  const user = await prisma.lineUser.findUnique({
    where: { lineUserId },
    include: { dmSubscription: true },
  });

  if (!user) return true; // Unknown user gets a pass

  // Trial still active
  if (user.trialEndsAt > new Date()) return true;

  // Has active DM subscription
  if (user.dmSubscription?.status === "active") return true;

  return false;
}

// Check if group is active
// senderId is optional — when provided, also directly check the sender's trial/subscription
export async function isGroupActive(groupId: string, senderId?: string): Promise<boolean> {
  // 1. Direct check: is the current sender in trial or paid?
  //    This avoids dependency on GroupMembership being populated first.
  if (senderId) {
    const sender = await prisma.lineUser.findUnique({
      where: { lineUserId: senderId },
      include: { dmSubscription: true },
    });
    if (sender) {
      if (sender.trialEndsAt > new Date()) return true;
      if (sender.dmSubscription?.status === "active") return true;
    }
  }

  // 2. Check if any other registered member in this group is in trial or paid
  const members = await prisma.groupMembership.findMany({
    where: { groupId },
    select: { lineUserId: true },
  });

  for (const member of members) {
    if (member.lineUserId === senderId) continue; // Already checked above
    const user = await prisma.lineUser.findUnique({
      where: { lineUserId: member.lineUserId },
      include: { dmSubscription: true },
    });
    if (!user) continue;
    if (user.trialEndsAt > new Date()) return true;
    if (user.dmSubscription?.status === "active") return true;
  }

  // 3. Check group subscription
  const groupSub = await prisma.groupSubscription.findUnique({
    where: { groupId },
  });

  return groupSub?.status === "active";
}
