import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import { getServerCopy } from "../../../../lib/i18n/server";

type Params = { params: { slug: string } };

type CouponRow = {
  id: string;
  code: string;
  reward_label: string;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export default async function CouponsPage({ params }: Params) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const copyText = getServerCopy();
  const common = copyText.common;
  const couponsCopy = copyText.dashboardPages.coupons;

  const svc = getServiceClient();
  const { data: venuesRaw } = await svc
    .from("venues")
    .select("id, name, slug, tier")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  const venues = (venuesRaw ?? []) as { id: string; name: string; slug: string; tier: string }[];
  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, tier")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/dashboard");
  const v = venue as { id: string; name: string; slug: string; tier: string };

  const { data: couponsRaw } = await svc
    .from("coupons")
    .select("id, code, reward_label, redeemed_at, expires_at, created_at")
    .eq("venue_id", v.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const coupons = (couponsRaw ?? []) as CouponRow[];
  const redeemed = coupons.filter((c) => c.redeemed_at).length;
  const active = coupons.filter((c) => !c.redeemed_at && (!c.expires_at || new Date(c.expires_at) > new Date())).length;
  const expired = coupons.filter((c) => !c.redeemed_at && c.expires_at && new Date(c.expires_at) <= new Date()).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>{copyText.meta.brand}</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>{common.coupons}</span>
        <div style={{ flex: 1 }} />
        {v.tier === "pro" && (
          <>
            <Link href={`/dashboard/analytics/${v.slug}`} style={navLink}>{common.analytics}</Link>
            <Link href={`/dashboard/customers/${v.slug}`} style={navLink}>{common.customers}</Link>
          </>
        )}
        <Link href="/dashboard" style={navLink}>{common.dashboard}</Link>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ color: "#ffd84e", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11, fontWeight: 800, marginBottom: 8 }}>{couponsCopy.management}</div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 850 }}>{v.name} {couponsCopy.venueCoupons}</h1>
          </div>
          <Link href={`/scan?venue=${v.slug}`} style={primaryLink}>{couponsCopy.staffScreen}</Link>
        </div>

        {venues.length > 1 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {venues.map((venueOption) => {
              const activeVenue = venueOption.slug === v.slug;
              return (
                <Link key={venueOption.id} href={`/dashboard/coupons/${venueOption.slug}`} style={{
                  padding: "9px 13px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 800,
                  color: activeVenue ? "#1a0f06" : "rgba(244,239,230,0.72)",
                  background: activeVenue ? "linear-gradient(160deg, #f0d690 0%, #c89a4a 100%)" : "rgba(255,255,255,0.04)",
                  border: activeVenue ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}>
                  {venueOption.name}
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <Kpi label={couponsCopy.total} value={coupons.length} color="#ffd84e" />
          <Kpi label={couponsCopy.active} value={active} color="#4ade80" />
          <Kpi label={couponsCopy.redeemed} value={redeemed} color="#a78bfa" />
          <Kpi label={couponsCopy.expired} value={expired} color="#fb7185" />
        </div>

        {coupons.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "rgba(244,239,230,0.45)", fontSize: 14 }}>
            {couponsCopy.empty}
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {[couponsCopy.table.code, couponsCopy.table.reward, couponsCopy.table.status, couponsCopy.table.created, couponsCopy.table.expires].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const isExpired = !c.redeemed_at && c.expires_at && new Date(c.expires_at) <= new Date();
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ ...td, fontFamily: "'DM Mono', ui-monospace, monospace", color: "#ffd84e", fontWeight: 800 }}>{c.code}</td>
                      <td style={td}>{c.reward_label}</td>
                      <td style={td}>
                        <Status label={c.redeemed_at ? couponsCopy.redeemed : isExpired ? couponsCopy.expiredLower : couponsCopy.active} tone={c.redeemed_at ? "purple" : isExpired ? "red" : "green"} />
                      </td>
                      <td style={{ ...td, color: "rgba(244,239,230,0.55)", whiteSpace: "nowrap" }}>{formatDate(c.created_at, copyText.meta.locale)}</td>
                      <td style={{ ...td, color: "rgba(244,239,230,0.55)", whiteSpace: "nowrap" }}>{c.expires_at ? formatDate(c.expires_at, copyText.meta.locale) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 26, fontWeight: 850, color }}>{value}</div>
      <div style={{ color: "rgba(244,239,230,0.45)", fontSize: 11, marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );
}

function Status({ label, tone }: { label: string; tone: "green" | "purple" | "red" }) {
  const color = tone === "green" ? "#4ade80" : tone === "purple" ? "#a78bfa" : "#fb7185";
  return (
    <span style={{ display: "inline-flex", padding: "4px 9px", borderRadius: 999, background: `${color}18`, border: `1px solid ${color}40`, color, fontSize: 11, fontWeight: 800 }}>
      {label}
    </span>
  );
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

const navLink: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" };
const primaryLink: React.CSSProperties = { padding: "10px 16px", borderRadius: 12, background: "linear-gradient(160deg, #f0d690 0%, #c89a4a 100%)", color: "#1a0f06", fontSize: 13, fontWeight: 800, textDecoration: "none" };
const th: React.CSSProperties = { padding: "12px 14px", textAlign: "left", fontSize: 11, color: "rgba(244,239,230,0.42)", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "13px 14px", color: "rgba(244,239,230,0.82)", verticalAlign: "middle" };
