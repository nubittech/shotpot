import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";
import { PADDLE_PRICE_IDS, PADDLE_PRICE_IDS_ANNUAL, PlanKey, tierFromPlan } from "../../../../lib/paddle";

export const runtime = "nodejs";

type PaddleEvent = {
  event_type: string;
  data: {
    id: string;                          // subscription id
    status: string;                      // active | trialing | canceled | paused | past_due
    customer_id: string;
    subscription_id?: string;
    items?: Array<{ price: { id: string } }>;
    current_billing_period?: { ends_at: string };
    custom_data?: { venue_id?: string; plan?: string; billing_cycle?: string };
    // customer.created / updated
    email?: string;
  };
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Paddle signature
  const signature = req.headers.get("paddle-signature") ?? "";
  const secret    = process.env.PADDLE_WEBHOOK_SECRET ?? "";

  if (secret) {
    // Paddle sends: ts=<timestamp>;h1=<hmac>
    const parts = Object.fromEntries(signature.split(";").map((p) => p.split("=")));
    const ts    = parts["ts"] ?? "";
    const h1    = parts["h1"] ?? "";
    const signed = `${ts}:${rawBody}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signed));
    const expected = Buffer.from(mac).toString("hex");
    if (expected !== h1) {
      console.error("[paddle/webhook] signature mismatch");
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const svc = getServiceClient();
  const { event_type, data } = event;

  function planFromEventData(payload: PaddleEvent["data"]): PlanKey {
    const customPlan = payload.custom_data?.plan;
    if (customPlan === "pro" || customPlan === "isletme") return "pro";
    if (customPlan === "kampanya") return "kampanya";

    const priceId = payload.items?.[0]?.price?.id;
    if (priceId && [PADDLE_PRICE_IDS.pro, PADDLE_PRICE_IDS_ANNUAL.pro].includes(priceId)) {
      return "pro";
    }
    return "kampanya";
  }

  function billingCycleFromEventData(payload: PaddleEvent["data"]) {
    const customCycle = payload.custom_data?.billing_cycle;
    if (customCycle === "annual" || customCycle === "yearly") return "yearly";
    if (customCycle === "monthly") return "monthly";

    const priceId = payload.items?.[0]?.price?.id;
    if (priceId && [PADDLE_PRICE_IDS_ANNUAL.kampanya, PADDLE_PRICE_IDS_ANNUAL.pro].includes(priceId)) {
      return "yearly";
    }
    return "monthly";
  }

  if (
    event_type === "subscription.created" ||
    event_type === "subscription.updated" ||
    event_type === "subscription.activated" ||
    event_type === "subscription.resumed"
  ) {
    const venueId = data.custom_data?.venue_id;
    const paddlePlan = planFromEventData(data);
    const dbPlan = paddlePlan === "pro" ? "isletme" : "kampanya";
    if (!venueId) {
      console.warn("[paddle/webhook] missing venue_id in custom_data");
      return NextResponse.json({ ok: true });
    }

    const isActive = data.status === "active" || data.status === "trialing";
    const expiresAt = data.current_billing_period?.ends_at ?? null;

    const { error: baseUpdateError } = await svc.from("venues").update({
      plan: dbPlan,
      tier: isActive ? tierFromPlan(paddlePlan) : "standard",
      active: isActive,
      billing_cycle: billingCycleFromEventData(data),
    }).eq("id", venueId);

    if (baseUpdateError) {
      console.error("[paddle/webhook] venue base update failed", baseUpdateError);
      return NextResponse.json({ error: baseUpdateError.message }, { status: 500 });
    }

    const { error: subscriptionUpdateError } = await svc.from("venues").update({
      stripe_customer_id:    data.customer_id,   // repurposed column → paddle customer id
      stripe_subscription_id: data.id,            // repurposed column → paddle subscription id
      subscription_status:   data.status,
      plan_expires_at:       expiresAt,
    }).eq("id", venueId);

    if (subscriptionUpdateError) {
      console.warn("[paddle/webhook] subscription metadata update skipped", subscriptionUpdateError.message);
    }
  }

  if (event_type === "transaction.billed") {
    const venueId = data.custom_data?.venue_id;
    const paddlePlan = planFromEventData(data);
    const dbPlan = paddlePlan === "pro" ? "isletme" : "kampanya";
    if (!venueId) {
      console.warn("[paddle/webhook] missing venue_id in transaction custom_data");
      return NextResponse.json({ ok: true });
    }

    const { error: baseUpdateError } = await svc.from("venues").update({
      plan: dbPlan,
      tier: tierFromPlan(paddlePlan),
      active: true,
      billing_cycle: billingCycleFromEventData(data),
    }).eq("id", venueId);

    if (baseUpdateError) {
      console.error("[paddle/webhook] transaction venue update failed", baseUpdateError);
      return NextResponse.json({ error: baseUpdateError.message }, { status: 500 });
    }

    const { error: subscriptionUpdateError } = await svc.from("venues").update({
      stripe_customer_id: data.customer_id,
      stripe_subscription_id: data.subscription_id ?? data.id,
      subscription_status: "active",
    }).eq("id", venueId);

    if (subscriptionUpdateError) {
      console.warn("[paddle/webhook] transaction metadata update skipped", subscriptionUpdateError.message);
    }
  }

  if (event_type === "subscription.canceled" || event_type === "subscription.paused") {
    const venueId = data.custom_data?.venue_id;
    if (venueId) {
      const { error: baseUpdateError } = await svc.from("venues").update({
        tier: "standard",
        active: false,
      }).eq("id", venueId);

      if (baseUpdateError) {
        console.error("[paddle/webhook] venue cancellation update failed", baseUpdateError);
        return NextResponse.json({ error: baseUpdateError.message }, { status: 500 });
      }

      const { error: subscriptionUpdateError } = await svc.from("venues").update({
        subscription_status: data.status,
        stripe_subscription_id: data.id,
      }).eq("id", venueId);

      if (subscriptionUpdateError) {
        console.warn("[paddle/webhook] cancellation metadata update skipped", subscriptionUpdateError.message);
      }
    }
  }

  return NextResponse.json({ received: true });
}
