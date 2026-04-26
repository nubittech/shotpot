import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";
import { createClient as createRscClient } from "../../../../lib/supabase/server-rsc";

type SavePayload = {
  slug: string;
  name: string;
  plan?: "kampanya" | "isletme";
  currency?: "TRY" | "USD" | "EUR";
  receiptMode?: "ocr" | "qr" | "both";
  timezone?: string;
  tokenThreshold: number;
  variant: "v1" | "v2" | "v3";
  winRate: number;       // 0..1 (e.g. 0.30)
  jackpotShare: number;  // 0..1 (e.g. 0.10)
  jackpotReward: string;
  jackpotCoupon: string;
  campaigns: Array<{
    symbolId: string;
    rewardLabel: string;
    couponPrefix: string;
    share: number;       // relative weight 0..1
    active?: boolean;
  }>;
};

function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SavePayload;
    if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
    if (!slug) return NextResponse.json({ error: "invalid slug" }, { status: 400 });

    // Auth: who's saving?
    const auth = createRscClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const sb = getServiceClient();

    // Ownership check: if slug already exists, must belong to this user
    const { data: existing } = await sb
      .from("venues").select("id, owner_user_id").eq("slug", slug).maybeSingle();
    const existingRow = existing as { id: string; owner_user_id: string | null } | null;
    if (existingRow && existingRow.owner_user_id && existingRow.owner_user_id !== user.id) {
      return NextResponse.json({ error: "slug taken" }, { status: 409 });
    }

    // 1) Upsert venue (by slug) with current user as owner
    const { data: venueRow, error: venueErr } = await sb
      .from("venues")
      .upsert({
        slug,
        name: body.name,
        plan: body.plan ?? "kampanya",
        currency: body.currency ?? "TRY",
        receipt_mode: body.receiptMode ?? "ocr",
        timezone: body.timezone ?? "Europe/Istanbul",
        token_threshold: body.tokenThreshold,
        owner_user_id: user.id,
        active: true,
      }, { onConflict: "slug" })
      .select("id")
      .single();

    if (venueErr || !venueRow) {
      return NextResponse.json({ error: venueErr?.message ?? "venue upsert failed" }, { status: 500 });
    }
    const venueId = venueRow.id;

    // 2) Upsert symbol_config
    const { error: cfgErr } = await sb
      .from("symbol_configs")
      .upsert({
        venue_id: venueId,
        variant: body.variant,
        win_rate: body.winRate,
        jackpot_share: body.jackpotShare,
        jackpot_reward: body.jackpotReward,
        jackpot_coupon_prefix: body.jackpotCoupon,
        updated_at: new Date().toISOString(),
      }, { onConflict: "venue_id" });

    if (cfgErr) return NextResponse.json({ error: cfgErr.message }, { status: 500 });

    // 3) Replace campaigns: delete then insert (simple + correct)
    const { error: delErr } = await sb.from("campaigns").delete().eq("venue_id", venueId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    if (body.campaigns?.length) {
      const rows = body.campaigns.map((c) => ({
        venue_id: venueId,
        symbol_id: c.symbolId,
        reward_label: c.rewardLabel,
        coupon_prefix: c.couponPrefix,
        share: c.share,
        active: c.active ?? true,
      }));
      const { error: insErr } = await sb.from("campaigns").insert(rows);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, venueId, slug });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
