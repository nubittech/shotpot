import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, writeAudit } from "../../../../../lib/auth/admin";
import { getServiceClient } from "../../../../../lib/supabase/server";

type Body = {
  slug: string;
  plan?: "kampanya" | "isletme";
  tier?: "standard" | "pro";
  billingCycle?: "monthly" | "yearly";
  active?: boolean;
  digitalMenuEnabled?: boolean;
  note?: string;
};

/**
 * POST /api/admin/venues/override-plan
 *
 * DB-level override. Does NOT touch Paddle. Use this to:
 *  - Grant a venue a free plan (active=true + plan/tier without subscription)
 *  - Bump tier to "pro" for a partner
 *  - Toggle active off to suspend a venue
 *
 * WARNING: If the venue has a live Paddle subscription, this only flips local
 * flags. Paddle will keep billing until the subscription is cancelled there.
 * The audit row captures this so we can spot mismatches.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const body = (await req.json()) as Body;
  if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const svc = getServiceClient();
  const { data: existing, error: selErr } = await svc
    .from("venues")
    .select("id, plan, tier, billing_cycle, active, digital_menu_enabled, stripe_subscription_id")
    .eq("slug", body.slug)
    .maybeSingle();
  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "venue not found" }, { status: 404 });

  const e = existing as {
    id: string; plan: string; tier: string; billing_cycle: string;
    active: boolean | null; digital_menu_enabled: boolean | null; stripe_subscription_id: string | null;
  };

  const update: Record<string, unknown> = {};
  if (body.plan !== undefined) update.plan = body.plan;
  if (body.tier !== undefined) update.tier = body.tier;
  if (body.billingCycle !== undefined) update.billing_cycle = body.billingCycle;
  if (body.active !== undefined) update.active = body.active;
  if (body.digitalMenuEnabled !== undefined) update.digital_menu_enabled = body.digitalMenuEnabled;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const { error: upErr } = await svc.from("venues").update(update).eq("id", e.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  await writeAudit({
    adminEmail: gate.email,
    action: "override_plan",
    venueId: e.id,
    payload: {
      before: {
        plan: e.plan, tier: e.tier, billing_cycle: e.billing_cycle,
        active: e.active, digital_menu_enabled: e.digital_menu_enabled,
        stripe_subscription_id: e.stripe_subscription_id,
      },
      after: update,
      note: body.note ?? null,
      paddleSubscriptionPresent: !!e.stripe_subscription_id,
    },
  });

  return NextResponse.json({ ok: true });
}
