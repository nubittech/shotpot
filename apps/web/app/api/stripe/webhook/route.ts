import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, planFromPriceId, tierFromPlan } from "../../../../lib/stripe";
import { getServiceClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs"; // needs crypto for webhook signature

/** Apply subscription state to the venues row */
async function syncSubscription(subscription: Stripe.Subscription) {
  const svc = getServiceClient();
  const venueId = subscription.metadata?.venue_id;
  if (!venueId) {
    console.warn("[webhook] subscription missing venue_id metadata", subscription.id);
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? "";
  const plan = planFromPriceId(priceId) ?? "kampanya";
  const tier = tierFromPlan(plan);

  const status = subscription.status; // active | trialing | past_due | canceled | unpaid | paused
  const isActive = status === "active" || status === "trialing";

  // In Stripe API v2026-04-22 period end lives on the subscription item
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;

  await svc
    .from("venues")
    .update({
      plan,
      tier: isActive ? tier : "standard",
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      plan_expires_at: periodEnd,
    })
    .eq("id", venueId);
}

/** Extract subscription id from invoice (Stripe API v2026-04-22 uses invoice.parent) */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subRef = invoice.parent?.subscription_details?.subscription;
  if (!subRef) return null;
  return typeof subRef === "string" ? subRef : subRef.id;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.resumed":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
      case "customer.subscription.paused":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = subscriptionIdFromInvoice(invoice);
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = subscriptionIdFromInvoice(invoice);
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
