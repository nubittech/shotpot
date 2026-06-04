import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * Public QR Digital Menu application intake.
 *   POST multipart/form-data
 *     fields: businessName, contactName?, phone?, email?, city?, message?
 *     files:  photos (0..10 images of the existing menu)
 *
 * Stores uploaded photos in the public `menu-applications` bucket and inserts
 * a row into digital_menu_applications for admin review. No auth — public form.
 */

const MAX_FILES = 10;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB each
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf",
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const businessName = String(form.get("businessName") ?? "").trim();
    const contactName = String(form.get("contactName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    if (!businessName || (!phone && !email)) {
      return NextResponse.json({ error: "businessName ve (phone veya email) gerekli" }, { status: 400 });
    }

    const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: "en fazla 10 fotoğraf" }, { status: 400 });
    }

    const svc = getServiceClient();
    const folder = Math.random().toString(36).slice(2, 12);
    const photoUrls: string[] = [];

    for (const file of files) {
      if (!ALLOWED.has(file.type)) continue;
      if (file.size > MAX_BYTES) continue;
      const ext = EXT[file.type] ?? "jpg";
      const rand = Math.random().toString(36).slice(2, 10);
      const path = `${folder}/${rand}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error: upErr } = await svc.storage
        .from("menu-applications")
        .upload(path, bytes, { contentType: file.type, upsert: false });
      if (upErr) continue;
      const { data: pub } = svc.storage.from("menu-applications").getPublicUrl(path);
      photoUrls.push(pub.publicUrl);
    }

    const { error: insErr } = await svc.from("digital_menu_applications").insert({
      business_name: businessName,
      contact_name: contactName || null,
      phone: phone || null,
      email: email || null,
      city: city || null,
      message: message || null,
      photo_urls: photoUrls,
      status: "new",
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
