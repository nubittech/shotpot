import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * Dashboard "Hediye Çark" management.
 *
 *  POST   /api/dashboard/gifts   { slug, audience, count }   → grant manual spins
 *  PATCH  /api/dashboard/gifts   { slug, dailyEnabled }      → toggle daily gift
 */

type Audience = "all" | "active30" | "dormant30" | "loyalty_gold" | "consented";

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
    .select("id, name, tier")
    .eq("slug", slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  const v = venue as { id: string; name: string; tier: string } | null;
  if (!v) return { error: "forbidden" as const, status: 403 };
  if (v.tier !== "pro") return { error: "Pro tier gereklidir" as const, status: 400 };
  return { svc, venue: v };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string; audience?: Audience; count?: number };
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venue } = auth;

    const audience: Audience = body.audience ?? "all";
    const count = Math.min(10, Math.max(1, Math.round(body.count ?? 1)));

    // Resolve audience → customer ids
    let q = svc.from("customers").select("id").eq("venue_id", venue.id).is("deleted_at", null);
    const d30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    switch (audience) {
      case "active30":     q = q.gte("last_visit_at", d30); break;
      case "dormant30":    q = q.lt("last_visit_at", d30); break;
      case "loyalty_gold": q = q.eq("loyalty_tier", "gold"); break;
      case "consented":    q = q.eq("consent_marketing", true); break;
    }
    const { data: targets } = await q;
    const ids = (targets ?? []).map((t) => (t as { id: string }).id);
    if (ids.length === 0) {
      return NextResponse.json({ error: "Bu kitlede müşteri yok" }, { status: 400 });
    }

    const rows = ids.flatMap((customer_id) =>
      Array.from({ length: count }, () => ({
        venue_id: venue.id,
        customer_id,
        source: "manual" as const,
        status: "pending" as const,
      }))
    );
    const { error: insErr } = await svc.from("gift_spins").insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, customers: ids.length, spinsGranted: rows.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string; dailyEnabled?: boolean };
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venue } = auth;

    const { error } = await svc
      .from("venues")
      .update({ gift_daily_enabled: !!body.dailyEnabled })
      .eq("id", venue.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, dailyEnabled: !!body.dailyEnabled });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
