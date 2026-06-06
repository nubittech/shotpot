import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { MenuDesign } from "../../../../lib/supabase/types";

/**
 * Visual menu design (overlay editor) persistence.
 *   GET ?slug   -> { design }
 *   PUT { slug, design }  -> save
 * Gated by ownership + venues.digital_menu_enabled.
 */

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
    .from("venues").select("id, digital_menu_enabled").eq("slug", slug).eq("owner_user_id", user.id).maybeSingle();
  const v = venue as { id: string; digital_menu_enabled: boolean } | null;
  if (!v) return { error: "forbidden" as const, status: 403 };
  if (!v.digital_menu_enabled) return { error: "QR Menü eklentisi aktif değil" as const, status: 403 };
  return { svc, venueId: v.id };
}

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const auth = await authVenue(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { svc, venueId } = auth;
  const { data } = await svc.from("venues").select("menu_design").eq("id", venueId).maybeSingle();
  return NextResponse.json({ design: (data as { menu_design?: MenuDesign } | null)?.menu_design ?? {} });
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string; design?: MenuDesign };
    if (!body.slug || !body.design) return NextResponse.json({ error: "slug ve design gerekli" }, { status: 400 });
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    // Sanitize: cap layer count and string sizes (abuse guard)
    const d = body.design;
    const layers = Array.isArray(d.layers) ? d.layers.slice(0, 200) : [];
    const clean: MenuDesign = {
      bgUrl: typeof d.bgUrl === "string" ? d.bgUrl.slice(0, 1000) : undefined,
      aspect: typeof d.aspect === "number" && d.aspect > 0 ? d.aspect : undefined,
      layers: layers.map((l) => ({
        id: String(l.id),
        content: String(l.content ?? "").slice(0, 500),
        xPct: Number(l.xPct) || 0,
        yPct: Number(l.yPct) || 0,
        widthPct: Number(l.widthPct) || 30,
        fontSizePct: Number(l.fontSizePct) || 3,
        fontFamily: String(l.fontFamily ?? "Inter"),
        color: String(l.color ?? "#ffffff").slice(0, 32),
        align: (["left", "center", "right"].includes(l.align) ? l.align : "left") as "left" | "center" | "right",
        letterSpacing: Number(l.letterSpacing) || 0,
        lineHeight: Number(l.lineHeight) || 1.3,
        opacity: typeof l.opacity === "number" ? Math.max(0, Math.min(1, l.opacity)) : 1,
        weight: Number(l.weight) || 400,
        visible: l.visible !== false,
      })),
    };

    const { error } = await svc.from("venues").update({ menu_design: clean }).eq("id", venueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
