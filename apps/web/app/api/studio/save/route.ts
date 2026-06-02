import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";
import { createClient as createRscClient } from "../../../../lib/supabase/server-rsc";

type SavePayload = {
  slug: string;
  name: string;
  plan?: "kampanya" | "isletme";
  billingCycle?: "monthly" | "yearly";
  currency?: "TRY" | "USD" | "EUR";
  receiptMode?: "ocr" | "qr" | "both";
  interfaceLanguage?: "tr" | "en";
  timezone?: string;
  tokenThreshold: number;
  couponValidityDays?: number;
  gameType?: "slot" | "wheel";
  wheelVariant?: "boho" | "irish" | "medit";
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
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

// Symbol ids come from a known catalog (see components/wheel/segments.ts +
// slot symbols). We restrict to a conservative charset to keep them safe to
// interpolate into PostgREST filters and to fail-fast on tampered payloads.
const SAFE_SYMBOL_ID = /^[A-Za-z0-9_-]{1,64}$/;

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
      .from("venues")
      .select("id, owner_user_id, active, plan, billing_cycle")
      .eq("slug", slug)
      .maybeSingle();
    const existingRow = existing as {
      id: string;
      owner_user_id: string | null;
      active: boolean | null;
      plan: string | null;
      billing_cycle: string | null;
    } | null;
    if (existingRow && existingRow.owner_user_id && existingRow.owner_user_id !== user.id) {
      return NextResponse.json({ error: "slug taken" }, { status: 409 });
    }
    const wasActive = !!existingRow?.active;
    const prevPlan = existingRow?.plan ?? null;
    const prevBillingCycle = existingRow?.billing_cycle ?? null;

    // 1) Insert (new) or update (own) — NEVER blind upsert by slug, because a
    // concurrent owner-less row could be hijacked between the existence check
    // and the upsert. Update is constrained to `owner_user_id = user.id` so a
    // racing request from another user can't pass the gate.
    const venuePayload = {
      slug,
      name: body.name,
      plan: body.plan ?? "kampanya",
      billing_cycle: body.billingCycle ?? "monthly",
      currency: body.currency ?? "TRY",
      receipt_mode: body.receiptMode ?? "ocr",
      interface_language: body.interfaceLanguage ?? "tr",
      timezone: body.timezone ?? "Europe/Istanbul",
      token_threshold: body.tokenThreshold,
      coupon_validity_days: Math.max(0, Math.floor(body.couponValidityDays ?? 30)),
      game_type: body.gameType ?? "slot",
      wheel_variant: body.wheelVariant ?? "boho",
    };

    let venueRow: { id: string } | null = null;
    let venueErr: { message: string } | null = null;
    if (existingRow) {
      // Owned by this user (or unowned legacy row claimed below). Update with
      // ownership guard so concurrent requests from another user can't slip in.
      const updatePayload: Record<string, unknown> = { ...venuePayload };
      // Claim ownership only if currently null (legacy data).
      if (existingRow.owner_user_id === null) updatePayload.owner_user_id = user.id;
      const q = sb
        .from("venues")
        .update(updatePayload)
        .eq("id", existingRow.id);
      // Guard: only allow when the row is still owned by this user OR unowned.
      const { data, error } = existingRow.owner_user_id === null
        ? await q.is("owner_user_id", null).select("id").single()
        : await q.eq("owner_user_id", user.id).select("id").single();
      venueRow = data as { id: string } | null;
      venueErr = error;
    } else {
      const { data, error } = await sb
        .from("venues")
        .insert({ ...venuePayload, owner_user_id: user.id, active: false })
        .select("id")
        .single();
      venueRow = data as { id: string } | null;
      venueErr = error;
    }

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

    // 3) Upsert campaigns by (venue_id, symbol_id).
    //    Rows are NEVER deleted — campaign ids stay stable so historical
    //    spins/coupons keep their attribution (critical for analytics).
    //    Symbols no longer selected are soft-deactivated (active = false).
    if (body.campaigns?.length) {
      // Validate symbol ids before they ever reach a SQL filter. Anything
      // outside the allow-listed charset is a tampered payload — reject.
      for (const c of body.campaigns) {
        if (!SAFE_SYMBOL_ID.test(c.symbolId)) {
          return NextResponse.json({ error: "invalid symbol id" }, { status: 400 });
        }
      }
      const rows = body.campaigns.map((c) => ({
        venue_id: venueId,
        symbol_id: c.symbolId,
        reward_label: c.rewardLabel,
        coupon_prefix: c.couponPrefix,
        share: c.share,
        active: true,
      }));
      const { error: upErr } = await sb
        .from("campaigns")
        .upsert(rows, { onConflict: "venue_id,symbol_id" });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      // Deactivate campaigns whose symbol is no longer in the selection.
      // Two-step (select active ids → update by id list) avoids interpolating
      // user-controlled strings into the PostgREST `in` filter syntax.
      const { data: stale, error: selErr } = await sb
        .from("campaigns")
        .select("id, symbol_id")
        .eq("venue_id", venueId)
        .eq("active", true);
      if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
      const keepSet = new Set(rows.map((r) => r.symbol_id));
      const staleIds = (stale ?? [])
        .filter((r: { symbol_id: string }) => !keepSet.has(r.symbol_id))
        .map((r: { id: string }) => r.id);
      if (staleIds.length) {
        const { error: deErr } = await sb
          .from("campaigns")
          .update({ active: false })
          .in("id", staleIds);
        if (deErr) return NextResponse.json({ error: deErr.message }, { status: 500 });
      }
    } else {
      // No campaigns selected → deactivate all for this venue
      const { error: deAllErr } = await sb
        .from("campaigns")
        .update({ active: false })
        .eq("venue_id", venueId);
      if (deAllErr) return NextResponse.json({ error: deAllErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      venueId,
      slug,
      wasActive,
      prevPlan,
      prevBillingCycle,
      planChanged: wasActive && (prevPlan !== (body.plan ?? "kampanya") || prevBillingCycle !== (body.billingCycle ?? "monthly")),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
