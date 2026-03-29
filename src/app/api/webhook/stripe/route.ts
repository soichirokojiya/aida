import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  try {
    const result = await handleWebhookEvent(body, signature);

    if (result.type === "checkout_completed") {
      // ── LINE Unified (new plan: DM + Group in one) ──
      if (result.channel === "line" && result.subscriptionType === "unified" && result.lineUserId) {
        // Always create DM subscription (unified plan includes DM)
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
        // If groupId provided, also activate group
        if (result.groupId) {
          await prisma.groupSubscription.upsert({
            where: { groupId: result.groupId },
            update: {
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              payerLineUserId: result.lineUserId,
              currentPeriodStart: new Date(),
            },
            create: {
              groupId: result.groupId,
              payerLineUserId: result.lineUserId,
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
          });
        }
        console.log(`Billing: LINE unified subscription activated (DM${result.groupId ? " + Group" : ""})`);
      }

      // ── Slack Unified (new plan: DM + Channel in one) ──
      if (result.channel === "slack" && result.subscriptionType === "unified" && result.slackUserId && result.teamId) {
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
        if (result.channelId) {
          await prisma.slackChannelSubscription.upsert({
            where: { channelId: result.channelId },
            update: {
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              payerSlackUserId: result.slackUserId,
              currentPeriodStart: new Date(),
            },
            create: {
              channelId: result.channelId,
              teamId: result.teamId,
              payerSlackUserId: result.slackUserId,
              status: "active",
              stripeSubscriptionId: result.stripeSubscriptionId,
              currentPeriodStart: new Date(),
            },
          });
        }
        console.log(`Billing: Slack unified subscription activated (DM${result.channelId ? " + Channel" : ""})`);
      }

      // ── Legacy LINE (keep for existing subscribers) ──
      if (result.channel === "line" && result.subscriptionType === "dm" && result.lineUserId) {
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
        console.log("Billing: LINE DM subscription activated (legacy)");
      }

      if (result.channel === "line" && result.subscriptionType === "group" && result.groupId) {
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
        console.log("Billing: LINE Group subscription activated (legacy)");
      }

      // ── Legacy Slack ──
      if (result.channel === "slack" && result.subscriptionType === "dm" && result.slackUserId && result.teamId) {
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
        console.log("Billing: Slack DM subscription activated (legacy)");
      }

      if (result.channel === "slack" && result.subscriptionType === "channel" && result.channelId && result.teamId) {
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
        console.log("Billing: Slack Channel subscription activated (legacy)");
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

    // ── Subscription updated (status change, period renewal) ──
    if (result.type === "subscription_updated" && result.stripeSubscriptionId) {
      const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
        incomplete_expired: "expired",
      };
      const dbStatus = statusMap[result.stripeStatus || ""] || result.stripeStatus || "active";
      const updateData: { status: string; currentPeriodEnd?: Date } = { status: dbStatus };
      if (result.currentPeriodEnd) updateData.currentPeriodEnd = result.currentPeriodEnd;

      // Update whichever table holds this subscription ID
      await Promise.all([
        prisma.dmSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
        prisma.groupSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
        prisma.slackDmSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
        prisma.slackChannelSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
      ]);
      console.log(`Billing: subscription ${result.stripeSubscriptionId} → ${dbStatus}`);
    }

    // ── Invoice paid (monthly renewal success) ──
    if (result.type === "invoice_paid" && result.stripeSubscriptionId) {
      const updateData: { status: string; currentPeriodEnd?: Date } = { status: "active" };
      if (result.currentPeriodEnd) updateData.currentPeriodEnd = result.currentPeriodEnd;

      await Promise.all([
        prisma.dmSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
        prisma.groupSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
        prisma.slackDmSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
        prisma.slackChannelSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: updateData,
        }),
      ]);
      console.log(`Billing: invoice paid for ${result.stripeSubscriptionId}`);
    }

    // ── Invoice payment failed (card declined, etc.) ──
    if (result.type === "invoice_payment_failed" && result.stripeSubscriptionId) {
      await Promise.all([
        prisma.dmSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: { status: "past_due" },
        }),
        prisma.groupSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: { status: "past_due" },
        }),
        prisma.slackDmSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: { status: "past_due" },
        }),
        prisma.slackChannelSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: { status: "past_due" },
        }),
      ]);
      console.log(`Billing: payment failed for ${result.stripeSubscriptionId}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
