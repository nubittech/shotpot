import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../../lib/supabase/server";

/**
 * Image upload for digital menu items.
 *   POST multipart/form-data  { slug, file }
 * Stores into the public `menu-images` bucket and returns { url }.
 * Gated by ownership + venues.digital_menu_enabled.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

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

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const slug = String(form.get("slug") ?? "");
    const file = form.get("file");
    if (!slug) return NextResponse.json({ error: "slug gerekli" }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "dosya gerekli" }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "geçersiz dosya tipi" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "dosya çok büyük" }, { status: 413 });

    const auth = await authVenue(slug);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { svc, venueId } = auth;

    const ext = EXT[file.type] ?? "jpg";
    const rand = Math.random().toString(36).slice(2, 12);
    const path = `${venueId}/${rand}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await svc.storage
      .from("menu-images")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: pub } = svc.storage.from("menu-images").getPublicUrl(path);
    return NextResponse.json({ ok: true, url: pub.publicUrl });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
