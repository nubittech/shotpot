import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";
import { getWheelSegmentDefs, segDefaultPrize, type WheelVariantKey } from "../../../../components/wheel/segments";

type GiftCfg = Record<string, { reward: string; coupon: string; share: number }>;

/**
 * POST /api/play/gift-spin  { slug }
 *
 * Consumes one pending gift-wheel spin for the logged-in customer and awards
 * a coupon. The gift wheel always wins — it picks a weighted-random reward
 * from the venue's campaign pool.
 *
 * Response: { win, isJackpot, outcome, coupon: { id, code, rewardLabel } }
 */

function makeCode(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${(prefix || "GIFT").toUpperCase()}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    // Auth
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
      .select("id, name, coupon_validity_days, gift_wheel_variant, gift_wheel_cfg")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    const v = venue as {
      id: string;
      name: string;
      coupon_validity_days?: number;
      gift_wheel_variant?: WheelVariantKey | null;
      gift_wheel_cfg?: GiftCfg | null;
    } | null;
    if (!v) return NextResponse.json({ error: "venue not found" }, { status: 404 });

    const validityDays = Number(v.coupon_validity_days ?? 0);
    const expiresAt = validityDays > 0
      ? new Date(Date.now() + validityDays * 86400_000).toISOString()
      : null;

    const { data: customer } = await svc
      .from("customers")
      .select("id")
      .eq("venue_id", v.id)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const c = customer as { id: string } | null;
    if (!c) return NextResponse.json({ error: "customer not found" }, { status: 403 });

    // Find an unused gift spin (oldest first)
    const { data: giftRow } = await svc
      .from("gift_spins")
      .select("id")
      .eq("venue_id", v.id)
      .eq("customer_id", c.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const gift = giftRow as { id: string } | null;
    if (!gift) {
      return NextResponse.json({ error: "Hediye çevirme hakkın yok.", code: "NO_GIFT" }, { status: 403 });
    }

    let rewardLabel = "Sürpriz ikram";
    let couponPrefix = "GIFT";

    // Reward pool — prefer the independent gift wheel config (migration 017).
    const giftVariant = (v.gift_wheel_variant ?? "boho") as WheelVariantKey;
    const giftCfg = (v.gift_wheel_cfg ?? {}) as GiftCfg;
    const defs = getWheelSegmentDefs(giftVariant);
    const defById = new Map(defs.map((d) => [d.id, d]));

    const giftPool = Object.entries(giftCfg)
      .map(([segId, c]) => {
        const def = defById.get(segId);
        const share = Number(c?.share || 0);
        if (!def || def.type === "lose" || share <= 0) return null;
        return {
          reward_label: (c.reward && c.reward.trim()) || segDefaultPrize(def, "tr") || rewardLabel,
          coupon_prefix: (c.coupon && c.coupon.trim()) || def.defaultCoupon || couponPrefix,
          share,
        };
      })
      .filter((p): p is { reward_label: string; coupon_prefix: string; share: number } => p !== null);

    if (giftPool.length > 0) {
      const total = giftPool.reduce((s, p) => s + p.share, 0);
      let roll = Math.random() * total;
      let picked = giftPool[giftPool.length - 1];
      for (const p of giftPool) {
        roll -= p.share;
        if (roll <= 0) { picked = p; break; }
      }
      rewardLabel = picked.reward_label || rewardLabel;
      couponPrefix = picked.coupon_prefix || couponPrefix;
    } else {
    // FALLBACK — legacy behavior: venue campaigns, weighted by share. Always a win.
    const { data: camps } = await svc
      .from("campaigns")
      .select("reward_label, coupon_prefix, share")
      .eq("venue_id", v.id);
    const pool = (camps ?? []) as Array<{ reward_label: string; coupon_prefix: string; share: number }>;

    if (pool.length > 0) {
      const total = pool.reduce((s, p) => s + Number(p.share || 0), 0) || pool.length;
      let roll = Math.random() * total;
      let picked = pool[pool.length - 1];
      for (const p of pool) {
        roll -= Number(p.share || 0) || total / pool.length;
        if (roll <= 0) { picked = p; break; }
      }
      rewardLabel = picked.reward_label || rewardLabel;
      couponPrefix = picked.coupon_prefix || couponPrefix;
    } else {
      // fallback to the venue jackpot reward
      const { data: cfg } = await svc
        .from("symbol_configs")
        .select("jackpot_reward, jackpot_coupon_prefix")
        .eq("venue_id", v.id)
        .maybeSingle();
      const sc = cfg as { jackpot_reward: string; jackpot_coupon_prefix: string } | null;
      if (sc) { rewardLabel = sc.jackpot_reward || rewardLabel; couponPrefix = sc.jackpot_coupon_prefix || couponPrefix; }
    }
    }

    // Create the coupon
    const code = makeCode(couponPrefix);
    const { data: cp } = await svc
      .from("coupons")
      .insert({
        venue_id: v.id,
        customer_id: c.id,
        reward_label: rewardLabel,
        code,
        spin_id: null,
        expires_at: expiresAt,
      })
      .select("id, code, reward_label")
      .single();
    const coupon = cp as { id: string; code: string; reward_label: string } | null;

    // Mark the gift spin used
    await svc
      .from("gift_spins")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
        reward_label: rewardLabel,
        coupon_id: coupon?.id ?? null,
      })
      .eq("id", gift.id);

    return NextResponse.json({
      win: true,
      isJackpot: false,
      outcome: rewardLabel,
      animationHint: "win" as const,
      coupon: coupon
        ? { id: coupon.id, code: coupon.code, rewardLabel: coupon.reward_label }
        : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
