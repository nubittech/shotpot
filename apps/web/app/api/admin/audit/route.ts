import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * GET /api/admin/audit?venueId=&limit=
 *
 * Latest privileged actions. Optional venue scope.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const url = new URL(req.url);
  const venueId = url.searchParams.get("venueId");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);

  const svc = getServiceClient();
  let q = svc
    .from("admin_audit")
    .select("id, admin_email, action, venue_id, target_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (venueId) q = q.eq("venue_id", venueId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ audit: data ?? [], by: gate.email });
}
