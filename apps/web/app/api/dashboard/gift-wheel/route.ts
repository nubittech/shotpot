import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { WheelVariantDB } from "../../../../lib/supabase/types";

/**
 * Independent Gift Wheel configuration (migration 017).
 *
 *  GET  /api/dashboard/gift-wheel?slug=  → { variant, cfg }
 *  PUT  /api/dashboard/gift-wheel        → { slug, variant, cfg }  (save)
 *
 * Auth: owner of a pro venue (same pattern as /api/dashboard/gifts).
 */

const VARIANTS: WheelVariantDB[] = ["boho", "irish", "medit", "paris", "chalk"];

type GiftCfg = Record<string, { reward: string; coupon: string; share: number }>;

async function authVenue(slug: string) {
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
  if (!user) return { error: "unauthenticated" as const, status: 401 };

  const svc = getServiceClient();
  const { data: venue } = await svc
    .from("venues")
    .select("id, name, tier, gift_wheel_variant, gift_wheel_cfg")
    .eq("slug", slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  const v = venue as
    | { id: string; name: string; tier: string; gift_wheel_variant: WheelVariantDB | null; gift_wheel_cfg: GiftCfg | null }
    | null;
  if (!v) return { error: "forbidden" as const, status: 403 };
  if (v.tier !== "pro") return { error: "Pro tier gereklidir" as const, status: 400 };
  return { svc, venue: v };
}

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const auth = await authVenue(slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { venue } = auth;

    return NextResponse.json({
      variant: venue.gift_wheel_variant ?? "boho",
      cfg: venue.gift_wheel_cfg ?? {},
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string; variant?: string; cfg?: unknown };
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venue } = auth;

    const variant = body.variant as WheelVariantDB;
    if (!VARIANTS.includes(variant)) {
      return NextResponse.json({ error: "Geçersiz çark tipi" }, { status: 400 });
    }

    if (typeof body.cfg !== "object" || body.cfg === null) {
      return NextResponse.json({ error: "Geçersiz yapılandırma" }, { status: 400 });
    }

    const rawCfg = body.cfg as Record<string, unknown>;
    const cfg: GiftCfg = {};
    let hasPrize = false;
    for (const [segId, val] of Object.entries(rawCfg)) {
      if (typeof val !== "object" || val === null) continue;
      const entry = val as { reward?: unknown; coupon?: unknown; share?: unknown };
      const share = Number(entry.share);
      if (!Number.isFinite(share) || share < 0) {
        return NextResponse.json({ error: "Olasılık ağırlıkları sayı ve ≥ 0 olmalı" }, { status: 400 });
      }
      cfg[segId] = {
        reward: typeof entry.reward === "string" ? entry.reward : "",
        coupon: typeof entry.coupon === "string" ? entry.coupon : "",
        share,
      };
      if (share > 0) hasPrize = true;
    }

    if (!hasPrize) {
      return NextResponse.json({ error: "En az bir ödülün ağırlığı 0'dan büyük olmalı" }, { status: 400 });
    }

    const { error } = await svc
      .from("venues")
      .update({ gift_wheel_variant: variant, gift_wheel_cfg: cfg })
      .eq("id", venue.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, variant, cfg });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
