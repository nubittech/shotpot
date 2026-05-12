import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ language: "tr" });

  const sb = getServiceClient();
  const { data } = await sb
    .from("venues")
    .select("interface_language")
    .eq("slug", slug)
    .maybeSingle();

  const language = (data as { interface_language?: string } | null)?.interface_language === "en" ? "en" : "tr";
  return NextResponse.json({ language });
}
