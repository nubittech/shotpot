import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server-rsc";
import { getServiceClient } from "../../lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import { CopyLinkButton } from "./CopyLinkButton";
import { DeleteVenueButton } from "./DeleteVenueButton";
import { VenueMoreMenu } from "./VenueMoreMenu";
import { SideFeatureLink } from "./SideFeatureLink";
import { LanguageToggle } from "../../components/LanguageToggle";
import { SnapJackLogo } from "../../components/SnapJackLogo";
import { getServerCopy, getServerLocale } from "../../lib/i18n/server";

/* ── Design tokens (from Jackpot styles.css) ── */
const T = {
  bg0: "#08050a", bg1: "#110a08", bg2: "#1a0f0a",
  line: "rgba(232,200,118,0.12)", lineStrong: "rgba(232,200,118,0.28)",
  brass300: "#e8c876", brass400: "#c89a4a", brass500: "#8b6a30",
  ink100: "#fff8e8", ink200: "#f0e0c0", ink300: "#c8b890",
  ink400: "#8b7d5e", ink500: "#5a4f3a",
  green: "#7be38a", ember: "#ff8a4a", emberR: "#c81e35",
};

type Venue = {
  id: string; slug: string; name: string;
  plan: string; tier: string; active: boolean; created_at: string; billing_cycle?: string | null;
  currency?: string | null;
};

export default async function DashboardPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const locale = getServerLocale();
  const copyText = getServerCopy();
  const common = copyText.common;
  const dashboard = copyText.dashboard;

  const svc = getServiceClient();
  const { data: venuesRaw } = await svc
    .from("venues").select("id, slug, name, plan, tier, active, created_at, billing_cycle, currency")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  const venues = (venuesRaw ?? []) as Venue[];
  const initials = (user.email ?? "?").slice(0, 1).toUpperCase();

  // ── Live feed — real recent activity across the owner's venues ──
  type FeedItem = { kind: "receipt" | "win" | "redeem"; venue: string; label: string; at: string };
  let feed: FeedItem[] = [];
  if (venues.length > 0) {
    const venueIds = venues.map((v) => v.id);
    const nameById = new Map(venues.map((v) => [v.id, v.name]));
    const [{ data: rcpts }, { data: wins }, { data: reds }] = await Promise.all([
      svc.from("receipts").select("venue_id, amount, created_at").in("venue_id", venueIds).eq("is_synthetic", false).order("created_at", { ascending: false }).limit(8),
      svc.from("spins").select("venue_id, outcome, is_jackpot, created_at").in("venue_id", venueIds).eq("win", true).order("created_at", { ascending: false }).limit(8),
      svc.from("coupons").select("venue_id, reward_label, redeemed_at").in("venue_id", venueIds).not("redeemed_at", "is", null).order("redeemed_at", { ascending: false }).limit(8),
    ]);
    const cur = venues[0]?.currency === "USD" ? "$" : venues[0]?.currency === "EUR" ? "€" : "₺";
    for (const r of (rcpts ?? []) as Array<{ venue_id: string; amount: number; created_at: string }>)
      feed.push({ kind: "receipt", venue: nameById.get(r.venue_id) ?? "", label: `${cur}${Number(r.amount).toFixed(0)} fiş`, at: r.created_at });
    for (const w of (wins ?? []) as Array<{ venue_id: string; outcome: string; is_jackpot: boolean; created_at: string }>)
      feed.push({ kind: "win", venue: nameById.get(w.venue_id) ?? "", label: `${w.is_jackpot ? "🎰 JACKPOT" : "🎁"} ${w.outcome}`, at: w.created_at });
    for (const c of (reds ?? []) as Array<{ venue_id: string; reward_label: string; redeemed_at: string }>)
      feed.push({ kind: "redeem", venue: nameById.get(c.venue_id) ?? "", label: `✓ ${c.reward_label} kullanıldı`, at: c.redeemed_at });
    feed = feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 10);
  }
  // Admin gate — only show the admin link if this user's email is allow-listed.
  const { data: adminRow } = user.email
    ? await svc.from("admins").select("email").eq("email", user.email.toLowerCase()).maybeSingle()
    : { data: null };
  const isAdmin = !!adminRow;
  const primaryVenue = venues[0];
  const primaryProVenue = venues.find((venue) => venue.tier === "pro");
  const analyticsHref = primaryProVenue ? `/dashboard/analytics/${primaryProVenue.slug}` : "/dashboard";
  const customersHref = primaryProVenue ? `/dashboard/customers/${primaryProVenue.slug}` : "/dashboard";
  const couponsHref = venues.length > 0 ? "/dashboard/coupons" : "/dashboard";
  // Venue-scoped feature nav: Staff works for any active venue; Gift/Menu are Pro-only.
  const activeVenueOpts = venues.filter((v) => v.active).map((v) => ({ slug: v.slug, name: v.name }));
  const proVenueOpts = venues.filter((v) => v.active && v.tier === "pro").map((v) => ({ slug: v.slug, name: v.name }));
  const staffIcon = (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3.5 16c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  );
  const giftIcon = (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 9h12M9 7v8" stroke="currentColor" strokeWidth="1.5"/><path d="M9 7C7 7 6 4 7.5 3.5S9 5 9 7zM9 7c2 0 3-3 1.5-3.5S9 5 9 7z" stroke="currentColor" strokeWidth="1.3"/></svg>
  );
  const menuIcon = (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="2.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  );
  const billingHref = primaryVenue ? `/dashboard/billing/${primaryVenue.slug}` : "/dashboard";
  const formatSince = (createdAt: string) => {
    const date = new Date(createdAt).toLocaleDateString(copyText.meta.locale, { month: "short", year: "numeric" });
    return copyText.meta.lang === "tr" ? `${date} ${dashboard.sinceDate}` : `${dashboard.sinceDate} ${date}`;
  };

  return (
    <div className="dashboard-shell" style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh", background: T.bg0, color: T.ink200, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 920px) {
          .dashboard-shell {
            display: block !important;
            overflow-x: hidden;
          }
          .dashboard-sidebar {
            position: relative !important;
            height: auto !important;
            min-height: 0 !important;
            padding: 14px 16px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(232,200,118,0.12) !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .dashboard-sidebar-nav {
            display: none !important;
          }
          .dashboard-sidebar-footer {
            display: none !important;
          }
          .dashboard-brand {
            padding: 0 !important;
          }
          .dashboard-mobile-menu {
            display: block !important;
            position: relative;
          }
          .dashboard-mobile-menu summary {
            list-style: none;
          }
          .dashboard-mobile-menu summary::-webkit-details-marker {
            display: none;
          }
          .dashboard-mobile-menu-button {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgba(232,200,118,0.28);
            background: #110a08;
            color: #e8c876;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .dashboard-mobile-menu-panel {
            position: absolute;
            right: 0;
            top: calc(100% + 12px);
            width: min(330px, calc(100vw - 32px));
            max-height: calc(100svh - 92px);
            overflow-y: auto;
            padding: 12px;
            border-radius: 18px;
            border: 1px solid rgba(232,200,118,0.18);
            background: linear-gradient(180deg, #110a08 0%, #08050a 100%);
            box-shadow: 0 24px 70px rgba(0,0,0,0.56);
            z-index: 90;
          }
          .dashboard-mobile-menu-panel .side-section {
            padding: 10px 6px 4px !important;
          }
          .dashboard-mobile-menu-panel .side-link {
            min-height: 44px;
            margin-bottom: 7px !important;
            padding: 10px 11px !important;
            border-left-width: 0 !important;
            border: 1px solid rgba(232,200,118,0.1);
          }
          .dashboard-mobile-menu-footer {
            margin-top: 10px;
            padding-top: 12px;
            border-top: 1px solid rgba(232,200,118,0.12);
          }
          .dashboard-topbar {
            position: relative !important;
            padding: 14px 18px !important;
          }
          .dashboard-content {
            padding: 24px 16px 48px !important;
          }
          .dashboard-page-head {
            display: grid !important;
            grid-template-columns: 1fr !important;
            align-items: start !important;
            margin-bottom: 22px !important;
          }
          .dashboard-page-head h1 {
            font-size: 38px !important;
          }
          .dashboard-new-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .dashboard-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
            margin-bottom: 22px !important;
          }
          .dashboard-kpi {
            padding: 16px !important;
          }
          .dashboard-kpi-value {
            font-size: 30px !important;
          }
          .dashboard-main-grid {
            display: block !important;
          }
          .dashboard-activity {
            display: none !important;
          }
          .venue-card {
            display: grid !important;
            grid-template-columns: 68px minmax(0, 1fr) !important;
            gap: 14px !important;
            padding: 18px !important;
            align-items: start !important;
          }
          .venue-cover {
            width: 68px !important;
            height: 68px !important;
          }
          .venue-meta {
            min-width: 0 !important;
          }
          .venue-meta h2 {
            font-size: 21px !important;
            overflow-wrap: anywhere;
          }
          .venue-meta-row,
          .venue-sub-meta {
            gap: 7px !important;
          }
          .venue-actions {
            grid-column: 1 / -1;
            justify-content: flex-start !important;
          }
          .venue-actions a,
          .venue-actions button {
            flex: 1 1 calc(50% - 8px);
            justify-content: center !important;
            min-width: 0;
          }
        }
        @media (max-width: 520px) {
          .dashboard-kpis {
            grid-template-columns: 1fr 1fr !important;
          }
          .venue-card {
            grid-template-columns: 56px minmax(0, 1fr) !important;
            padding: 16px !important;
          }
          .venue-cover {
            width: 56px !important;
            height: 56px !important;
          }
          .venue-actions a,
          .venue-actions button {
            flex-basis: 100%;
          }
        }
        @media (min-width: 921px) {
          .dashboard-mobile-menu {
            display: none !important;
          }
        }
      `}</style>

      {/* ═══════ SIDEBAR ═══════ */}
      <aside className="dashboard-sidebar" style={{
        background: `linear-gradient(180deg, ${T.bg1} 0%, ${T.bg0} 100%)`,
        borderRight: `1px solid ${T.line}`,
        padding: "24px 16px",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Brand */}
        <div className="dashboard-brand" style={{ display: "flex", alignItems: "center", padding: "4px 8px 24px" }}>
          <SnapJackLogo size={30} withWordmark />
        </div>

        <details className="dashboard-mobile-menu">
          <summary className="dashboard-mobile-menu-button" aria-label={dashboard.openMenu}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 7h14M4 11h14M4 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </summary>
          <div className="dashboard-mobile-menu-panel">
            <SideSection label={dashboard.workspace} />
            <SideLink href="/dashboard" active label={dashboard.venuesTitle} icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="10" y="2" width="6" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="2" y="11" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="10" y="8" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            }/>
            {primaryProVenue && (
              <>
                <SideLink href={analyticsHref} label={common.analytics} icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 14V8M9 14V4M15 14v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                }/>
                <SideLink href={customersHref} label={common.customers} icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 16c0-2.5 2-4.5 4-4.5s4 2 4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="13" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 16c0-2 1-3 2.5-3s2.5 1 2.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                }/>
              </>
            )}
            <SideLink href={couponsHref} label={common.coupons} icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2.5" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }/>
            <SideFeatureLink venues={activeVenueOpts} hrefTemplate="/scan?venue={slug}" label={dashboard.waiter} icon={staffIcon} pickTitle={dashboard.chooseVenue} />
            <SideFeatureLink venues={proVenueOpts} hrefTemplate="/dashboard/gifts/{slug}" label={common.gifts} icon={giftIcon} pickTitle={dashboard.chooseVenue} />
            <SideFeatureLink venues={proVenueOpts} hrefTemplate="/dashboard/menus/{slug}" label={common.menus} icon={menuIcon} pickTitle={dashboard.chooseVenue} />
            <SideSection label={dashboard.account} />
            <SideLink href={billingHref} label={dashboard.billing} icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 9l2 2 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }/>
            <SideLink href="mailto:hello@nubit.tech?subject=Shotpot%20Support" label={common.support} icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 6v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }/>
            {isAdmin && (
              <SideLink href="/admin" label="Admin Panel" icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2l6 3v4c0 4-3 7-6 8-3-1-6-4-6-8V5l6-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              }/>
            )}
            <div className="dashboard-mobile-menu-footer">
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px 10px" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(160deg, #c89a4a, #5a3414)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Playfair Display', serif", fontWeight: 900,
                  color: "#1a0f06", fontSize: 13, flexShrink: 0,
                }}>{initials}</div>
                <div>
                  <div style={{ color: T.ink100, fontWeight: 600, fontSize: 13, lineHeight: 1.1 }}>{user.email?.split("@")[0]}</div>
                  <div style={{ color: T.ink400, fontSize: 11 }}>{venues.length} {dashboard.venueCountSuffix}</div>
                </div>
              </div>
              <LogoutButton label={common.logout} />
            </div>
          </div>
        </details>

        {/* Workspace nav */}
        <div className="dashboard-sidebar-nav">
        <SideSection label={dashboard.workspace} />
        <SideLink href="/dashboard" active label={dashboard.venuesTitle} icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="10" y="2" width="6" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="2" y="11" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="10" y="8" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        }/>
        {primaryProVenue && (
          <>
            <SideLink href={analyticsHref} label={common.analytics} icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 14V8M9 14V4M15 14v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }/>
            <SideLink href={customersHref} label={common.customers} icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 16c0-2.5 2-4.5 4-4.5s4 2 4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="13" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 16c0-2 1-3 2.5-3s2.5 1 2.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }/>
          </>
        )}
        <SideLink href={couponsHref} label={common.coupons} icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2.5" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        }/>
        <SideFeatureLink venues={activeVenueOpts} hrefTemplate="/scan?venue={slug}" label={dashboard.waiter} icon={staffIcon} pickTitle={dashboard.chooseVenue} />
        <SideFeatureLink venues={proVenueOpts} hrefTemplate="/dashboard/gifts/{slug}" label={common.gifts} icon={giftIcon} pickTitle={dashboard.chooseVenue} />
        <SideFeatureLink venues={proVenueOpts} hrefTemplate="/dashboard/menus/{slug}" label={common.menus} icon={menuIcon} pickTitle={dashboard.chooseVenue} />

        {/* Account nav */}
        <SideSection label={dashboard.account} />
        <SideLink href={billingHref} label={dashboard.billing} icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 9l2 2 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }/>
        <SideLink href="mailto:hello@nubit.tech?subject=Shotpot%20Support" label={common.support} icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 6v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        }/>
        {isAdmin && (
          <SideLink href="/admin" label="Admin Panel" icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2l6 3v4c0 4-3 7-6 8-3-1-6-4-6-8V5l6-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          }/>
        )}
        </div>

        {/* Account footer */}
        <div className="dashboard-sidebar-footer" style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(160deg, #c89a4a, #5a3414)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Playfair Display', serif", fontWeight: 900,
              color: "#1a0f06", fontSize: 13, flexShrink: 0,
            }}>{initials}</div>
            <div>
              <div style={{ color: T.ink100, fontWeight: 600, fontSize: 13, lineHeight: 1.1 }}>{user.email?.split("@")[0]}</div>
              <div style={{ color: T.ink400, fontSize: 11 }}>{venues.length} {dashboard.venueCountSuffix}</div>
            </div>
          </div>
          <LogoutButton label={common.logout} />
        </div>
      </aside>

      {/* ═══════ MAIN ═══════ */}
      <main style={{ background: T.bg0, minWidth: 0 }}>

        {/* Topbar */}
        <header className="dashboard-topbar" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 32px",
          borderBottom: `1px solid ${T.line}`,
          background: "rgba(8,5,10,0.6)",
          backdropFilter: "blur(16px)",
          position: "sticky", top: 0, zIndex: 30,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.ink400 }}>
            <span style={{ color: T.ink300 }}>{dashboard.workspace}</span>
            <span style={{ color: T.ink500 }}>/</span>
            <span style={{ color: T.ink100 }}>{dashboard.venuesTitle}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LanguageToggle initialLocale={locale} />
            <IconBtn title={dashboard.search}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </IconBtn>
          </div>
        </header>

        <div className="dashboard-content" style={{ padding: "36px 32px 64px" }}>

          {/* Page header */}
          <div className="dashboard-page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: T.brass300, textTransform: "uppercase" }}>
                {dashboard.workspace} · {user.email?.split("@")[0]}
              </div>
              <h1 style={{ margin: "6px 0 0", fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: T.ink100, lineHeight: 1 }}>
                {dashboard.venuesTitle}
              </h1>
            </div>
            <Link className="dashboard-new-btn" href="/studio" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 22px", borderRadius: 999, border: "none",
              background: "linear-gradient(160deg, #f0d690 0%, #c89a4a 50%, #8b6a30 100%)",
              color: "#1a0f06", fontWeight: 700, fontSize: 14, textDecoration: "none",
              boxShadow: "inset 0 1px 0 rgba(255,244,212,0.6), inset 0 -1px 0 rgba(74,52,20,0.5), 0 8px 20px -8px rgba(232,200,118,0.5)",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {dashboard.newVenue}
            </Link>
          </div>

          {/* KPI strip — mocked totals across venues */}
          <div className="dashboard-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
            <KpiCard label={dashboard.totalVenues} value={String(venues.length)} delta="" />
            <KpiCard label={dashboard.activeVenues} value={String(venues.filter(v => v.active).length)} delta="" />
            <KpiCard label={dashboard.proPlan} value={String(venues.filter(v => v.tier === "pro").length)} delta="" />
            <KpiCard label={dashboard.campaign} value={String(venues.filter(v => v.tier !== "pro").length)} delta="" />
          </div>

          {/* Main layout: venue list + activity sidebar */}
          <div className="dashboard-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "flex-start" }}>

            {/* Venue list */}
            <div>
              {venues.length === 0 ? (
                <Link href="/studio" style={{
                  display: "block", border: `2px dashed ${T.lineStrong}`,
                  borderRadius: 18, padding: 28, textAlign: "center",
                  color: T.ink400, textDecoration: "none",
                  transition: "all 0.15s",
                }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 8 }}>
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
                    <path d="M16 11v10M11 16h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{dashboard.firstVenue}</div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{dashboard.fiveMinutes}</div>
                </Link>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {venues.map((v) => (
                    <div className="venue-card" key={v.id} style={{
                      background: `linear-gradient(180deg, ${T.bg1} 0%, ${T.bg0} 100%)`,
                      border: `1px solid ${T.line}`,
                      borderRadius: 18, padding: "22px 24px",
                      display: "flex", alignItems: "center", gap: 22,
                      flexWrap: "wrap",
                    }}>
                      {/* Cover glyph */}
                      <div className="venue-cover" style={{
                        width: 80, height: 80, flexShrink: 0, borderRadius: 14,
                        background: `linear-gradient(160deg, ${T.bg2}, ${T.bg0})`,
                        border: `1px solid ${T.lineStrong}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{
                          fontFamily: "'Playfair Display', serif", fontWeight: 900,
                          color: T.brass300, fontSize: 32,
                          textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                        }}>{v.name.slice(0, 1).toUpperCase()}</span>
                      </div>

                      {/* Meta */}
                      <div className="venue-meta" style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 20, color: T.ink100, letterSpacing: "-0.005em" }}>
                          {v.name}
                        </h2>
                        <div className="venue-meta-row" style={{ color: T.ink400, fontSize: 13, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", color: T.ink300 }}>/play/{v.slug}</span>
                          <span style={{ color: T.ink500 }}>·</span>
                          {/* Single, unambiguous plan label (plan + Pro upgrade chip) */}
                          <span>{v.plan === "kampanya" ? dashboard.campaign : dashboard.business}</span>
                          {v.tier === "pro" && (
                            <span style={{ padding: "1px 7px", borderRadius: 999, background: "rgba(232,200,118,0.14)", border: `1px solid ${T.lineStrong}`, color: T.brass300, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em" }}>PRO</span>
                          )}
                          <span style={{ color: T.ink500 }}>·</span>
                          <StatusPill active={v.active} activeLabel={common.active} pendingLabel={common.pendingPayment} />
                        </div>
                        <div className="venue-sub-meta" style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 13, color: T.ink300, flexWrap: "wrap", alignItems: "center" }}>
                          <span>{formatSince(v.created_at)}</span>
                          {!v.active && (
                            <Link href={`/dashboard/billing/${v.slug}`} style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "5px 12px", borderRadius: 999,
                              background: "linear-gradient(160deg, #f0d690, #c89a4a)", color: "#1a0f06",
                              fontSize: 12, fontWeight: 800, textDecoration: "none",
                            }}>⚡ {dashboard.completePayment}</Link>
                          )}
                        </div>
                      </div>

                      {/* Actions — primary inline, the rest behind a "•••" menu */}
                      <div className="venue-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {v.active && <CopyLinkButton slug={v.slug} label={dashboard.copyLink} copiedLabel={dashboard.copied} promptLabel={dashboard.copyPrompt} />}
                        {v.active && <ABtn href={`/play/${v.slug}`} target="_blank" label={common.preview} icon="eye" />}
                        {v.active && v.tier === "pro" && (
                          <>
                            <ABtn href={`/dashboard/analytics/${v.slug}`} label={common.analytics} icon="chart" />
                            <ABtn href={`/dashboard/customers/${v.slug}`} label={common.customers} icon="people" variant="purple" />
                          </>
                        )}
                        <ABtn href={`/studio?slug=${v.slug}`} label={common.edit} icon="edit" variant="gold" />
                        {/* Staff/Gift/Menu moved to the left sidebar; More keeps Staff (per-venue, direct), Plan, Delete */}
                        <VenueMoreMenu label={dashboard.more}>
                          {v.active && <ABtn href={`/scan?venue=${v.slug}`} label={dashboard.waiter} icon="user" />}
                          <ABtn href={`/dashboard/billing/${v.slug}`} label={common.plan} icon="card" variant="brass" />
                          <DeleteVenueButton
                            slug={v.slug}
                            name={v.name}
                            active={v.active}
                            plan={v.plan}
                            tier={v.tier}
                            billingCycle={v.billing_cycle ?? "monthly"}
                            label={common.delete}
                            cancelLabel={common.cancel}
                            closeLabel={common.cancel}
                            monthlyLabel={common.monthly}
                            annualLabel={common.annual}
                            campaignLabel={dashboard.campaign}
                            copyText={dashboard.deleteVenue}
                          />
                        </VenueMoreMenu>
                      </div>
                    </div>
                  ))}

                  {/* New venue card */}
                  <Link href="/studio" style={{
                    display: "block", border: `2px dashed ${T.lineStrong}`,
                    borderRadius: 18, padding: 24, textAlign: "center",
                    color: T.ink400, textDecoration: "none",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 6 }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
                      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{dashboard.newVenueShort}</div>
                    <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{dashboard.fiveMinutes}</div>
                  </Link>
                </div>
              )}
            </div>

            {/* Activity sidebar */}
            <aside className="dashboard-activity" style={{
              background: `linear-gradient(180deg, ${T.bg1} 0%, ${T.bg0} 100%)`,
              border: `1px solid ${T.line}`,
              borderRadius: 16, padding: 22,
              position: "sticky", top: 96,
            }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "0.18em", color: T.brass300, margin: "0 0 16px" }}>
                {dashboard.liveFeed}
              </h3>
              {venues.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: T.ink400, lineHeight: 1.6 }}>{dashboard.liveFeedEmpty}</p>
              ) : feed.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: T.ink400, lineHeight: 1.6 }}>{dashboard.liveFeedEmpty}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {feed.map((f, i) => {
                    const dot = f.kind === "win" ? "#7be38a" : f.kind === "redeem" ? "#e8c876" : T.ink400;
                    return (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, marginTop: 5, flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12.5, color: T.ink200, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.label}</div>
                          <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>
                            {f.venue} · {new Date(f.at).toLocaleString(copyText.meta.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function SideSection({ label }: { label: string }) {
  return (
    <div className="side-section" style={{
      color: "#5a4f3a", textTransform: "uppercase",
      letterSpacing: "0.18em", fontSize: 11,
      fontFamily: "'Bebas Neue', sans-serif",
      padding: "16px 12px 8px",
    }}>{label}</div>
  );
}

function SideLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <Link className="side-link" href={href} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: active ? "10px 10px 10px 10px" : "10px 12px",
      borderRadius: 10, textDecoration: "none",
      fontSize: 14, fontWeight: 500, marginBottom: 2,
      color: active ? "#e8c876" : "#c8b890",
      background: active
        ? "linear-gradient(90deg, rgba(232,200,118,0.14), rgba(232,200,118,0.04))"
        : "transparent",
      borderLeft: active ? "2px solid #e8c876" : "2px solid transparent",
    }}>
      {icon}
      {label}
    </Link>
  );
}

function IconBtn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div title={title} style={{
      width: 36, height: 36, borderRadius: 10,
      background: "#110a08", border: "1px solid rgba(232,200,118,0.12)",
      color: "#c8b890", display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
    }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="dashboard-kpi" style={{
      background: `linear-gradient(180deg, #110a08 0%, #08050a 100%)`,
      border: "1px solid rgba(232,200,118,0.12)",
      borderRadius: 16, padding: 22, position: "relative", overflow: "hidden",
    }}>
      <div style={{ color: "#8b7d5e", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Bebas Neue', sans-serif" }}>
        {label}
      </div>
      <div className="dashboard-kpi-value" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 36, color: "#fff8e8", lineHeight: 1, marginTop: 10 }}>
        {value}
      </div>
      {delta && <div style={{ marginTop: 8, fontSize: 12, color: "#7be38a" }}>{delta}</div>}
    </div>
  );
}

function StatusPill({ active, activeLabel, pendingLabel }: { active: boolean; activeLabel: string; pendingLabel: string }) {
  const color = active ? "#7be38a" : "#ffd84e";
  const label = active ? activeLabel : pendingLabel;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em",
      color,
      padding: "3px 8px", borderRadius: 999,
      background: active ? "rgba(123,227,138,0.08)" : "rgba(255,216,78,0.08)",
      border: `1px solid ${active ? "rgba(123,227,138,0.25)" : "rgba(255,216,78,0.22)"}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function ABtn({ href, label, icon: _icon, variant, target }: { href: string; label: string; icon: string; variant?: "gold"|"purple"|"brass"; target?: string }) {
  const variantStyles: React.CSSProperties =
    variant === "gold"
      ? { background: "linear-gradient(160deg, #f0d690 0%, #c89a4a 100%)", color: "#1a0f06", border: "none", fontWeight: 700, boxShadow: "inset 0 1px 0 rgba(255,244,212,0.6), 0 4px 12px -4px rgba(232,200,118,0.4)" }
      : variant === "purple"
      ? { color: "#c8a8ff", borderColor: "rgba(200,168,255,0.3)" }
      : variant === "brass"
      ? { color: "#e8c876", borderColor: "rgba(232,200,118,0.28)" }
      : {};

  return (
    <Link href={href} target={target} style={{
      padding: "9px 14px", borderRadius: 999,
      background: variant === "gold" ? undefined : "#110a08",
      border: `1px solid rgba(232,200,118,0.12)`,
      color: "#f0e0c0", fontSize: 13, fontWeight: 500,
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      textDecoration: "none", whiteSpace: "nowrap",
      ...variantStyles,
    }}>
      {label}
    </Link>
  );
}
