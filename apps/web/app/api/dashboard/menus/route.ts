import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * Dashboard "Sana Özel Menü" CRUD.
 *
 *  POST   /api/dashboard/menus   create  { slug, ...menu, items }
 *  PUT    /api/dashboard/menus   update  { slug, id, ...menu, items }
 *  DELETE /api/dashboard/menus   delete  { slug, id }
 */

type MenuItem = { name: string; description?: string | null; oldPrice?: number | null; newPrice?: number | null };
type MenuBody = {
  slug: string;
  id?: string;
  title: string;
  description?: string | null;
  audience?: "all" | "active30" | "dormant30" | "loyalty_silver" | "loyalty_gold" | "consented";
  active?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  items: MenuItem[];
};

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
    .select("id, tier")
    .eq("slug", slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  const v = venue as { id: string; tier: string } | null;
  if (!v) return { error: "forbidden" as const, status: 403 };
  if (v.tier !== "pro") return { error: "Pro tier gereklidir" as const, status: 400 };
  return { svc, venueId: v.id };
}

function itemRows(menuId: string, items: MenuItem[]) {
  return items
    .filter((it) => it.name?.trim())
    .map((it, i) => ({
      menu_id: menuId,
      name: it.name.trim(),
      description: it.description?.trim() || null,
      old_price: it.oldPrice ?? null,
      new_price: it.newPrice ?? null,
      sort_order: i,
    }));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MenuBody;
    if (!body.slug || !body.title?.trim()) {
      return NextResponse.json({ error: "slug ve başlık gerekli" }, { status: 400 });
    }
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    const { data: menu, error: mErr } = await svc
      .from("customer_menus")
      .insert({
        venue_id: venueId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        audience: body.audience ?? "all",
        active: body.active ?? true,
        valid_from: body.validFrom || null,
        valid_to: body.validTo || null,
      })
      .select("id")
      .single();
    if (mErr || !menu) return NextResponse.json({ error: mErr?.message ?? "menü oluşturulamadı" }, { status: 500 });

    const rows = itemRows((menu as { id: string }).id, body.items ?? []);
    if (rows.length > 0) {
      const { error: iErr } = await svc.from("customer_menu_items").insert(rows);
      if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: (menu as { id: string }).id });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as MenuBody;
    if (!body.slug || !body.id || !body.title?.trim()) {
      return NextResponse.json({ error: "slug, id ve başlık gerekli" }, { status: 400 });
    }
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    // ownership check on the menu row
    const { data: existing } = await svc
      .from("customer_menus")
      .select("id, venue_id")
      .eq("id", body.id)
      .maybeSingle();
    if (!existing || (existing as { venue_id: string }).venue_id !== venueId) {
      return NextResponse.json({ error: "menü bulunamadı" }, { status: 404 });
    }

    const { error: mErr } = await svc
      .from("customer_menus")
      .update({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        audience: body.audience ?? "all",
        active: body.active ?? true,
        valid_from: body.validFrom || null,
        valid_to: body.validTo || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

    // replace items
    await svc.from("customer_menu_items").delete().eq("menu_id", body.id);
    const rows = itemRows(body.id, body.items ?? []);
    if (rows.length > 0) {
      const { error: iErr } = await svc.from("customer_menu_items").insert(rows);
      if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: body.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug: string; id: string };
    if (!body.slug || !body.id) return NextResponse.json({ error: "slug ve id gerekli" }, { status: 400 });

    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    const { error } = await svc
      .from("customer_menus")
      .delete()
      .eq("id", body.id)
      .eq("venue_id", venueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
