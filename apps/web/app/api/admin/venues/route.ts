import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { getServiceClient } from "../../../../lib/supabase/server";

/** GET /api/admin/venues — list every venue with light aggregates. */
export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const svc = getServiceClient();
  const { data: venues, error } = await svc
    .from("venues")
    .select("id, slug, name, plan, tier, billing_cycle, active, currency, game_type, wheel_variant, owner_user_id, created_at, stripe_subscription_id")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pull aggregates in parallel. Synthetic receipts are excluded from counts.
  const ids = (venues ?? []).map((v: { id: string }) => v.id);
  const [{ data: receiptAgg }, { data: spinAgg }, { data: custAgg }] = await Promise.all([
    svc.from("receipts").select("venue_id", { count: "exact", head: false })
      .in("venue_id", ids).eq("is_synthetic", false),
    svc.from("spins").select("venue_id").in("venue_id", ids),
    svc.from("customers").select("venue_id").in("venue_id", ids).is("deleted_at", null),
  ]);

  const countBy = (rows: Array<{ venue_id: string }> | null): Record<string, number> => {
    const m: Record<string, number> = {};
    (rows ?? []).forEach((r) => { m[r.venue_id] = (m[r.venue_id] ?? 0) + 1; });
    return m;
  };
  const receiptCounts = countBy(receiptAgg as Array<{ venue_id: string }> | null);
  const spinCounts = countBy(spinAgg as Array<{ venue_id: string }> | null);
  const custCounts = countBy(custAgg as Array<{ venue_id: string }> | null);

  const rows = (venues ?? []).map((v: { id: string } & Record<string, unknown>) => ({
    ...v,
    metrics: {
      receipts: receiptCounts[v.id] ?? 0,
      spins: spinCounts[v.id] ?? 0,
      customers: custCounts[v.id] ?? 0,
    },
  }));

  return NextResponse.json({ venues: rows });
}
