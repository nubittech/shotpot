import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";
import { computeTier, type TierThresholds } from "../../../../lib/loyalty";

/**
 * POST /api/dashboard/tiers
 * Save a venue's VIP tier thresholds, then recompute every customer's tier
 * with the new thresholds so existing members reflect the change immediately.
 *
 * Body: { slug, silverVisits, silverSpend, goldVisits, goldSpend }
 */
type Body = {
  slug: string;
  silverVisits: number;
  silverSpend: number;
  goldVisits: number;
  goldSpend: number;
};

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
      .select("id, tier")
      .eq("slug", body.slug)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    const v = venue as { id: string; tier: string } | null;
    if (!v) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (v.tier !== "pro") return NextResponse.json({ error: "Pro tier gereklidir" }, { status: 400 });

    // Sanitize — non-negative integers/numbers
    const thresholds: TierThresholds = {
      silverVisits: Math.max(1, Math.round(Number(body.silverVisits) || 0)),
      silverSpend: Math.max(0, Number(body.silverSpend) || 0),
      goldVisits: Math.max(1, Math.round(Number(body.goldVisits) || 0)),
      goldSpend: Math.max(0, Number(body.goldSpend) || 0),
    };

    const { error: upErr } = await svc
      .from("venues")
      .update({
        tier_silver_visits: thresholds.silverVisits,
        tier_silver_spend: thresholds.silverSpend,
        tier_gold_visits: thresholds.goldVisits,
        tier_gold_spend: thresholds.goldSpend,
      })
      .eq("id", v.id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // Recompute every customer's tier with the new thresholds
    const { data: custRaw } = await svc
      .from("customers")
      .select("id, total_visits, total_spend, loyalty_tier")
      .eq("venue_id", v.id)
      .is("deleted_at", null);
    const customers = (custRaw ?? []) as Array<{
      id: string; total_visits: number; total_spend: number; loyalty_tier: string;
    }>;

    let changed = 0;
    for (const c of customers) {
      const next = computeTier(c.total_visits ?? 0, Number(c.total_spend) || 0, thresholds);
      if (next !== c.loyalty_tier) {
        await svc.from("customers").update({ loyalty_tier: next }).eq("id", c.id);
        changed++;
      }
    }

    return NextResponse.json({ ok: true, recomputed: customers.length, changed });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
