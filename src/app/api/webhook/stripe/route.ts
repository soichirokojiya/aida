import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  try {
    const result = await handleWebhookEvent(body, signature);

    if (result.type === "checkout_completed") {
      // ── LINE ──
      if (result.channel === "line") {
        if (result.subscriptionType === "dm" && result.lineUserId) {
          await prisma.dmSubscription.upsert({
            where: { lineUserId: result.lineUserId },
            update: {
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
            create: {
              lineUserId: result.lineUserId,
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
          });
          console.log("Billing: LINE DM subscription activated");
        }

        if (result.subscriptionType === "group" && result.groupId) {
          await prisma.groupSubscription.upsert({
            where: { groupId: result.groupId },
            update: {
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              payerLineUserId: result.lineUserId || "unknown",
              currentPeriodStart: new Date(),
            },
            create: {
              groupId: result.groupId,
              payerLineUserId: result.lineUserId || "unknown",
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
          });
          console.log("Billing: LINE Group subscription activated");
        }
      }

      // ── Slack ──
      if (result.channel === "slack") {
        if (result.subscriptionType === "dm" && result.slackUserId && result.teamId) {
          await prisma.slackDmSubscription.upsert({
            where: { slackUserId_teamId: { slackUserId: result.slackUserId, teamId: result.teamId } },
            update: {
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
            create: {
              slackUserId: result.slackUserId,
              teamId: result.teamId,
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
          });
          console.log("Billing: Slack DM subscription activated");
        }

        if (result.subscriptionType === "channel" && result.channelId && result.teamId) {
          await prisma.slackChannelSubscription.upsert({
            where: { channelId: result.channelId },
            update: {
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              payerSlackUserId: result.slackUserId || "unknown",
              currentPeriodStart: new Date(),
            },
            create: {
              channelId: result.channelId,
              teamId: result.teamId,
              payerSlackUserId: result.slackUserId || "unknown",
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
          });
          console.log("Billing: Slack Channel subscription activated");
        }
      }
    }

    if (result.type === "subscription_cancelled") {
      // ── LINE ──
      if (result.channel === "line") {
        if (result.subscriptionType === "dm" && result.lineUserId) {
          await prisma.dmSubscription.updateMany({
            where: { lineUserId: result.lineUserId },
            data: { status: "canceled" },
          });
          console.log("Billing: LINE DM subscription cancelled");
        }
        if (result.subscriptionType === "group" && result.stripeSubscriptionId) {
          await prisma.groupSubscription.updateMany({
            where: { stripeSubscriptionId: result.stripeSubscriptionId },
            data: { status: "canceled" },
          });
          console.log("Billing: LINE Group subscription cancelled");
        }
      }

      // ── Slack ──
      if (result.channel === "slack") {
        if (result.subscriptionType === "dm" && result.stripeSubscriptionId) {
          await prisma.slackDmSubscription.updateMany({
            where: { stripeSubscriptionId: result.stripeSubscriptionId },
            data: { status: "canceled" },
          });
          console.log("Billing: Slack DM subscription cancelled");
        }
        if (result.subscriptionType === "channel" && result.stripeSubscriptionId) {
          await prisma.slackChannelSubscription.updateMany({
            where: { stripeSubscriptionId: result.stripeSubscriptionId },
            data: { status: "canceled" },
          });
          console.log("Billing: Slack Channel subscription cancelled");
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
