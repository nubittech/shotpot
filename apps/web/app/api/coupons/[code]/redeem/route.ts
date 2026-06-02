import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../../lib/supabase/server";

type Params = { params: { code: string } };

/** Resolve a venue slug → id, used to scope coupon lookups/redemptions to the
 *  venue the staff panel is actually open for. */
async function venueIdForSlug(
  sb: ReturnType<typeof getServiceClient>,
  slug: string | null,
): Promise<string | null> {
  if (!slug) return null;
  const { data } = await sb.from("venues").select("id").eq("slug", slug).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const sb = getServiceClient();
  const slug = new URL(req.url).searchParams.get("venue");

  const { data, error } = await sb
    .from("coupons")
    .select("id, code, reward_label, redeemed_at, expires_at, venue_id")
    .eq("code", params.code)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });

  // Venue scoping: a coupon belongs to exactly one venue. If the staff panel
  // is open for a specific venue, refuse to surface another venue's coupon.
  if (slug) {
    const venueId = await venueIdForSlug(sb, slug);
    if (venueId && data.venue_id !== venueId) {
      return NextResponse.json({ valid: false, reason: "wrong_venue" }, { status: 404 });
    }
  }

  const expired = !!data.expires_at && new Date(data.expires_at).getTime() < Date.now();

  return NextResponse.json({
    valid: !data.redeemed_at && !expired,
    expired,
    code: data.code,
    rewardLabel: data.reward_label,
    redeemedAt: data.redeemed_at,
    expiresAt: data.expires_at,
    venueId: data.venue_id,
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const sb = getServiceClient();

  // Accept an optional venue slug (sent by the staff scan panel). When present
  // it both scopes the redemption to that venue and is recorded as the
  // redeemer for traceability (no full staff auth yet — that's a later phase).
  let slug: string | null = null;
  const body = await req.json().catch(() => null) as { venue?: string } | null;
  slug = body?.venue ?? null;
  if (!slug) slug = new URL(req.url).searchParams.get("venue");

  const { data: existing } = await sb
    .from("coupons").select("id, redeemed_at, expires_at, venue_id").eq("code", params.code).maybeSingle();
  if (!existing) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  // Refuse cross-venue redemption — can't burn another venue's coupon.
  if (slug) {
    const venueId = await venueIdForSlug(sb, slug);
    if (venueId && existing.venue_id !== venueId) {
      return NextResponse.json({ ok: false, reason: "wrong_venue" }, { status: 404 });
    }
  }

  if (existing.redeemed_at) return NextResponse.json({ ok: false, reason: "already_redeemed" }, { status: 409 });
  if (existing.expires_at && new Date(existing.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, reason: "expired" }, { status: 409 });
  }

  const { data, error } = await sb.from("coupons")
    .update({ redeemed_at: new Date().toISOString(), redeemed_by: slug ?? "staff" })
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
