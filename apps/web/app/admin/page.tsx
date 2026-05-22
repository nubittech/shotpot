import { getServiceClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadStats() {
  const svc = getServiceClient();
  const now = new Date();
  const d7  = new Date(now.getTime() - 7  * 86400000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [vAll, vAct, cAll, rAll, r7, r30, sAll, cpAll, cpRed] = await Promise.all([
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

  const total = cpAll.count ?? 0;
  const red   = cpRed.count ?? 0;
  return {
    venuesTotal:  vAll.count ?? 0,
    venuesActive: vAct.count ?? 0,
    customers:    cAll.count ?? 0,
    receiptsTotal: rAll.count ?? 0,
    receipts7d:   r7.count   ?? 0,
    receipts30d:  r30.count  ?? 0,
    spins:        sAll.count ?? 0,
    coupons:      total,
    couponsRedeemed: red,
    redemptionRate: total > 0 ? Math.round((red / total) * 1000) / 10 : 0,
  };
}

export default async function AdminDashboard() {
  const s = await loadStats();
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Genel Bakış</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
        Demo (synthetic) fişler sayımdan dışlandı. Tüm gerçek müşteri verisi.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Card label="Toplam İşletme" value={s.venuesTotal} sub={`${s.venuesActive} aktif`} />
        <Card label="Toplam Müşteri" value={s.customers} />
        <Card label="Toplam Fiş"     value={s.receiptsTotal} sub={`son 7g: ${s.receipts7d}`} />
        <Card label="Toplam Spin"    value={s.spins} />
        <Card label="Üretilen Kupon" value={s.coupons} />
        <Card label="Kullanılan Kupon" value={s.couponsRedeemed} />
        <Card label="Kullanım Oranı" value={`${s.redemptionRate}%`} />
        <Card label="Fiş (son 30g)"  value={s.receipts30d} />
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      padding: 16, borderRadius: 10, background: "#141414", border: "1px solid #1f1f1f",
    }}>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: "#fff" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
