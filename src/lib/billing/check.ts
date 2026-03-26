import { prisma } from "../db/prisma";
import { createCheckoutUrl } from "./stripe";
import {
  getPreReminderMessage,
  getDueReminderMessage,
  getExpiredReminderMessage,
} from "./messages";

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
  const results = { preReminder: 0, dueReminder: 0, expiredReminder: 0, expired: 0 };

  // 1. Pre-reminder: 7 days before trial ends (day 23)
  const preReminderDate = new Date(now);
  preReminderDate.setDate(preReminderDate.getDate() + 7);

  const preReminderUsers = await prisma.lineUser.findMany({
    where: {
      billingStatus: "trial",
      trialEndsAt: { lte: preReminderDate },
      lastReminderType: null,
    },
  });

  for (const user of preReminderUsers) {
    const url = user.stripeSessionUrl || (await createCheckoutUrl(user.lineUserId));
    await sendLineMessage(user.lineUserId, getPreReminderMessage(url));
    await prisma.lineUser.update({
      where: { id: user.id },
      data: {
        lastReminderType: "pre_reminder",
        lastReminderAt: now,
        stripeSessionUrl: url,
        billingStatus: "reminder_sent",
      },
    });
    results.preReminder++;
  }

  // 2. Due reminder: trial ends today (day 30)
  const dueUsers = await prisma.lineUser.findMany({
    where: {
      billingStatus: "reminder_sent",
      trialEndsAt: { lte: now },
      lastReminderType: "pre_reminder",
    },
  });

  for (const user of dueUsers) {
    const url = user.stripeSessionUrl || (await createCheckoutUrl(user.lineUserId));
    await sendLineMessage(user.lineUserId, getDueReminderMessage(url));
    await prisma.lineUser.update({
      where: { id: user.id },
      data: {
        lastReminderType: "due_reminder",
        lastReminderAt: now,
        stripeSessionUrl: url,
      },
    });
    results.dueReminder++;
  }

  // 3. Expired reminder: 3 days after trial (day 33)
  const expiredReminderDate = new Date(now);
  expiredReminderDate.setDate(expiredReminderDate.getDate() - 3);

  const expiredReminderUsers = await prisma.lineUser.findMany({
    where: {
      billingStatus: "reminder_sent",
      trialEndsAt: { lte: expiredReminderDate },
      lastReminderType: "due_reminder",
    },
  });

  for (const user of expiredReminderUsers) {
    const url = user.stripeSessionUrl || (await createCheckoutUrl(user.lineUserId));
    await sendLineMessage(user.lineUserId, getExpiredReminderMessage(url));
    await prisma.lineUser.update({
      where: { id: user.id },
      data: {
        billingStatus: "expired",
        lastReminderType: "expired_reminder",
        lastReminderAt: now,
        stripeSessionUrl: url,
      },
    });
    results.expiredReminder++;
  }

  // 4. Auto-expire users past trial with no payment (due_reminder sent but no payment after 3 days)
  const autoExpireUsers = await prisma.lineUser.findMany({
    where: {
      billingStatus: "reminder_sent",
      trialEndsAt: { lte: expiredReminderDate },
      lastReminderType: { not: "expired_reminder" },
    },
  });

  for (const user of autoExpireUsers) {
    await prisma.lineUser.update({
      where: { id: user.id },
      data: { billingStatus: "expired" },
    });
    results.expired++;
  }

  return results;
}

export async function isUserActive(lineUserId: string): Promise<boolean> {
  const user = await prisma.lineUser.findUnique({
    where: { lineUserId },
  });

  if (!user) return true; // Unknown users get a pass (group members not tracked individually)

  return user.billingStatus === "trial" ||
    user.billingStatus === "active" ||
    user.billingStatus === "reminder_sent";
}
