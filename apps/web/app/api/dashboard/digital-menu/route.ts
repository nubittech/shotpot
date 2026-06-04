import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * QR Digital Menu CRUD (dashboard).
 *
 * Body always carries `slug` + `kind` ("category" | "item").
 *   POST   create
 *   PUT    update (by id)
 *   DELETE delete (by id)
 *
 * Gated by venues.digital_menu_enabled (the add-on flag), NOT the pro tier.
 */

const ALLOWED_TAGS = ["vegan", "vegetarian", "spicy", "glutenfree", "new", "popular"] as const;

type Kind = "category" | "item";

type Body = {
  slug?: string;
  kind?: Kind;
  id?: string;
  // category fields
  name?: string;
  nameEn?: string | null;
  // item fields
  categoryId?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  tags?: string[];
  isAvailable?: boolean;
  active?: boolean;
  sortOrder?: number;
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
    .select("id, digital_menu_enabled")
    .eq("slug", slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  const v = venue as { id: string; digital_menu_enabled: boolean } | null;
  if (!v) return { error: "forbidden" as const, status: 403 };
  if (!v.digital_menu_enabled) return { error: "QR Menü eklentisi aktif değil" as const, status: 403 };
  return { svc, venueId: v.id };
}

function cleanTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is (typeof ALLOWED_TAGS)[number] => (ALLOWED_TAGS as readonly string[]).includes(t));
}

/** Returns the next sort_order for a table scoped to a venue (and optional category). */
async function nextSort(svc: ReturnType<typeof getServiceClient>, table: string, venueId: string, categoryId?: string | null) {
  let q = svc.from(table).select("sort_order").eq("venue_id", venueId).order("sort_order", { ascending: false }).limit(1);
  if (table === "digital_menu_items" && categoryId) q = q.eq("category_id", categoryId);
  const { data } = await q.maybeSingle();
  const top = (data as { sort_order?: number } | null)?.sort_order;
  return typeof top === "number" ? top + 1 : 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.slug || !body.kind) return NextResponse.json({ error: "slug ve kind gerekli" }, { status: 400 });
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    if (body.kind === "category") {
      if (!body.name?.trim()) return NextResponse.json({ error: "Kategori adı gerekli" }, { status: 400 });
      const { data, error } = await svc
        .from("digital_menu_categories")
        .insert({
          venue_id: venueId,
          name: body.name.trim(),
          name_en: body.nameEn?.trim() || null,
          sort_order: await nextSort(svc, "digital_menu_categories", venueId),
        })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, id: (data as { id: string }).id });
    }

    // item
    if (!body.name?.trim()) return NextResponse.json({ error: "Ürün adı gerekli" }, { status: 400 });
    const { data, error } = await svc
      .from("digital_menu_items")
      .insert({
        venue_id: venueId,
        category_id: body.categoryId || null,
        name: body.name.trim(),
        name_en: body.nameEn?.trim() || null,
        description: body.description?.trim() || null,
        description_en: body.descriptionEn?.trim() || null,
        price: body.price ?? null,
        image_url: body.imageUrl || null,
        tags: cleanTags(body.tags),
        is_available: body.isAvailable ?? true,
        sort_order: await nextSort(svc, "digital_menu_items", venueId, body.categoryId),
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: (data as { id: string }).id });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.slug || !body.kind || !body.id) return NextResponse.json({ error: "slug, kind ve id gerekli" }, { status: 400 });
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    const table = body.kind === "category" ? "digital_menu_categories" : "digital_menu_items";

    // ownership check
    const { data: existing } = await svc.from(table).select("id, venue_id").eq("id", body.id).maybeSingle();
    if (!existing || (existing as { venue_id: string }).venue_id !== venueId) {
      return NextResponse.json({ error: "kayıt bulunamadı" }, { status: 404 });
    }

    if (body.kind === "category") {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name !== undefined) patch.name = body.name.trim();
      if (body.nameEn !== undefined) patch.name_en = body.nameEn?.trim() || null;
      if (body.active !== undefined) patch.active = body.active;
      if (body.sortOrder !== undefined) patch.sort_order = body.sortOrder;
      const { error } = await svc.from(table).update(patch).eq("id", body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // item
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.nameEn !== undefined) patch.name_en = body.nameEn?.trim() || null;
    if (body.description !== undefined) patch.description = body.description?.trim() || null;
    if (body.descriptionEn !== undefined) patch.description_en = body.descriptionEn?.trim() || null;
    if (body.price !== undefined) patch.price = body.price ?? null;
    if (body.imageUrl !== undefined) patch.image_url = body.imageUrl || null;
    if (body.tags !== undefined) patch.tags = cleanTags(body.tags);
    if (body.isAvailable !== undefined) patch.is_available = body.isAvailable;
    if (body.categoryId !== undefined) patch.category_id = body.categoryId || null;
    if (body.active !== undefined) patch.active = body.active;
    if (body.sortOrder !== undefined) patch.sort_order = body.sortOrder;
    const { error } = await svc.from(table).update(patch).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.slug || !body.kind || !body.id) return NextResponse.json({ error: "slug, kind ve id gerekli" }, { status: 400 });
    const auth = await authVenue(body.slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    const table = body.kind === "category" ? "digital_menu_categories" : "digital_menu_items";
    const { error } = await svc.from(table).delete().eq("id", body.id).eq("venue_id", venueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
