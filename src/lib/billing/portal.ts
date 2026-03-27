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

export async function createPortalUrl(stripeSubscriptionId: string): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://umeko.life";

  try {
    // Get the customer from the subscription
    const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
    const customerId = subscription.customer as string;

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: baseUrl,
    });

    return session.url;
  } catch {
    return null;
  }
}
