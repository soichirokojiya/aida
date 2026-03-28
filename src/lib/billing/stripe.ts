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
// Slack uses the same price IDs (same amount ¥490/¥980)
const SLACK_DM_PRICE_ID = process.env.STRIPE_SLACK_DM_PRICE_ID || DM_PRICE_ID;
const SLACK_CHANNEL_PRICE_ID = process.env.STRIPE_SLACK_CHANNEL_PRICE_ID || GROUP_PRICE_ID;

// ── LINE ──

export async function createDmCheckoutUrl(lineUserId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: DM_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?type=dm`,
    cancel_url: `${baseUrl}/billing/cancel`,
    metadata: { lineUserId, type: "dm", channel: "line" },
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
    metadata: { lineUserId, groupId, type: "group", channel: "line" },
    allow_promotion_codes: true,
  });
  return session.url!;
}

// ── Slack ──

export async function createSlackDmCheckoutUrl(slackUserId: string, teamId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: SLACK_DM_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?type=slack_dm`,
    cancel_url: `${baseUrl}/billing/cancel`,
    metadata: { slackUserId, teamId, type: "dm", channel: "slack" },
    allow_promotion_codes: true,
  });
  return session.url!;
}

export async function createSlackChannelCheckoutUrl(slackUserId: string, teamId: string, channelId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: SLACK_CHANNEL_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?type=slack_channel`,
    cancel_url: `${baseUrl}/billing/cancel`,
    metadata: { slackUserId, teamId, channelId, type: "channel", channel: "slack" },
    allow_promotion_codes: true,
  });
  return session.url!;
}

// ── Webhook ──

export interface WebhookResult {
  type: string;
  channel?: "line" | "slack";
  // LINE
  lineUserId?: string;
  groupId?: string;
  // Slack
  slackUserId?: string;
  teamId?: string;
  channelId?: string;
  // Common
  subscriptionType?: "dm" | "group" | "channel";
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
      const meta = session.metadata || {};
      return {
        type: "checkout_completed",
        channel: (meta.channel as "line" | "slack") || "line",
        lineUserId: meta.lineUserId,
        groupId: meta.groupId,
        slackUserId: meta.slackUserId,
        teamId: meta.teamId,
        channelId: meta.channelId,
        subscriptionType: meta.type as "dm" | "group" | "channel",
        stripeSubscriptionId: session.subscription as string,
      };
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const meta = sub.metadata || {};
      return {
        type: "subscription_cancelled",
        channel: (meta.channel as "line" | "slack") || "line",
        lineUserId: meta.lineUserId,
        groupId: meta.groupId,
        slackUserId: meta.slackUserId,
        teamId: meta.teamId,
        channelId: meta.channelId,
        subscriptionType: meta.type as "dm" | "group" | "channel",
        stripeSubscriptionId: sub.id,
      };
    }
    default:
      return { type: event.type };
  }
}
