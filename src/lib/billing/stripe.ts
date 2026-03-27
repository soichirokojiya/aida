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

const DM_PRICE_ID = process.env.STRIPE_DM_PRICE_ID!;
const GROUP_PRICE_ID = process.env.STRIPE_GROUP_PRICE_ID!;

export async function createDmCheckoutUrl(lineUserId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: DM_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?type=dm`,
    cancel_url: `${baseUrl}/billing/cancel`,
    metadata: { lineUserId, type: "dm" },
    allow_promotion_codes: true,
  });
  return session.url!;
}

export async function createGroupCheckoutUrl(lineUserId: string, groupId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: GROUP_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?type=group`,
    cancel_url: `${baseUrl}/billing/cancel`,
    metadata: { lineUserId, groupId, type: "group" },
    allow_promotion_codes: true,
  });
  return session.url!;
}

export interface WebhookResult {
  type: string;
  lineUserId?: string;
  groupId?: string;
  subscriptionType?: "dm" | "group";
  stripeSubscriptionId?: string;
}

export async function handleWebhookEvent(
  body: string,
  signature: string
): Promise<WebhookResult> {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      return {
        type: "checkout_completed",
        lineUserId: session.metadata?.lineUserId,
        groupId: session.metadata?.groupId,
        subscriptionType: session.metadata?.type as "dm" | "group",
        stripeSubscriptionId: session.subscription as string,
      };
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      return {
        type: "subscription_cancelled",
        lineUserId: sub.metadata?.lineUserId,
        groupId: sub.metadata?.groupId,
        subscriptionType: sub.metadata?.type as "dm" | "group",
        stripeSubscriptionId: sub.id,
      };
    }
    default:
      return { type: event.type };
  }
}
