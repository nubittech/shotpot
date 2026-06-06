import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { MenuDesign, MenuLanding } from "../../../../lib/supabase/types";

/**
 * Multi-menu + landing management.
 *   GET  ?slug                         -> { menus, landing }
 *   POST { slug, title }               -> create menu
 *   PUT  { slug, kind:"menu", id, ... } -> update menu (title/titleEn/icon/active/sortOrder/design)
 *   PUT  { slug, kind:"landing", landing } -> save landing config
 *   DELETE { slug, id }                -> delete menu
 * Gated by ownership + venues.digital_menu_enabled.
 */

async function authVenue(slug: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" as const, status: 401 };
  const svc = getServiceClient();
  const { data: venue } = await svc.from("venues").select("id, digital_menu_enabled").eq("slug", slug).eq("owner_user_id", user.id).maybeSingle();
  const v = venue as { id: string; digital_menu_enabled: boolean } | null;
  if (!v) return { error: "forbidden" as const, status: 403 };
  if (!v.digital_menu_enabled) return { error: "QR Menü eklentisi aktif değil" as const, status: 403 };
  return { svc, venueId: v.id };
}

function cleanDesign(d: unknown): MenuDesign {
  const dd = (d ?? {}) as MenuDesign;
  const layers = Array.isArray(dd.layers) ? dd.layers.slice(0, 300) : [];
  return {
    bgUrl: typeof dd.bgUrl === "string" ? dd.bgUrl.slice(0, 1000) : undefined,
    aspect: typeof dd.aspect === "number" && dd.aspect > 0 ? dd.aspect : undefined,
    layers: layers.map((l) => ({
      id: String(l.id), content: String(l.content ?? "").slice(0, 500),
      xPct: Number(l.xPct) || 0, yPct: Number(l.yPct) || 0, widthPct: Number(l.widthPct) || 30,
      fontSizePct: Number(l.fontSizePct) || 3, fontFamily: String(l.fontFamily ?? "Inter"),
      color: String(l.color ?? "#ffffff").slice(0, 32),
      align: (["left", "center", "right"].includes(l.align) ? l.align : "left") as "left" | "center" | "right",
      letterSpacing: Number(l.letterSpacing) || 0, lineHeight: Number(l.lineHeight) || 1.3,
      opacity: typeof l.opacity === "number" ? Math.max(0, Math.min(1, l.opacity)) : 1,
      weight: Number(l.weight) || 400, visible: l.visible !== false,
    })),
  };
}

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const auth = await authVenue(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { svc, venueId } = auth;
  const [{ data: menus }, { data: venue }] = await Promise.all([
    svc.from("digital_menus").select("*").eq("venue_id", venueId).order("sort_order", { ascending: true }),
    svc.from("venues").select("menu_landing").eq("id", venueId).maybeSingle(),
  ]);
  return NextResponse.json({ menus: menus ?? [], landing: (venue as { menu_landing?: MenuLanding } | null)?.menu_landing ?? {} });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string; title?: string };
    if (!body.slug || !body.title?.trim()) return NextResponse.json({ error: "slug ve başlık gerekli" }, { status: 400 });
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;
    const { data: top } = await svc.from("digital_menus").select("sort_order").eq("venue_id", venueId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const nextSort = typeof (top as { sort_order?: number } | null)?.sort_order === "number" ? (top as { sort_order: number }).sort_order + 1 : 0;
    const { data, error } = await svc.from("digital_menus").insert({ venue_id: venueId, title: body.title.trim(), sort_order: nextSort }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, menu: data });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      slug?: string; kind?: "menu" | "landing"; id?: string;
      title?: string; titleEn?: string; icon?: string; active?: boolean; sortOrder?: number; design?: MenuDesign;
      landing?: MenuLanding;
    };
    if (!body.slug) return NextResponse.json({ error: "slug gerekli" }, { status: 400 });
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    if (body.kind === "landing") {
      const l = (body.landing ?? {}) as MenuLanding;
      const clean: MenuLanding = {
        bgUrl: l.bgUrl?.slice(0, 1000), logoUrl: l.logoUrl?.slice(0, 1000),
        headline: l.headline?.slice(0, 200), headlineEn: l.headlineEn?.slice(0, 200),
        showPlay: !!l.showPlay, playLabel: l.playLabel?.slice(0, 100), playLabelEn: l.playLabelEn?.slice(0, 100),
      };
      const { error } = await svc.from("venues").update({ menu_landing: clean }).eq("id", venueId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (!body.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
    const { data: existing } = await svc.from("digital_menus").select("id, venue_id").eq("id", body.id).maybeSingle();
    if (!existing || (existing as { venue_id: string }).venue_id !== venueId) return NextResponse.json({ error: "menü bulunamadı" }, { status: 404 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.titleEn !== undefined) patch.title_en = body.titleEn.trim() || null;
    if (body.icon !== undefined) patch.icon = body.icon || null;
    if (body.active !== undefined) patch.active = body.active;
    if (body.sortOrder !== undefined) patch.sort_order = body.sortOrder;
    if (body.design !== undefined) patch.design = cleanDesign(body.design);
    const { error } = await svc.from("digital_menus").update(patch).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string; id?: string };
    if (!body.slug || !body.id) return NextResponse.json({ error: "slug ve id gerekli" }, { status: 400 });
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;
    const { error } = await svc.from("digital_menus").delete().eq("id", body.id).eq("venue_id", venueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
