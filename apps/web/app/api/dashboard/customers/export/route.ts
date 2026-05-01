import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../../lib/supabase/server";

/** GET /api/dashboard/customers/export?slug=xxx — returns CSV of customers */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

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
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const svc = getServiceClient();

  // Verify ownership
  const { data: venue } = await svc
    .from("venues")
    .select("id, name")
    .eq("slug", slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!venue) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const v = venue as { id: string; name: string };

  // Fetch customers
  const { data: customers } = await svc
    .from("customers")
    .select("full_name, email, phone, loyalty_tier, total_visits, total_spend, consent_marketing, last_visit_at, created_at")
    .eq("venue_id", v.id)
    .is("deleted_at", null)
    .order("total_spend", { ascending: false });

  // Build CSV
  const rows = (customers ?? []) as Array<{
    full_name: string | null; email: string | null; phone: string | null;
    loyalty_tier: string; total_visits: number; total_spend: number;
    consent_marketing: boolean; last_visit_at: string | null; created_at: string;
  }>;

  const escape = (s: string | null | undefined) => {
    if (s == null) return "";
    const str = String(s);
    if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = "Ad Soyad;E-posta;Telefon;Seviye;Ziyaret;Toplam Harcama;Kampanya Onayı;Son Ziyaret;Üyelik Tarihi";
  const lines = rows.map((r) => [
    escape(r.full_name),
    escape(r.email),
    escape(r.phone),
    r.loyalty_tier,
    r.total_visits,
    r.total_spend,
    r.consent_marketing ? "Evet" : "Hayır",
    r.last_visit_at ? new Date(r.last_visit_at).toLocaleString("tr-TR") : "",
    new Date(r.created_at).toLocaleDateString("tr-TR"),
  ].join(";"));

  const csv = "﻿" + [header, ...lines].join("\n"); // BOM for Excel UTF-8
  const filename = `${v.name.replace(/[^a-zA-Z0-9]/g, "_")}_customers_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
