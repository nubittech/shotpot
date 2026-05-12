import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../lib/supabase/server";
import { getServerCopy } from "../../../lib/i18n/server";

type VenueRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tier: string;
  active: boolean;
  created_at: string;
};

type CouponRow = {
  venue_id: string;
  redeemed_at: string | null;
  expires_at: string | null;
};

export default async function CouponsIndexPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/coupons");
  const copyText = getServerCopy();
  const common = copyText.common;
  const couponsCopy = copyText.dashboardPages.coupons;

  const svc = getServiceClient();
  const { data: venuesRaw } = await svc
    .from("venues")
    .select("id, name, slug, plan, tier, active, created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  const venues = (venuesRaw ?? []) as VenueRow[];
  const venueIds = venues.map((venue) => venue.id);
  const { data: couponsRaw } = venueIds.length > 0
    ? await svc
      .from("coupons")
      .select("venue_id, redeemed_at, expires_at")
      .in("venue_id", venueIds)
    : { data: [] };

  const coupons = (couponsRaw ?? []) as CouponRow[];
  const statsByVenue = new Map<string, { total: number; active: number; redeemed: number; expired: number }>();
  const now = new Date();

  for (const coupon of coupons) {
    const stats = statsByVenue.get(coupon.venue_id) ?? { total: 0, active: 0, redeemed: 0, expired: 0 };
    const isExpired = !coupon.redeemed_at && coupon.expires_at && new Date(coupon.expires_at) <= now;
    stats.total += 1;
    if (coupon.redeemed_at) stats.redeemed += 1;
    else if (isExpired) stats.expired += 1;
    else stats.active += 1;
    statsByVenue.set(coupon.venue_id, stats);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>{copyText.meta.brand}</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>{common.coupons}</span>
        <div style={{ flex: 1 }} />
        <Link href="/dashboard" style={navLink}>{common.dashboard}</Link>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#ffd84e", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11, fontWeight: 800, marginBottom: 8 }}>{couponsCopy.management}</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 850 }}>{couponsCopy.chooseVenue}</h1>
          <p style={{ margin: "8px 0 0", color: "rgba(244,239,230,0.55)", fontSize: 14 }}>{couponsCopy.chooseHelp}</p>
        </div>

        {venues.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "rgba(244,239,230,0.45)", fontSize: 14 }}>
            {couponsCopy.emptyVenues}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {venues.map((venue) => {
              const stats = statsByVenue.get(venue.id) ?? { total: 0, active: 0, redeemed: 0, expired: 0 };
              return (
                <Link key={venue.id} href={`/dashboard/coupons/${venue.slug}`} style={{
                  display: "block",
                  padding: 20,
                  borderRadius: 18,
                  border: "1px solid rgba(232,200,118,0.16)",
                  background: "linear-gradient(180deg, #110a08 0%, #08050a 100%)",
                  textDecoration: "none",
                  color: "#f4efe6",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      border: "1px solid rgba(232,200,118,0.24)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#e8c876",
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 900,
                      fontSize: 26,
                    }}>{venue.name.slice(0, 1).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 850, fontSize: 18, color: "#fff8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{venue.name}</div>
                      <div style={{ color: "rgba(244,239,230,0.48)", fontSize: 13, marginTop: 4 }}>/play/{venue.slug}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    <MiniStat label={couponsCopy.total} value={stats.total} />
                    <MiniStat label={couponsCopy.active} value={stats.active} tone="green" />
                    <MiniStat label={couponsCopy.redeemed} value={stats.redeemed} tone="purple" />
                    <MiniStat label={couponsCopy.expired} value={stats.expired} tone="red" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "green" | "purple" | "red" }) {
  const color = tone === "green" ? "#4ade80" : tone === "purple" ? "#a78bfa" : tone === "red" ? "#fb7185" : "#ffd84e";
  return (
    <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", padding: "10px 8px" }}>
      <div style={{ color, fontWeight: 850, fontSize: 18 }}>{value}</div>
      <div style={{ color: "rgba(244,239,230,0.42)", fontSize: 10, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

const navLink: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" };
