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
 * For an already-paying venue, change the Paddle subscription's price to the
 * new plan/billing cycle. No new checkout, no proration / mid-cycle diff:
 * the plan switches immediately and the next regular billing cycle simply
 * charges the new full amount.
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

    // PATCH Paddle subscription — switch plan only, no proration / mid-cycle bill.
    // `do_not_bill` makes Paddle change the items without issuing any invoice
    // now; the next regular billing cycle charges the new full amount.
    const r = await fetch(`${PADDLE_API_BASE}/subscriptions/${v.stripe_subscription_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: "do_not_bill",
      }),
    });
    const data: unknown = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        (data as { error?: { detail?: string } })?.error?.detail ??
        "Paddle subscription update failed";
      return NextResponse.json({ error: msg, paddle: data }, { status: 500 });
    }

    // Optimistically reflect plan locally; the Paddle webhook will reconcile.
    await svc
      .from("venues")
      .update({ plan: body.plan, billing_cycle: body.billingCycle })
      .eq("id", v.id);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
