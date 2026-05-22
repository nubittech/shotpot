import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * GET /api/admin/analytics
 *
 * Global cross-venue KPIs. All numbers exclude synthetic (admin-granted)
 * receipts so the dashboard reflects real customer behavior.
 */
export async function GET() {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const svc = getServiceClient();
  const now = new Date();
  const d7  = new Date(now.getTime() - 7  * 86400000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    venuesTotal,
    venuesActive,
    customersTotal,
    receiptsTotal,
    receipts7d,
    receipts30d,
    spinsTotal,
    couponsTotal,
    couponsRedeemed,
  ] = await Promise.all([
    svc.from("venues").select("id", { count: "exact", head: true }),
    svc.from("venues").select("id", { count: "exact", head: true }).eq("active", true),
    svc.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null),
    svc.from("receipts").select("id", { count: "exact", head: true }).eq("is_synthetic", false),
    svc.from("receipts").select("id", { count: "exact", head: true }).eq("is_synthetic", false).gte("created_at", d7),
    svc.from("receipts").select("id", { count: "exact", head: true }).eq("is_synthetic", false).gte("created_at", d30),
    svc.from("spins").select("id", { count: "exact", head: true }),
    svc.from("coupons").select("id", { count: "exact", head: true }),
    svc.from("coupons").select("id", { count: "exact", head: true }).not("redeemed_at", "is", null),
  ]);

  return NextResponse.json({
    venues:       { total: venuesTotal.count ?? 0, active: venuesActive.count ?? 0 },
    customers:    { total: customersTotal.count ?? 0 },
    receipts:     { total: receiptsTotal.count ?? 0, last7d: receipts7d.count ?? 0, last30d: receipts30d.count ?? 0 },
    spins:        { total: spinsTotal.count ?? 0 },
    coupons:      {
      total: couponsTotal.count ?? 0,
      redeemed: couponsRedeemed.count ?? 0,
      redemptionRate: (couponsTotal.count ?? 0) > 0
        ? Math.round(((couponsRedeemed.count ?? 0) / (couponsTotal.count ?? 1)) * 1000) / 10
        : 0,
    },
    generatedAt: now.toISOString(),
    by: gate.email,
  });
}
