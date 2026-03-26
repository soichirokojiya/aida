import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export async function createCheckoutUrl(lineUserId: string): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://aida-omega.vercel.app";

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing/cancel`,
    metadata: { lineUserId },
    allow_promotion_codes: true,
  });

  return session.url!;
}

export async function handleWebhookEvent(
  body: string,
  signature: string
): Promise<{ type: string; lineUserId?: string }> {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const lineUserId = session.metadata?.lineUserId;
      return { type: "checkout_completed", lineUserId: lineUserId || undefined };
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const lineUserId = sub.metadata?.lineUserId;
      return { type: "subscription_cancelled", lineUserId: lineUserId || undefined };
    }
    default:
      return { type: event.type };
  }
}
