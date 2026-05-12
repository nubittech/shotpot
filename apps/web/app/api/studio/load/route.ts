import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";
import { createClient as createRscClient } from "../../../../lib/supabase/server-rsc";

/**
 * GET /api/studio/load?slug=barin-adi
 * Returns the full venue + symbol_config + campaigns for the wizard to pre-fill.
 * Authorisation: only the owner_user_id of the venue may load it.
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const auth = createRscClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const sb = getServiceClient();

    const { data: venue, error: vErr } = await sb
      .from("venues")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (vErr || !venue) {
      return NextResponse.json({ error: "venue not found" }, { status: 404 });
    }

    const v = venue as unknown as {
      id: string; slug: string; name: string; plan: string;
      billing_cycle?: string;
      currency: string; receipt_mode: string; interface_language?: string; timezone: string;
      token_threshold: number; owner_user_id: string;
    };

    if (v.owner_user_id && v.owner_user_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const [{ data: cfg }, { data: camps }] = await Promise.all([
      sb.from("symbol_configs").select("*").eq("venue_id", v.id).maybeSingle(),
      sb.from("campaigns").select("*").eq("venue_id", v.id),
    ]);

    return NextResponse.json({
      venue: {
        slug: v.slug,
        name: v.name,
        plan: v.plan,
        billingCycle: v.billing_cycle ?? "monthly",
        currency: v.currency ?? "TRY",
        receiptMode: v.receipt_mode ?? "ocr",
        interfaceLanguage: v.interface_language ?? "tr",
        timezone: v.timezone ?? "Europe/Istanbul",
        tokenThreshold: v.token_threshold,
      },
      config: cfg
        ? {
            variant: (cfg as { variant: string }).variant,
            winRate: Number((cfg as { win_rate: number }).win_rate),
            jackpotShare: Number((cfg as { jackpot_share: number }).jackpot_share),
            jackpotReward: (cfg as { jackpot_reward: string }).jackpot_reward,
            jackpotCoupon: (cfg as { jackpot_coupon_prefix: string }).jackpot_coupon_prefix,
          }
        : null,
      campaigns: ((camps ?? []) as Array<{
        symbol_id: string; reward_label: string; coupon_prefix: string; share: number; active: boolean;
      }>).map((c) => ({
        symbolId: c.symbol_id,
        rewardLabel: c.reward_label,
        couponPrefix: c.coupon_prefix,
        share: Number(c.share),
        active: c.active,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
