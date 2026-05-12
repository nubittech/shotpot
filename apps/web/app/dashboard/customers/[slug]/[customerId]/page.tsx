import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../../lib/supabase/server";
import type { CustomerPro, Coupon, Receipt } from "../../../../../lib/supabase/types";
import { getServerCopy } from "../../../../../lib/i18n/server";

type Params = { params: { slug: string; customerId: string } };

export default async function CustomerDetailPage({ params }: Params) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const copyText = getServerCopy();
  const common = copyText.common;
  const customersCopy = copyText.dashboardPages.customers;
  const loyaltyBadge: Record<string, { label: string; color: string }> = {
    bronze: { label: `🥉 ${customersCopy.loyalty.bronze}`, color: "#cd7f32" },
    silver: { label: `🥈 ${customersCopy.loyalty.silver}`, color: "#a8a9ad" },
    gold: { label: `🥇 ${customersCopy.loyalty.gold}`, color: "#ffd700" },
  };

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

  // Fetch customer
  const { data: customerRaw } = await svc
    .from("customers")
    .select("*")
    .eq("id", params.customerId)
    .eq("venue_id", v.id)
    .maybeSingle();

  if (!customerRaw) redirect(`/dashboard/customers/${v.slug}`);

  const customer = customerRaw as CustomerPro;

  // Parallel fetch: coupons + receipts
  const [{ data: couponsRaw }, { data: receiptsRaw }] = await Promise.all([
    svc.from("coupons").select("*").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(20),
    svc.from("receipts").select("id, amount, tokens_awarded, issued_at, ocr_status, created_at").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const coupons = (couponsRaw ?? []) as Coupon[];
  const receipts = (receiptsRaw ?? []) as Receipt[];

  const loyalty = loyaltyBadge[customer.loyalty_tier] ?? loyaltyBadge.bronze;
  const activeCoupons = coupons.filter((c) => !c.redeemed_at && (!c.expires_at || new Date(c.expires_at) > new Date())).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>{copyText.meta.brand}</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <Link href={`/dashboard/customers/${v.slug}`} style={{ color: "rgba(244,239,230,0.5)", fontSize: 13, textDecoration: "none" }}>{common.customers}</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.8)", fontSize: 13 }}>{customer.full_name ?? customer.email ?? customersCopy.customerFallback}</span>
        <div style={{ flex: 1 }} />
        <Link href={`/dashboard/customers/${v.slug}`} style={navLink}>{customersCopy.listBack}</Link>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "grid", gap: 24 }}>

        {/* Profile card */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #ffd84e, #ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#111", flexShrink: 0 }}>
              {(customer.full_name ?? customer.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{customer.full_name ?? customersCopy.anonymous}</h1>
                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: loyalty.color, background: `${loyalty.color}18`, border: `1px solid ${loyalty.color}40` }}>
                  {loyalty.label}
                </span>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "rgba(244,239,230,0.5)" }}>{customer.email ?? "—"}</div>
              {customer.phone && <div style={{ fontSize: 13, color: "rgba(244,239,230,0.5)" }}>{customer.phone}</div>}
              <div style={{ marginTop: 8, fontSize: 11, color: "rgba(244,239,230,0.3)" }}>
                {customersCopy.joined}: {new Date(customer.created_at).toLocaleDateString(copyText.meta.locale, { day: "numeric", month: "long", year: "numeric" })}
                {customer.consent_marketing && <span style={{ marginLeft: 12, color: "#4ade80" }}>{customersCopy.marketingConsent}</span>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 20 }}>
            {[
              { label: customersCopy.totalVisits, value: customer.total_visits, color: "#ffd84e" },
              { label: customersCopy.totalSpend, value: customer.total_spend > 0 ? `₺${customer.total_spend.toLocaleString(copyText.meta.locale, { maximumFractionDigits: 0 })}` : "—", color: "#a78bfa" },
              { label: customersCopy.activeCoupon, value: activeCoupons, color: "#4ade80" },
              { label: customersCopy.totalReceipts, value: receipts.length, color: "#60a5fa" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 10, color: "rgba(244,239,230,0.4)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              </div>
            ))}
          </div>

          {customer.last_visit_at && (
            <div style={{ marginTop: 14, fontSize: 12, color: "rgba(244,239,230,0.4)" }}>
              {customersCopy.lastVisit}: {new Date(customer.last_visit_at).toLocaleString(copyText.meta.locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

        {/* Two-column: coupons + receipts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Coupons */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800 }}>{customersCopy.coupons} ({coupons.length})</h2>
            {coupons.length === 0 ? (
              <p style={{ color: "rgba(244,239,230,0.35)", fontSize: 13 }}>{customersCopy.noCoupons}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {coupons.map((c) => {
                  const redeemed = !!c.redeemed_at;
                  const expired = !redeemed && !!c.expires_at && new Date(c.expires_at) < new Date();
                  return (
                    <div key={c.id} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${redeemed ? "rgba(255,255,255,0.06)" : expired ? "rgba(255,100,80,0.15)" : "rgba(74,222,128,0.15)"}`, opacity: redeemed || expired ? 0.65 : 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{c.reward_label}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(244,239,230,0.45)", marginTop: 2, letterSpacing: "0.1em" }}>{c.code}</div>
                      <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: redeemed ? "rgba(244,239,230,0.35)" : expired ? "#ff8060" : "#4ade80", textTransform: "uppercase" }}>
                        {redeemed ? `${customersCopy.used} · ${new Date(c.redeemed_at!).toLocaleDateString(copyText.meta.locale)}` : expired ? customersCopy.expiredShort : common.active}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Receipts */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800 }}>{customersCopy.receipts} ({receipts.length})</h2>
            {receipts.length === 0 ? (
              <p style={{ color: "rgba(244,239,230,0.35)", fontSize: 13 }}>{customersCopy.noReceipts}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {receipts.map((r) => (
                  <div key={r.id} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#ffd84e" }}>₺{r.amount?.toLocaleString(copyText.meta.locale) ?? "—"}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>+{r.tokens_awarded} {customersCopy.token}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(244,239,230,0.35)", marginTop: 4 }}>
                      {new Date(r.created_at).toLocaleString(copyText.meta.locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 18, padding: "22px 20px",
};
const navLink: React.CSSProperties = {
  padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)",
  fontSize: 12, fontWeight: 600, textDecoration: "none",
};
