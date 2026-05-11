import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";

type SpinBody = {
  slug: string;
  guestToken?: string;
  customerId?: string;
  receiptId?: string;  // optional explicit receipt to consume
};

function pickOutcome(
  winRate: number,
  jackpotShare: number,
  campaigns: Array<{ id: string; symbol_id: string; reward_label: string; coupon_prefix: string; share: number }>
) {
  const roll = Math.random();
  const jackpotProb = winRate * jackpotShare;

  if (roll < jackpotProb) {
    return { kind: "jackpot" as const };
  }

  const symWinSpan = winRate - jackpotProb;
  const totalShare = campaigns.reduce((s, c) => s + Number(c.share), 0) || 1;

  let acc = jackpotProb;
  for (const c of campaigns) {
    acc += symWinSpan * (Number(c.share) / totalShare);
    if (roll < acc) {
      return { kind: "win" as const, campaign: c };
    }
  }
  return { kind: "lose" as const };
}

function makeCode(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${rand}`;
}

/* ─── Find an active receipt with remaining tokens ─── */
async function findActiveReceipt(
  sb: ReturnType<typeof getServiceClient>,
  venueId: string,
  guestToken: string | null,
  customerId: string | null,
  explicitReceiptId: string | null
): Promise<{ id: string; remaining: number } | null> {
  // 1) If explicit receipt provided, validate it
  if (explicitReceiptId) {
    const { data: r } = await sb
      .from("receipts")
      .select("id, tokens_awarded, valid, venue_id")
      .eq("id", explicitReceiptId)
      .maybeSingle();
    const rec = r as { id: string; tokens_awarded: number; valid: boolean; venue_id: string } | null;
    if (!rec || !rec.valid || rec.venue_id !== venueId) return null;

    const { count } = await sb
      .from("spins").select("*", { count: "exact", head: true })
      .eq("receipt_id", rec.id);
    const used = count ?? 0;
    if (used < rec.tokens_awarded) {
      return { id: rec.id, remaining: rec.tokens_awarded - used };
    }
    return null;
  }

  // 2) Look up the most recent valid receipt for this guest/customer
  let q = sb
    .from("receipts")
    .select("id, tokens_awarded, valid, created_at")
    .eq("venue_id", venueId)
    .eq("valid", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (customerId) q = q.eq("customer_id", customerId);
  else if (guestToken) q = q.eq("guest_token", guestToken);
  else return null;

  const { data: receipts } = await q;
  const list = (receipts ?? []) as Array<{ id: string; tokens_awarded: number; valid: boolean }>;

  for (const r of list) {
    const { count } = await sb
      .from("spins").select("*", { count: "exact", head: true })
      .eq("receipt_id", r.id);
    const used = count ?? 0;
    if (used < r.tokens_awarded) {
      return { id: r.id, remaining: r.tokens_awarded - used };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SpinBody;
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const sb = getServiceClient();

    const { data: venue } = await sb
      .from("venues")
      .select("id, slug, active")
      .eq("slug", body.slug)
      .maybeSingle();
    if (!venue || !venue.active) return NextResponse.json({ error: "venue not found" }, { status: 404 });

    // Find an active receipt with tokens remaining
    const receipt = await findActiveReceipt(
      sb,
      venue.id,
      body.guestToken ?? null,
      body.customerId ?? null,
      body.receiptId ?? null,
    );

    if (!receipt) {
      return NextResponse.json(
        { error: "Aktif fiş bulunamadı. Önce fiş tara.", code: "NO_TOKENS" },
        { status: 403 }
      );
    }

    const [{ data: cfg }, { data: camps }] = await Promise.all([
      sb.from("symbol_configs").select("*").eq("venue_id", venue.id).maybeSingle(),
      sb.from("campaigns").select("*").eq("venue_id", venue.id),
    ]);
    if (!cfg) return NextResponse.json({ error: "config missing" }, { status: 500 });

    const result = pickOutcome(Number(cfg.win_rate), Number(cfg.jackpot_share), camps ?? []);

    let outcome = "No Reward";
    let win = false;
    let isJackpot = false;
    let campaignId: string | null = null;
    let couponCode: string | null = null;
    let rewardLabel: string | null = null;

    if (result.kind === "jackpot") {
      outcome = cfg.jackpot_reward;
      win = true;
      isJackpot = true;
      couponCode = makeCode(cfg.jackpot_coupon_prefix);
      rewardLabel = cfg.jackpot_reward;
    } else if (result.kind === "win") {
      outcome = result.campaign.reward_label;
      win = true;
      campaignId = result.campaign.id;
      couponCode = makeCode(result.campaign.coupon_prefix);
      rewardLabel = result.campaign.reward_label;
    }

    // Insert spin row tied to the real receipt
    const { data: spinRow } = await sb.from("spins").insert({
      venue_id: venue.id,
      guest_token: body.guestToken ?? null,
      customer_id: body.customerId ?? null,
      receipt_id: receipt.id,
      campaign_id: campaignId,
      is_jackpot: isJackpot,
      win,
      outcome,
    }).select("id").single();

    let coupon: { id: string; code: string; rewardLabel: string } | null = null;
    if (win && couponCode && rewardLabel && spinRow) {
      const { data: cp } = await sb.from("coupons").insert({
        venue_id: venue.id,
        guest_token: body.guestToken ?? null,
        customer_id: body.customerId ?? null,
        spin_id: spinRow.id,
        code: couponCode,
        reward_label: rewardLabel,
      }).select("id, code, reward_label").single();
      if (cp) {
        coupon = { id: cp.id, code: cp.code, rewardLabel: cp.reward_label };
      }
    }

    return NextResponse.json({
      outcome,
      win,
      isJackpot,
      coupon,
      tokensRemaining: receipt.remaining - 1,
      animationHint: isJackpot ? "jackpot" : win ? "win" : "standard",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
