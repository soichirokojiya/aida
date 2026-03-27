import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  try {
    const result = await handleWebhookEvent(body, signature);

    if (result.type === "checkout_completed") {
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
        console.log("Billing: DM subscription activated");
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
        console.log("Billing: Group subscription activated");
      }
    }

    if (result.type === "subscription_cancelled") {
      if (result.subscriptionType === "dm" && result.lineUserId) {
        await prisma.dmSubscription.updateMany({
          where: { lineUserId: result.lineUserId },
          data: { status: "canceled" },
        });
        console.log("Billing: DM subscription cancelled");
      }

      if (result.subscriptionType === "group" && result.stripeSubscriptionId) {
        await prisma.groupSubscription.updateMany({
          where: { stripeSubscriptionId: result.stripeSubscriptionId },
          data: { status: "canceled" },
        });
        console.log("Billing: Group subscription cancelled");
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
