import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import { getServerCopy } from "../../../../lib/i18n/server";

type Params = { params: { slug: string } };

export default async function AnalyticsPage({ params }: Params) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const copyText = getServerCopy();
  const common = copyText.common;
  const dashboard = copyText.dashboard;
  const analytics = copyText.dashboardPages.analytics;

  const svc = getServiceClient();

  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, tier, currency, token_threshold")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/dashboard");
  const v = venue as { id: string; name: string; slug: string; tier: string; currency: string; token_threshold: number };

  // Time boundaries
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
  const d7  = new Date(now.getTime() -  7 * 86400_000).toISOString();

  // Parallel queries
  const [
    { count: totalReceipts },
    { count: receipts30d },
    { data: receiptsRaw },
    { count: totalSpins },
    { count: wins },
    { count: totalCoupons },
    { count: redeemedCoupons },
    { count: totalCustomers },
    { count: customers30d },
    { data: topCustomers },
    { data: recentCoupons },
  ] = await Promise.all([
    svc.from("receipts").select("*", { count: "exact", head: true }).eq("venue_id", v.id),
    svc.from("receipts").select("*", { count: "exact", head: true }).eq("venue_id", v.id).gte("created_at", d30),
    svc.from("receipts").select("amount, tokens_awarded, created_at").eq("venue_id", v.id).gte("created_at", d30).order("created_at"),
    svc.from("spins").select("*", { count: "exact", head: true }).eq("venue_id", v.id),
    svc.from("spins").select("*", { count: "exact", head: true }).eq("venue_id", v.id).eq("win", true),
    svc.from("coupons").select("*", { count: "exact", head: true }).eq("venue_id", v.id),
    svc.from("coupons").select("*", { count: "exact", head: true }).eq("venue_id", v.id).not("redeemed_at", "is", null),
    v.tier === "pro" ? svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null) : Promise.resolve({ count: 0, data: null, error: null }),
    v.tier === "pro" ? svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).gte("last_visit_at", d30) : Promise.resolve({ count: 0, data: null, error: null }),
    v.tier === "pro"
      ? svc.from("customers").select("full_name, email, total_visits, total_spend, loyalty_tier, last_visit_at").eq("venue_id", v.id).is("deleted_at", null).order("total_spend", { ascending: false }).limit(5)
      : Promise.resolve({ data: [], error: null }),
    svc.from("coupons").select("code, reward_label, redeemed_at, created_at").eq("venue_id", v.id).not("redeemed_at", "is", null).order("redeemed_at", { ascending: false }).limit(5),
  ]);

  // Compute totals from receipt rows
  const receiptsArr = (receiptsRaw ?? []) as { amount: number; tokens_awarded: number; created_at: string }[];
  const totalAmount30d = receiptsArr.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalTokens30d = receiptsArr.reduce((s, r) => s + (r.tokens_awarded ?? 0), 0);

  // Win rate
  const winRate = totalSpins ? ((wins ?? 0) / totalSpins * 100).toFixed(1) : "—";
  // Redemption rate
  const redemptionRate = totalCoupons ? (((redeemedCoupons ?? 0) / totalCoupons) * 100).toFixed(1) : "—";

  // Daily receipts for last 7 days
  const daily7 = buildDailyBuckets(receiptsArr, 7);

  const currSymbol = v.currency === "USD" ? "$" : v.currency === "EUR" ? "€" : "₺";

  /* ── Per-reward (campaign) performance ──
   * IMPORTANT: fetch ALL campaigns, not just active ones. Campaigns are
   * soft-deactivated (active=false) when removed from the studio selection,
   * specifically so historical spins/coupons keep their attribution. If we
   * filtered to active=true here, every win tied to a now-deactivated reward
   * would fall into no bucket and the whole section would render empty —
   * which is exactly the "winning spins > 0 but no rewards won" bug. */
  const [
    { data: campaignRows },
    { data: spinRows },
    { data: couponRows },
  ] = await Promise.all([
    svc.from("campaigns").select("id, reward_label, active").eq("venue_id", v.id),
    svc.from("spins").select("id, campaign_id, is_jackpot").eq("venue_id", v.id),
    svc.from("coupons").select("spin_id, created_at, redeemed_at").eq("venue_id", v.id),
  ]);

  type RewardStat = {
    id: string; label: string; archived: boolean;
    won: number; issued: number; redeemed: number;
    instant: number; sameDay: number; later: number; unused: number;
  };
  const camps = (campaignRows ?? []) as { id: string; reward_label: string; active: boolean }[];
  const spinsAll = (spinRows ?? []) as { id: string; campaign_id: string | null; is_jackpot: boolean }[];
  const couponsAll = (couponRows ?? []) as { spin_id: string | null; created_at: string; redeemed_at: string | null }[];

  const spinCampaign = new Map<string, string | null>();
  const jackpotSpinIds = new Set<string>();
  for (const s of spinsAll) {
    spinCampaign.set(s.id, s.campaign_id);
    if (s.is_jackpot) jackpotSpinIds.add(s.id);
  }

  const blankStat = (id: string, label: string, archived = false): RewardStat =>
    ({ id, label, archived, won: 0, issued: 0, redeemed: 0, instant: 0, sameDay: 0, later: 0, unused: 0 });
  const rewardStats: Record<string, RewardStat> = {};
  for (const c of camps) rewardStats[c.id] = blankStat(c.id, c.reward_label, !c.active);
  rewardStats.__jackpot = blankStat("__jackpot", "Jackpot");
  // Gift-wheel coupons are written with spin_id = null (see gift-spin route),
  // so they have no spin to attribute to. Bucket them separately so the 8
  // headline coupons fully reconcile with this section.
  rewardStats.__gift = blankStat("__gift", "🎁 Hediye Çark");

  for (const s of spinsAll) {
    if (s.is_jackpot) rewardStats.__jackpot.won++;
    else if (s.campaign_id && rewardStats[s.campaign_id]) rewardStats[s.campaign_id].won++;
  }

  for (const cp of couponsAll) {
    let key: string | null = null;
    if (cp.spin_id && jackpotSpinIds.has(cp.spin_id)) key = "__jackpot";
    else if (cp.spin_id) {
      const camp = spinCampaign.get(cp.spin_id);
      if (camp && rewardStats[camp]) key = camp;
    } else {
      // No spin_id → gift-wheel coupon.
      key = "__gift";
    }
    if (!key) continue;
    const st = rewardStats[key];
    st.issued++;
    if (cp.redeemed_at) {
      st.redeemed++;
      const hrs = (new Date(cp.redeemed_at).getTime() - new Date(cp.created_at).getTime()) / 3600000;
      const sameCal = new Date(cp.created_at).toDateString() === new Date(cp.redeemed_at).toDateString();
      if (hrs < 2) st.instant++;
      else if (sameCal) st.sameDay++;
      else st.later++;
    } else {
      st.unused++;
    }
  }

  // Gift coupons are always a win, but gift spins don't live in the `spins`
  // table, so `won` never incremented for them — mirror issued.
  rewardStats.__gift.won = rewardStats.__gift.issued;

  const rewardList = Object.values(rewardStats)
    .filter((r) => r.won > 0 || r.issued > 0)
    .sort((a, b) => b.issued - a.issued);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>{copyText.meta.brand}</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>{analytics.title}</span>
        <div style={{ flex: 1 }} />
        {v.tier === "pro" && (
          <Link href={`/dashboard/customers/${v.slug}`} style={navLink}>{common.customers}</Link>
        )}
        <Link href="/dashboard" style={navLink}>{copyText.dashboardPages.backDashboard}</Link>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{v.name} — {analytics.title}</h1>
          <div style={{ fontSize: 12, color: "rgba(244,239,230,0.4)", padding: "6px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
            {analytics.updated}: {now.toLocaleString(copyText.meta.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* ── SECTION: Fiş & Gelir ── */}
        <SectionTitle>{analytics.receiptsRevenue}</SectionTitle>
        <div style={kpiGrid}>
          <KPI label={analytics.totalReceipts} value={totalReceipts ?? 0} color="#ffd84e" />
          <KPI label={analytics.last30Days} value={receipts30d ?? 0} color="#ffd84e" />
          <KPI label={analytics.revenue30d} value={`${currSymbol}${totalAmount30d.toLocaleString(copyText.meta.locale, { maximumFractionDigits: 0 })}`} color="#a78bfa" />
          <KPI label={analytics.token30d} value={totalTokens30d} color="#60a5fa" />
        </div>

        {/* ── Bar chart: daily 7 days ── */}
        <div style={{ ...sectionCard, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "rgba(244,239,230,0.7)" }}>{analytics.dailyReceipts7d}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {daily7.map(({ label, count }) => {
              const max = Math.max(...daily7.map((d) => d.count), 1);
              const h = Math.round((count / max) * 70);
              return (
                <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, color: "#ffd84e", fontWeight: 700 }}>{count > 0 ? count : ""}</div>
                  <div style={{ width: "100%", height: `${Math.max(h, 4)}px`, background: count > 0 ? "rgba(255,216,78,0.6)" : "rgba(255,255,255,0.06)", borderRadius: 3 }} />
                  <div style={{ fontSize: 9, color: "rgba(244,239,230,0.4)", whiteSpace: "nowrap" }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION: Spin & Kupon ── */}
        <SectionTitle>{analytics.spinsCoupons}</SectionTitle>
        <div style={kpiGrid}>
          <KPI label={analytics.totalSpins} value={totalSpins ?? 0} color="#fb923c" />
          <KPI label={analytics.winningSpins} value={wins ?? 0} color="#4ade80" />
          <KPI label={analytics.winRate} value={`%${winRate}`} color="#4ade80" />
          <KPI label={analytics.redemptionRate} value={`%${redemptionRate}`} color="#f472b6" />
        </div>
        <div style={kpiGrid}>
          <KPI label={analytics.totalCoupons} value={totalCoupons ?? 0} color="#e2e8f0" sub={analytics.created} />
          <KPI label={analytics.redeemed} value={redeemedCoupons ?? 0} color="#4ade80" sub={analytics.redemption} />
          <KPI label={analytics.pending} value={(totalCoupons ?? 0) - (redeemedCoupons ?? 0)} color="#fbbf24" sub={analytics.activeCoupon} />
        </div>

        {/* ── SECTION: Ödül Performansı ── */}
        <SectionTitle>{analytics.rewardPerf.title}</SectionTitle>
        <p style={{ margin: "-6px 0 14px", fontSize: 12.5, color: "rgba(244,239,230,0.45)", lineHeight: 1.5 }}>
          {analytics.rewardPerf.help}
        </p>
        {rewardList.length === 0 ? (
          <div style={{ ...sectionCard, textAlign: "center", color: "rgba(244,239,230,0.4)", fontSize: 13 }}>
            {analytics.rewardPerf.empty}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            {rewardList.map((r) => {
              const rate = r.issued ? Math.round((r.redeemed / r.issued) * 100) : 0;
              const pct = (n: number) => (r.issued ? `${(n / r.issued) * 100}%` : "0%");
              const segs = [
                { n: r.instant, c: "#fb923c", label: analytics.rewardPerf.instant },
                { n: r.sameDay, c: "#fbbf24", label: analytics.rewardPerf.sameDay },
                { n: r.later,   c: "#4ade80", label: analytics.rewardPerf.laterDays },
                { n: r.unused,  c: "rgba(255,255,255,0.12)", label: analytics.rewardPerf.unused },
              ];
              return (
                <div key={r.id} style={sectionCard}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#f4efe6" }}>
                      {r.id === "__jackpot" ? "🎰 " : ""}{r.label || "—"}
                      {r.archived && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(244,239,230,0.4)", marginLeft: 8, padding: "2px 7px", borderRadius: 6, background: "rgba(255,255,255,0.06)" }}>
                          arşiv
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: rate >= 60 ? "#4ade80" : rate >= 30 ? "#fbbf24" : "#f87171" }}>
                      %{rate} <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(244,239,230,0.4)" }}>{analytics.rewardPerf.rate}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "rgba(244,239,230,0.55)", marginBottom: 10 }}>
                    <span>{analytics.rewardPerf.won}: <b style={{ color: "#f4efe6" }}>{r.won}</b></span>
                    <span>{analytics.rewardPerf.issued}: <b style={{ color: "#f4efe6" }}>{r.issued}</b></span>
                    <span>{analytics.rewardPerf.redeemed}: <b style={{ color: "#4ade80" }}>{r.redeemed}</b></span>
                  </div>
                  {/* Stacked time-to-redeem bar */}
                  <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
                    {segs.map((s, i) => s.n > 0 && (
                      <div key={i} style={{ width: pct(s.n), background: s.c }} title={`${s.label}: ${s.n}`} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
                    {segs.map((s, i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "rgba(244,239,230,0.5)" }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: s.c, display: "inline-block" }} />
                        {s.label} <b style={{ color: "rgba(244,239,230,0.75)" }}>{s.n}</b>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SECTION: Pro Müşteri (only Pro) ── */}
        {v.tier === "pro" && (
          <>
            <SectionTitle>{analytics.customer}</SectionTitle>
            <div style={kpiGrid}>
              <KPI label={analytics.totalMembers} value={totalCustomers ?? 0} color="#a78bfa" />
              <KPI label={analytics.active30d} value={customers30d ?? 0} color="#34d399" />
              <KPI label={analytics.sleepingRate} value={totalCustomers ? `%${(((totalCustomers - (customers30d ?? 0)) / totalCustomers) * 100).toFixed(0)}` : "—"} color="#f87171" sub={analytics.noVisit30d} />
            </div>

            {/* Top customers */}
            {(topCustomers ?? []).length > 0 && (
              <div style={{ ...sectionCard, marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "rgba(244,239,230,0.7)" }}>{analytics.topCustomers}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {[analytics.table.name, analytics.table.level, analytics.table.visits, analytics.table.spend, analytics.table.lastVisit].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(244,239,230,0.4)", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(topCustomers ?? []).map((c, i) => {
                      const tc = c as { full_name: string | null; email: string | null; total_visits: number; total_spend: number; loyalty_tier: string; last_visit_at: string | null };
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={td}>{tc.full_name ?? tc.email ?? "—"}</td>
                          <td style={td}>{LOYALTY_EMOJI[tc.loyalty_tier] ?? "🥉"}</td>
                          <td style={td}>{tc.total_visits}</td>
                          <td style={{ ...td, color: "#ffd84e", fontWeight: 700 }}>{currSymbol}{tc.total_spend.toLocaleString(copyText.meta.locale, { maximumFractionDigits: 0 })}</td>
                          <td style={{ ...td, color: "rgba(244,239,230,0.45)" }}>
                            {tc.last_visit_at ? new Date(tc.last_visit_at).toLocaleDateString(copyText.meta.locale, { day: "numeric", month: "short" }) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Recent redemptions ── */}
        {(recentCoupons ?? []).length > 0 && (
          <>
            <SectionTitle>{analytics.recentCoupons}</SectionTitle>
            <div style={{ ...sectionCard }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(recentCoupons ?? []).map((c, i) => {
                  const rc = c as { code: string; reward_label: string; redeemed_at: string; created_at: string };
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < (recentCoupons?.length ?? 0) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{rc.reward_label}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(244,239,230,0.4)", marginTop: 2 }}>{rc.code}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(244,239,230,0.4)" }}>
                        {new Date(rc.redeemed_at).toLocaleString(copyText.meta.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ─── Helpers ─── */
function buildDailyBuckets(receipts: { created_at: string }[], days: number) {
  const buckets: { label: string; date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const count = receipts.filter((r) => r.created_at.startsWith(date)).length;
    buckets.push({ label, date, count });
  }
  return buckets;
}

const LOYALTY_EMOJI: Record<string, string> = { bronze: "🥉", silver: "🥈", gold: "🥇" };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: "24px 0 14px", fontSize: 14, fontWeight: 800, color: "rgba(244,239,230,0.65)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{children}</h2>;
}

function KPI({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(244,239,230,0.45)", marginTop: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "rgba(244,239,230,0.25)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─── Styles ─── */
const kpiGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 };
const sectionCard: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 16px" };
const td: React.CSSProperties = { padding: "10px 10px", color: "#f4efe6", verticalAlign: "middle" };
const navLink: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" };
