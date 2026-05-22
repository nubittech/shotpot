import { notFound } from "next/navigation";
import { getServiceClient } from "../../../../lib/supabase/server";
import VenueAdminControls from "./VenueAdminControls";

export const dynamic = "force-dynamic";

async function loadVenue(slug: string) {
  const svc = getServiceClient();
  const { data: venue } = await svc
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!venue) return null;
  const v = venue as Record<string, unknown> & { id: string };

  const [{ count: receiptsAll }, { count: receiptsReal }, { count: spins }, { count: customers }, { count: coupons }, { count: couponsRed }] =
    await Promise.all([
      svc.from("receipts").select("id", { count: "exact", head: true }).eq("venue_id", v.id),
      svc.from("receipts").select("id", { count: "exact", head: true }).eq("venue_id", v.id).eq("is_synthetic", false),
      svc.from("spins").select("id", { count: "exact", head: true }).eq("venue_id", v.id),
      svc.from("customers").select("id", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null),
      svc.from("coupons").select("id", { count: "exact", head: true }).eq("venue_id", v.id),
      svc.from("coupons").select("id", { count: "exact", head: true }).eq("venue_id", v.id).not("redeemed_at", "is", null),
    ]);

  const { data: recentReceipts } = await svc
    .from("receipts")
    .select("id, amount, tokens_awarded, is_synthetic, valid, created_at, ocr_status, granted_by_admin")
    .eq("venue_id", v.id)
    .order("created_at", { ascending: false })
    .limit(15);

  const { data: recentAudit } = await svc
    .from("admin_audit")
    .select("id, admin_email, action, payload, created_at")
    .eq("venue_id", v.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    venue: v,
    metrics: {
      receiptsAll:  receiptsAll  ?? 0,
      receiptsReal: receiptsReal ?? 0,
      spins:        spins        ?? 0,
      customers:    customers    ?? 0,
      coupons:      coupons      ?? 0,
      couponsRed:   couponsRed   ?? 0,
    },
    recentReceipts: (recentReceipts ?? []) as Array<{
      id: string; amount: number; tokens_awarded: number; is_synthetic: boolean;
      valid: boolean; created_at: string; ocr_status: string | null; granted_by_admin: string | null;
    }>,
    recentAudit: (recentAudit ?? []) as Array<{
      id: string; admin_email: string; action: string; payload: Record<string, unknown>; created_at: string;
    }>,
  };
}

export default async function AdminVenueDetail({ params }: { params: { slug: string } }) {
  const data = await loadVenue(params.slug);
  if (!data) notFound();
  const { venue, metrics, recentReceipts, recentAudit } = data;
  const v = venue as unknown as {
    id: string; slug: string; name: string; plan: string; tier: string; billing_cycle: string;
    active: boolean | null; stripe_subscription_id: string | null;
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <a href="/admin/venues" style={{ color: "#7bb3ff", fontSize: 13, textDecoration: "none" }}>← Tüm işletmeler</a>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{v.name}</h1>
        <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
          <code>{v.slug}</code> · {v.plan} · {v.tier} · {v.billing_cycle}{" "}
          {v.active ? <span style={{ color: "#5eb95e" }}>● aktif</span> : <span style={{ color: "#aaa" }}>○ pasif</span>}
          {v.stripe_subscription_id && <> · <span style={{ color: "#5eb95e" }}>Paddle bağlı</span></>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
        <Stat label="Müşteri"     value={metrics.customers} />
        <Stat label="Fiş (gerçek)" value={metrics.receiptsReal} />
        <Stat label="Fiş (tüm)"    value={metrics.receiptsAll} />
        <Stat label="Spin"         value={metrics.spins} />
        <Stat label="Kupon"        value={metrics.coupons} />
        <Stat label="Kullanılan"   value={metrics.couponsRed} />
      </div>

      <VenueAdminControls venue={{
        slug: v.slug,
        plan: v.plan as "kampanya" | "isletme",
        tier: v.tier as "standard" | "pro",
        billingCycle: v.billing_cycle as "monthly" | "yearly",
        active: !!v.active,
        hasPaddle: !!v.stripe_subscription_id,
      }} />

      <Section title="Son Fişler">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ color: "#888", textAlign: "left" }}>
            <tr><Th>Tarih</Th><Th>Tutar</Th><Th>Token</Th><Th>Durum</Th><Th>Tip</Th></tr>
          </thead>
          <tbody>
            {recentReceipts.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #1a1a1a" }}>
                <Td style={{ color: "#bbb" }}>{new Date(r.created_at).toLocaleString("tr-TR")}</Td>
                <Td>{r.amount}</Td>
                <Td>{r.tokens_awarded}</Td>
                <Td style={{ color: r.valid ? "#5eb95e" : "#cc6666" }}>{r.valid ? "geçerli" : (r.ocr_status ?? "—")}</Td>
                <Td>{r.is_synthetic ? <span style={{ color: "#e6b800" }}>demo · {r.granted_by_admin ?? "?"}</span> : "gerçek"}</Td>
              </tr>
            ))}
            {recentReceipts.length === 0 && <tr><Td style={{ color: "#666" }} ><span>Henüz fiş yok</span></Td></tr>}
          </tbody>
        </table>
      </Section>

      <Section title="Bu İşletme İçin Son Admin Eylemleri">
        {recentAudit.length === 0 ? (
          <div style={{ color: "#666", fontSize: 12 }}>Henüz admin eylemi yok</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recentAudit.map((a) => (
              <li key={a.id} style={{ padding: "8px 0", borderTop: "1px solid #1a1a1a", fontSize: 12 }}>
                <div style={{ color: "#bbb" }}>
                  <strong style={{ color: "#fff" }}>{a.action}</strong> · {a.admin_email}
                  <span style={{ color: "#666" }}> · {new Date(a.created_at).toLocaleString("tr-TR")}</span>
                </div>
                <pre style={{ color: "#888", margin: "4px 0 0", fontSize: 11, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(a.payload, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, background: "#141414", border: "1px solid #1f1f1f" }}>
      <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "#fff" }}>{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: 0.6 }}>{title}</h2>
      <div style={{ padding: 14, background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8 }}>{children}</div>
    </section>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "6px 10px", fontWeight: 600, fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase" }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "6px 10px", ...style }}>{children}</td>;
}
