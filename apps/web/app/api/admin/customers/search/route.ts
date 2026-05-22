import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/auth/admin";
import { getServiceClient } from "../../../../../lib/supabase/server";

/**
 * GET /api/admin/customers/search?q=...
 *
 * Phone / email / name lookup across every venue. Soft-deleted rows excluded.
 * Capped at 50 results to keep the page snappy.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ customers: [] });

  // Escape PostgREST ilike wildcards in user input. Build the OR clause via
  // explicit args; supabase-js handles parameterization for these column ops.
  const safe = q.replace(/[%,]/g, " ").slice(0, 60);
  const svc = getServiceClient();

  const { data, error } = await svc
    .from("customers")
    .select("id, venue_id, full_name, phone, email, loyalty_tier, total_visits, total_spend, last_visit_at, created_at")
    .is("deleted_at", null)
    .or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`)
    .order("last_visit_at", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data ?? [] });
}
