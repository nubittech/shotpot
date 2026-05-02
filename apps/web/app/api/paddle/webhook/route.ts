import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";
import { tierFromPlan, PlanKey } from "../../../../lib/paddle";

export const runtime = "nodejs";

type PaddleEvent = {
  event_type: string;
  data: {
    id: string;                          // subscription id
    status: string;                      // active | trialing | canceled | paused | past_due
    customer_id: string;
    items?: Array<{ price: { id: string } }>;
    current_billing_period?: { ends_at: string };
    custom_data?: { venue_id?: string; plan?: string };
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

  if (
    event_type === "subscription.created" ||
    event_type === "subscription.updated" ||
    event_type === "subscription.activated" ||
    event_type === "subscription.resumed"
  ) {
    const venueId = data.custom_data?.venue_id;
    const plan    = (data.custom_data?.plan ?? "kampanya") as PlanKey;
    if (!venueId) {
      console.warn("[paddle/webhook] missing venue_id in custom_data");
      return NextResponse.json({ ok: true });
    }

    const isActive = data.status === "active" || data.status === "trialing";
    const expiresAt = data.current_billing_period?.ends_at ?? null;

    await svc.from("venues").update({
      plan,
      tier: isActive ? tierFromPlan(plan) : "standard",
      stripe_customer_id:    data.customer_id,   // repurposed column → paddle customer id
      stripe_subscription_id: data.id,            // repurposed column → paddle subscription id
      subscription_status:   data.status,
      plan_expires_at:       expiresAt,
    }).eq("id", venueId);
  }

  if (event_type === "subscription.canceled" || event_type === "subscription.paused") {
    const venueId = data.custom_data?.venue_id;
    if (venueId) {
      await svc.from("venues").update({
        tier: "standard",
        subscription_status: data.status,
        stripe_subscription_id: data.id,
      }).eq("id", venueId);
    }
  }

  return NextResponse.json({ received: true });
}
