import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { CustomerPro } from "../../../../lib/supabase/types";

type Params = { params: { slug: string } };

const LOYALTY_BADGE: Record<string, string> = {
  bronze: "🥉 Bronz",
  silver: "🥈 Gümüş",
  gold:   "🥇 Altın",
};

export default async function CustomersPage({ params }: Params) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const svc = getServiceClient();

  // Verify venue ownership
  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, tier")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/dashboard");

  const v = venue as { id: string; name: string; slug: string; tier: string };

  if (v.tier !== "pro") {
    return (
      <Shell title="Müşteriler" venueName={v.name} slug={v.slug}>
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <p style={{ color: "rgba(244,239,230,0.5)", fontSize: 14 }}>
            Müşteri takibi <strong style={{ color: "#ffd84e" }}>Pro</strong> hesaba özeldir.
          </p>
          <Link href="/studio" style={primaryLink}>Pro&apos;ya Geç →</Link>
        </div>
      </Shell>
    );
  }

  // Fetch customers
  const { data: customersRaw } = await svc
    .from("customers")
    .select("*")
    .eq("venue_id", v.id)
    .is("deleted_at", null)
    .order("last_visit_at", { ascending: false });

  const customers = (customersRaw ?? []) as CustomerPro[];

  // Aggregate stats
  const total = customers.length;
  const active30 = customers.filter((c) => c.last_visit_at && new Date(c.last_visit_at) > new Date(Date.now() - 30 * 86400_000)).length;
  const totalSpend = customers.reduce((s, c) => s + (c.total_spend ?? 0), 0);

  return (
    <Shell title="Müşteriler" venueName={v.name} slug={v.slug}>
      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, gap: 8 }}>
        <a
          href={`/api/dashboard/customers/export?slug=${v.slug}`}
          download
          style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(244,239,230,0.85)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
        >
          📥 CSV İndir
        </a>
        <Link href={`/dashboard/campaigns/${v.slug}`} style={{ padding: "8px 14px", borderRadius: 10, background: "#a78bfa", color: "#111", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          📨 Kampanya Gönder
        </Link>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Toplam Üye", value: total, color: "#ffd84e" },
          { label: "Son 30 gün aktif", value: active30, color: "#4ade80" },
          { label: "Toplam Harcama", value: `₺${totalSpend.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`, color: "#a78bfa" },
        ].map(({ label, value, color }) => (
          <div key={label} style={kpiCard}>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: "rgba(244,239,230,0.45)", marginTop: 4, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "rgba(244,239,230,0.4)", fontSize: 14 }}>
          Henüz kayıtlı müşteri yok. Müşteriler /play/{v.slug} üzerinden giriş yaptıkça burada görünür.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Ad Soyad", "E-posta", "Seviye", "Ziyaret", "Harcama", "Son Ziyaret", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(244,239,230,0.4)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={td}>{c.full_name ?? "—"}</td>
                  <td style={{ ...td, color: "rgba(244,239,230,0.55)" }}>{c.email ?? "—"}</td>
                  <td style={td}>{LOYALTY_BADGE[c.loyalty_tier] ?? "—"}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{c.total_visits}</td>
                  <td style={{ ...td, color: "#ffd84e", fontWeight: 700 }}>
                    {c.total_spend > 0 ? `₺${c.total_spend.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td style={{ ...td, color: "rgba(244,239,230,0.45)", whiteSpace: "nowrap" }}>
                    {c.last_visit_at
                      ? new Date(c.last_visit_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
                      : "—"}
                  </td>
                  <td style={td}>
                    <Link href={`/dashboard/customers/${v.slug}/${c.id}`} style={smallLink}>Detay →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

/* ─── Layout shell ─── */
function Shell({ title, venueName, slug, children }: { title: string; venueName: string; slug: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Receipt Reward</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <Link href="/dashboard" style={{ color: "rgba(244,239,230,0.5)", fontSize: 13, textDecoration: "none" }}>{venueName}</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.8)", fontSize: 13 }}>{title}</span>
        <div style={{ flex: 1 }} />
        <Link href={`/dashboard/analytics/${slug}`} style={navLink}>Analitik</Link>
        <Link href="/dashboard" style={navLink}>← Dashboard</Link>
      </header>
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800 }}>{title} — {venueName}</h1>
        {children}
      </main>
    </div>
  );
}

/* ─── Styles ─── */
const kpiCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14, padding: "18px 16px", textAlign: "center",
};
const td: React.CSSProperties = { padding: "12px 12px", color: "#f4efe6", verticalAlign: "middle" };
const primaryLink: React.CSSProperties = { display: "inline-block", marginTop: 16, padding: "10px 18px", borderRadius: 10, background: "#ffd84e", color: "#111", fontSize: 13, fontWeight: 700, textDecoration: "none" };
const smallLink: React.CSSProperties = { padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(244,239,230,0.8)", fontSize: 11, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" };
const navLink: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" };
