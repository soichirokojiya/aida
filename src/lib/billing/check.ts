import { prisma } from "../db/prisma";
import { createCheckoutUrl } from "./stripe";
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
  const results = { dueReminder: 0, expired: 0 };

  // 1. Trial ended today → send one reminder with payment link
  const dueUsers = await prisma.lineUser.findMany({
    where: {
      billingStatus: "trial",
      trialEndsAt: { lte: now },
    },
  });

  for (const user of dueUsers) {
    const url = user.stripeSessionUrl || (await createCheckoutUrl(user.lineUserId));
    await sendLineMessage(user.lineUserId, getDueReminderMessage(url));
    await prisma.lineUser.update({
      where: { id: user.id },
      data: {
        billingStatus: "expired",
        lastReminderType: "due_reminder",
        lastReminderAt: now,
        stripeSessionUrl: url,
      },
    });
    results.dueReminder++;
  }

  return results;
}

export async function isUserActive(lineUserId: string): Promise<boolean> {
  const user = await prisma.lineUser.findUnique({
    where: { lineUserId },
  });

  if (!user) return true; // Unknown users get a pass (group members not tracked individually)

  return user.billingStatus === "trial" || user.billingStatus === "active";
}
