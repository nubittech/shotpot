import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * GET /api/studio/check-slug?slug=xxx
 * Lightweight availability check for the studio slug field.
 * Returns { available } — false if any venue already uses this slug.
 */
export async function GET(req: NextRequest) {
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!slug || slug.length < 2) return NextResponse.json({ available: false, reason: "too_short" });

  const svc = getServiceClient();
  const { data } = await svc.from("venues").select("id").eq("slug", slug).maybeSingle();
  return NextResponse.json({ available: !data });
}
