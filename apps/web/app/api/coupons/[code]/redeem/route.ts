import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../../lib/supabase/server";

type Params = { params: { code: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("coupons")
    .select("id, code, reward_label, redeemed_at, venue_id")
    .eq("code", params.code)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });

  return NextResponse.json({
    valid: !data.redeemed_at,
    code: data.code,
    rewardLabel: data.reward_label,
    redeemedAt: data.redeemed_at,
    venueId: data.venue_id,
  });
}

export async function POST(_req: NextRequest, { params }: Params) {
  const sb = getServiceClient();

  const { data: existing } = await sb
    .from("coupons").select("id, redeemed_at").eq("code", params.code).maybeSingle();
  if (!existing) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  if (existing.redeemed_at) return NextResponse.json({ ok: false, reason: "already_redeemed" }, { status: 409 });

  const { data, error } = await sb.from("coupons")
    .update({ redeemed_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select("id, code, reward_label, redeemed_at")
    .single();

  if (error || !data) return NextResponse.json({ ok: false, error: error?.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    code: data.code,
    rewardLabel: data.reward_label,
    redeemedAt: data.redeemed_at,
  });
}
