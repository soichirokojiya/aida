import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  try {
    const result = await handleWebhookEvent(body, signature);

    if (result.type === "checkout_completed" && result.lineUserId) {
      await prisma.lineUser.update({
        where: { lineUserId: result.lineUserId },
        data: { billingStatus: "active" },
      });
      console.log(`User ${result.lineUserId} activated`);
    }

    if (result.type === "subscription_cancelled" && result.lineUserId) {
      await prisma.lineUser.update({
        where: { lineUserId: result.lineUserId },
        data: { billingStatus: "cancelled" },
      });
      console.log(`User ${result.lineUserId} cancelled`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
