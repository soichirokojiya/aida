import { prisma } from "../db/prisma";

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase(); // 6 chars
}

// Generate a link code for a LINE user (valid for 10 minutes)
export async function createLinkCode(lineUserId: string): Promise<string> {
  // Delete any existing unused codes for this user
  await prisma.linkCode.deleteMany({
    where: { lineUserId, usedAt: null },
  });

  const code = generateCode();
  await prisma.linkCode.create({
    data: {
      code,
      lineUserId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
  });
  return code;
}

// Redeem a link code from Slack side
export async function redeemLinkCode(
  code: string,
  slackUserId: string,
  teamId: string
): Promise<{ success: boolean; message: string }> {
  const linkCode = await prisma.linkCode.findUnique({ where: { code: code.toUpperCase() } });

  if (!linkCode) {
    return { success: false, message: "この連携コードは見つからなかったよ。もう一度LINEで「Slack連携」と送って、新しいコードを取得してみてね。" };
  }

  if (linkCode.usedAt) {
    return { success: false, message: "この連携コードはもう使われてるよ。新しいコードをLINEで取得してね。" };
  }

  if (linkCode.expiresAt < new Date()) {
    return { success: false, message: "この連携コードは期限切れだよ（10分間有効）。もう一度LINEで「Slack連携」と送ってね。" };
  }

  // Check if LINE user has active subscription
  const lineUser = await prisma.lineUser.findUnique({
    where: { lineUserId: linkCode.lineUserId },
    include: { dmSubscription: true },
  });

  if (!lineUser) {
    return { success: false, message: "LINEアカウントが見つからなかったよ。" };
  }

  const isTrialActive = lineUser.trialEndsAt > new Date();
  const isDmPaid = lineUser.dmSubscription?.status === "active";

  if (!isTrialActive && !isDmPaid) {
    return { success: false, message: "Slack連携はLINEの有料会員特典だよ。まずLINEでパーソナルプラン（月額490円）に登録してね。" };
  }

  // Link the Slack user
  await prisma.slackUser.upsert({
    where: { slackUserId_teamId: { slackUserId, teamId } },
    update: { linkedLineUserId: linkCode.lineUserId },
    create: {
      slackUserId,
      teamId,
      linkedLineUserId: linkCode.lineUserId,
      trialEndsAt: lineUser.trialEndsAt,
    },
  });

  // Mark code as used
  await prisma.linkCode.update({
    where: { id: linkCode.id },
    data: { usedAt: new Date() },
  });

  return { success: true, message: "連携完了！Slackでもうめこが使えるようになったよ。気軽に話しかけてね。" };
}

// Check if a Slack user is linked and has an active LINE subscription
export async function isSlackUserActive(slackUserId: string, teamId: string): Promise<boolean> {
  const slackUser = await prisma.slackUser.findUnique({
    where: { slackUserId_teamId: { slackUserId, teamId } },
  });

  if (!slackUser?.linkedLineUserId) return false;

  // Check the linked LINE user's subscription
  const lineUser = await prisma.lineUser.findUnique({
    where: { lineUserId: slackUser.linkedLineUserId },
    include: { dmSubscription: true },
  });

  if (!lineUser) return false;
  if (lineUser.trialEndsAt > new Date()) return true;
  if (lineUser.dmSubscription?.status === "active") return true;

  return false;
}

// Check if a Slack channel has at least one linked active user
export async function isSlackChannelActive(channelId: string): Promise<boolean> {
  // Find conversations in this channel to get participating users
  const conv = await prisma.conversation.findFirst({
    where: { channelType: "slack", externalThreadId: channelId },
    include: { messages: { select: { senderId: true }, distinct: ["senderId"], take: 50 } },
  });

  if (!conv) return false;

  for (const msg of conv.messages) {
    const slackUser = await prisma.slackUser.findFirst({
      where: { slackUserId: msg.senderId, linkedLineUserId: { not: null } },
    });
    if (!slackUser?.linkedLineUserId) continue;

    const lineUser = await prisma.lineUser.findUnique({
      where: { lineUserId: slackUser.linkedLineUserId },
      include: { dmSubscription: true },
    });
    if (!lineUser) continue;
    if (lineUser.trialEndsAt > new Date()) return true;
    if (lineUser.dmSubscription?.status === "active") return true;

    // Also check group subscription
    const groupSub = await prisma.groupSubscription.findFirst({
      where: { payerLineUserId: slackUser.linkedLineUserId, status: "active" },
    });
    if (groupSub) return true;
  }

  return false;
}
