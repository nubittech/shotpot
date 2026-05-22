import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";
import {
  PADDLE_PRICE_IDS,
  PADDLE_PRICE_IDS_ANNUAL,
  PADDLE_ENVIRONMENT,
} from "../../../../lib/paddle";

/**
 * POST /api/paddle/update-subscription
 *
 * For an already-paying venue, schedule a Paddle subscription plan change
 * for the next billing cycle. No new checkout, no proration / mid-cycle diff:
 * the current paid period finishes on the old plan, and at the next renewal
 * Paddle charges the new plan's full amount — that's when the new tier and
 * its features take effect.
 *
 * Body: { slug, plan, billingCycle }
 */
type Body = {
  slug: string;
  plan: "kampanya" | "isletme";
  billingCycle: "monthly" | "yearly";
};

const PADDLE_API_BASE =
  PADDLE_ENVIRONMENT === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(list) { list.forEach(({ name, value, options }) => { cookieStore.set(name, value, options); }); },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const svc = getServiceClient();
    const { data: venue } = await svc
      .from("venues")
      .select("id, plan, billing_cycle, active, stripe_subscription_id")
      .eq("slug", body.slug)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    const v = venue as {
      id: string;
      plan: string;
      billing_cycle: string;
      active: boolean | null;
      stripe_subscription_id: string | null;
    } | null;
    if (!v) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // No active subscription → caller must start a fresh checkout instead
    if (!v.active || !v.stripe_subscription_id) {
      return NextResponse.json({ ok: false, code: "no_subscription" }, { status: 409 });
    }

    // No-op: nothing to do if the plan & cycle didn't actually change. Saves
    // a Paddle API call and avoids accidentally re-billing on a refresh.
    if (v.plan === body.plan && v.billing_cycle === body.billingCycle) {
      return NextResponse.json({ ok: true, scheduled: false, unchanged: true });
    }

    // Map studio plan → Paddle price id
    const planKey: "kampanya" | "pro" = body.plan === "isletme" ? "pro" : "kampanya";
    const priceId =
      body.billingCycle === "yearly"
        ? PADDLE_PRICE_IDS_ANNUAL[planKey]
        : PADDLE_PRICE_IDS[planKey];
    if (!priceId) {
      return NextResponse.json({ error: "Paddle price id missing in env for this plan" }, { status: 500 });
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "PADDLE_API_KEY missing" }, { status: 500 });

    // PATCH Paddle subscription — defer the plan change to the next billing
    // period. `full_next_billing_period` tells Paddle to keep the current
    // plan running until the next renewal, then switch items AND charge the
    // new plan's full amount as that period's invoice.
    // Idempotency: a double-click or retry must not schedule the plan change
    // twice. Key is deterministic on (subscription, target price) — if Paddle
    // sees the same key inside its retention window, it returns the original
    // result instead of applying a second PATCH.
    const idemKey = `sub-update:${v.stripe_subscription_id}:${priceId}`;
    const r = await fetch(`${PADDLE_API_BASE}/subscriptions/${v.stripe_subscription_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Paddle-Idempotency-Key": idemKey,
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: "full_next_billing_period",
      }),
    });
    const data: unknown = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        (data as { error?: { detail?: string } })?.error?.detail ??
        "Paddle subscription update failed";
      return NextResponse.json({ error: msg, paddle: data }, { status: 500 });
    }

    // Don't touch venue.plan/tier here — the change only takes effect at the
    // next renewal. Paddle will fire `subscription.updated` at that moment
    // and our webhook will flip plan/tier then. This keeps the customer on
    // their paid plan until they actually pay for the new one.

    return NextResponse.json({ ok: true, scheduled: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
