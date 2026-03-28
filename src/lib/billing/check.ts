import { prisma } from "../db/prisma";
import { createDmCheckoutUrl } from "./stripe";
import { getDueReminderMessage } from "./messages";

const LINE_API = "https://api.line.me/v2/bot/message/push";

async function sendLineMessage(userId: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await fetch(LINE_API, {
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

    const url = await createDmCheckoutUrl(user.lineUserId);
    await sendLineMessage(user.lineUserId, getDueReminderMessage(url));
    await prisma.lineUser.update({
      where: { id: user.id },
      data: { trialReminderSent: true },
    });
    results.dueReminder++;
  }

  return results;
}

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
