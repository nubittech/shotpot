import Link from "next/link";
import { getServiceClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

const DAYS = 30;
const CUR: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function loadStats() {
  const svc = getServiceClient();
  const now = new Date();
  const d7  = new Date(now.getTime() - 7  * 86400000).toISOString();
  const d14 = new Date(now.getTime() - 14 * 86400000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    vAll, vAct, cAll, rAll, sAll, cpAll, cpRed, appNew,
    venuesRaw, recRows, custRows, recentRcpts, recentWins, recentReds,
  ] = await Promise.all([
    svc.from("venues").select("id", { count: "exact", head: true }),
    svc.from("venues").select("id", { count: "exact", head: true }).eq("active", true),
    svc.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null),
    svc.from("receipts").select("id", { count: "exact", head: true }).eq("is_synthetic", false),
    svc.from("spins").select("id", { count: "exact", head: true }),
    svc.from("coupons").select("id", { count: "exact", head: true }),
    svc.from("coupons").select("id", { count: "exact", head: true }).not("redeemed_at", "is", null),
    svc.from("digital_menu_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
    svc.from("venues").select("id, slug, name, plan, tier, active, currency, digital_menu_enabled, stripe_subscription_id"),
    svc.from("receipts").select("venue_id, amount, created_at").eq("is_synthetic", false).gte("created_at", d30),
    svc.from("customers").select("created_at").is("deleted_at", null).gte("created_at", d30),
    svc.from("receipts").select("venue_id, amount, created_at").eq("is_synthetic", false).order("created_at", { ascending: false }).limit(8),
    svc.from("spins").select("venue_id, outcome, is_jackpot, created_at").eq("win", true).order("created_at", { ascending: false }).limit(8),
    svc.from("coupons").select("venue_id, reward_label, redeemed_at").not("redeemed_at", "is", null).order("redeemed_at", { ascending: false }).limit(8),
  ]);

  const venues = (venuesRaw.data ?? []) as Array<{
    id: string; slug: string; name: string; plan: string; tier: string;
    active: boolean | null; currency: string | null; digital_menu_enabled: boolean | null; stripe_subscription_id: string | null;
  }>;
  const nameById = new Map(venues.map((v) => [v.id, v.name]));
  const receipts = (recRows.data ?? []) as Array<{ venue_id: string; amount: number; created_at: string }>;
  const customers30 = (custRows.data ?? []) as Array<{ created_at: string }>;

  // ── Daily buckets (last 30 days) ──
  const keys: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) keys.push(dayKey(new Date(now.getTime() - i * 86400000)));
  const rcptByDay = new Map(keys.map((k) => [k, 0]));
  const revByDay = new Map(keys.map((k) => [k, 0]));
  const custByDay = new Map(keys.map((k) => [k, 0]));
  for (const r of receipts) {
    const k = dayKey(new Date(r.created_at));
    if (rcptByDay.has(k)) { rcptByDay.set(k, (rcptByDay.get(k) ?? 0) + 1); revByDay.set(k, (revByDay.get(k) ?? 0) + Number(r.amount || 0)); }
  }
  for (const c of customers30) {
    const k = dayKey(new Date(c.created_at));
    if (custByDay.has(k)) custByDay.set(k, (custByDay.get(k) ?? 0) + 1);
  }

  // ── 7d vs prev-7d deltas ──
  const inRange = (iso: string, from: string, to?: string) => iso >= from && (!to || iso < to);
  const rcpt7  = receipts.filter((r) => inRange(r.created_at, d7)).length;
  const rcptPrev7 = receipts.filter((r) => inRange(r.created_at, d14, d7)).length;
  const rev30 = receipts.reduce((s, r) => s + Number(r.amount || 0), 0);

  // ── Top venues by 30d receipts ──
  const perVenue = new Map<string, { receipts: number; revenue: number }>();
  for (const r of receipts) {
    const cur = perVenue.get(r.venue_id) ?? { receipts: 0, revenue: 0 };
    cur.receipts += 1; cur.revenue += Number(r.amount || 0);
    perVenue.set(r.venue_id, cur);
  }
  const topVenues = venues
    .map((v) => ({ slug: v.slug, name: v.name, ...(perVenue.get(v.id) ?? { receipts: 0, revenue: 0 }), currency: CUR[v.currency ?? "TRY"] ?? "₺" }))
    .sort((a, b) => b.receipts - a.receipts)
    .slice(0, 8);

  // ── Distribution ──
  const dist = {
    planKampanya: venues.filter((v) => v.plan === "kampanya").length,
    planIsletme:  venues.filter((v) => v.plan === "isletme").length,
    tierStandard: venues.filter((v) => v.tier === "standard").length,
    tierPro:      venues.filter((v) => v.tier === "pro").length,
    qrMenu:       venues.filter((v) => v.digital_menu_enabled).length,
    paddle:       venues.filter((v) => v.stripe_subscription_id).length,
    inactive:     venues.filter((v) => !v.active).length,
  };

  // ── Activity feed ──
  type Feed = { kind: "receipt" | "win" | "redeem"; venue: string; label: string; at: string };
  const feed: Feed[] = [];
  for (const r of (recentRcpts.data ?? []) as Array<{ venue_id: string; amount: number; created_at: string }>)
    feed.push({ kind: "receipt", venue: nameById.get(r.venue_id) ?? "—", label: `₺${Number(r.amount).toFixed(0)} fiş`, at: r.created_at });
  for (const w of (recentWins.data ?? []) as Array<{ venue_id: string; outcome: string; is_jackpot: boolean; created_at: string }>)
    feed.push({ kind: "win", venue: nameById.get(w.venue_id) ?? "—", label: `${w.is_jackpot ? "🎰 JACKPOT" : "🎁"} ${w.outcome}`, at: w.created_at });
  for (const c of (recentReds.data ?? []) as Array<{ venue_id: string; reward_label: string; redeemed_at: string }>)
    feed.push({ kind: "redeem", venue: nameById.get(c.venue_id) ?? "—", label: `✓ ${c.reward_label} kullanıldı`, at: c.redeemed_at });
  feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const total = cpAll.count ?? 0;
  const red = cpRed.count ?? 0;
  return {
    venuesTotal: vAll.count ?? 0,
    venuesActive: vAct.count ?? 0,
    customers: cAll.count ?? 0,
    customers30: customers30.length,
    receiptsTotal: rAll.count ?? 0,
    spins: sAll.count ?? 0,
    coupons: total,
    couponsRedeemed: red,
    redemptionRate: total > 0 ? Math.round((red / total) * 1000) / 10 : 0,
    appNew: appNew.count ?? 0,
    rcpt7, rcptPrev7, rev30,
    series: {
      receipts: keys.map((k) => ({ k, v: rcptByDay.get(k) ?? 0 })),
      revenue: keys.map((k) => ({ k, v: revByDay.get(k) ?? 0 })),
      customers: keys.map((k) => ({ k, v: custByDay.get(k) ?? 0 })),
    },
    topVenues, dist,
    feed: feed.slice(0, 12),
  };
}

export default async function AdminDashboard() {
  const s = await loadStats();
  const delta = s.rcptPrev7 > 0 ? Math.round(((s.rcpt7 - s.rcptPrev7) / s.rcptPrev7) * 100) : (s.rcpt7 > 0 ? 100 : 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Genel Bakış</h1>
        {s.appNew > 0 && (
          <Link href="/admin/applications" style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", background: "#e6b800", padding: "4px 10px", borderRadius: 20, textDecoration: "none" }}>
            🔔 {s.appNew} yeni başvuru
          </Link>
        )}
      </div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 22 }}>
        Demo (synthetic) fişler sayımdan dışlandı. Son {DAYS} günlük trendler ve gerçek müşteri verisi.
      </p>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <Card label="Toplam İşletme" value={s.venuesTotal} sub={`${s.venuesActive} aktif · ${s.dist.paddle} abonelik`} />
        <Card label="Toplam Müşteri" value={s.customers} sub={`son 30g: +${s.customers30}`} />
        <Card label="Fiş (7g)" value={s.rcpt7} delta={delta} sub={`toplam ${s.receiptsTotal}`} />
        <Card label="Ciro (30g)" value={`₺${Math.round(s.rev30).toLocaleString("tr-TR")}`} sub="karışık para birimi" />
        <Card label="Toplam Spin" value={s.spins} />
        <Card label="Kupon Kullanım" value={`${s.redemptionRate}%`} sub={`${s.couponsRedeemed}/${s.coupons}`} />
        <Card label="QR Menü Aktif" value={s.dist.qrMenu} sub="eklenti açık işletme" />
        <Card label="Bekleyen Başvuru" value={s.appNew} highlight={s.appNew > 0} />
      </div>

      {/* Trends */}
      <Section title={`Trendler — son ${DAYS} gün`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          <Chart title="Günlük Fiş" data={s.series.receipts} color="#5eb95e" />
          <Chart title="Günlük Ciro (₺)" data={s.series.revenue} color="#e6b800" money />
          <Chart title="Yeni Müşteri" data={s.series.customers} color="#7bb3ff" />
        </div>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }}>
        {/* Top venues */}
        <Section title="En Aktif İşletmeler (30g fiş)">
          {s.topVenues.length === 0 || s.topVenues.every((v) => v.receipts === 0) ? (
            <Empty>Son 30 günde fiş yok.</Empty>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ color: "#888", textAlign: "left" }}>
                <tr><Th>#</Th><Th>İşletme</Th><Th>Fiş</Th><Th>Ciro</Th></tr>
              </thead>
              <tbody>
                {s.topVenues.filter((v) => v.receipts > 0).map((v, i) => (
                  <tr key={v.slug} style={{ borderTop: "1px solid #1a1a1a" }}>
                    <Td style={{ color: "#666", width: 24 }}>{i + 1}</Td>
                    <Td><Link href={`/admin/venues/${v.slug}`} style={{ color: "#7bb3ff", textDecoration: "none" }}>{v.name}</Link></Td>
                    <Td style={{ color: "#fff", fontWeight: 600 }}>{v.receipts}</Td>
                    <Td style={{ color: "#bbb" }}>{v.currency}{Math.round(v.revenue).toLocaleString("tr-TR")}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Distribution */}
        <Section title="Dağılım">
          <DistRow label="Plan: Kampanya" value={s.dist.planKampanya} total={s.venuesTotal} color="#7bb3ff" />
          <DistRow label="Plan: İşletme" value={s.dist.planIsletme} total={s.venuesTotal} color="#5eb95e" />
          <div style={{ height: 10 }} />
          <DistRow label="Tier: Standard" value={s.dist.tierStandard} total={s.venuesTotal} color="#888" />
          <DistRow label="Tier: Pro" value={s.dist.tierPro} total={s.venuesTotal} color="#e6b800" />
          <div style={{ height: 10 }} />
          <DistRow label="QR Menü açık" value={s.dist.qrMenu} total={s.venuesTotal} color="#c08bff" />
          <DistRow label="Paddle abonelik" value={s.dist.paddle} total={s.venuesTotal} color="#5eb95e" />
          <DistRow label="Pasif" value={s.dist.inactive} total={s.venuesTotal} color="#cc6666" />
        </Section>
      </div>

      {/* Activity feed */}
      <Section title="Canlı Aktivite (tüm platform)">
        {s.feed.length === 0 ? <Empty>Henüz aktivite yok.</Empty> : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {s.feed.map((f, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid #1a1a1a", fontSize: 13 }}>
                <span style={{ fontSize: 14 }}>{f.kind === "receipt" ? "🧾" : f.kind === "win" ? "🎁" : "✓"}</span>
                <span style={{ color: "#ddd", flex: 1 }}>{f.label}</span>
                <span style={{ color: "#777", fontSize: 12 }}>{f.venue}</span>
                <span style={{ color: "#555", fontSize: 11, width: 110, textAlign: "right" }}>{new Date(f.at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/* ── components ── */
function Card({ label, value, sub, delta, highlight }: { label: string; value: string | number; sub?: string; delta?: number; highlight?: boolean }) {
  return (
    <div style={{ padding: 16, borderRadius: 10, background: highlight ? "#1c1808" : "#141414", border: `1px solid ${highlight ? "#4a3d0a" : "#1f1f1f"}` }}>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: highlight ? "#e6b800" : "#fff" }}>{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: delta > 0 ? "#5eb95e" : "#cc6666" }}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Chart({ title, data, color, money }: { title: string; data: Array<{ k: string; v: number }>; color: string; money?: boolean }) {
  const w = 100, h = 40;
  const max = Math.max(1, ...data.map((d) => d.v));
  const n = data.length;
  const bw = w / n;
  const sum = data.reduce((s, d) => s + d.v, 0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{money ? `₺${Math.round(sum).toLocaleString("tr-TR")}` : sum}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 56, display: "block" }}>
        {data.map((d, i) => {
          const bh = (d.v / max) * (h - 2);
          return <rect key={i} x={i * bw + 0.5} y={h - bh} width={Math.max(0.5, bw - 1)} height={bh} fill={color} opacity={0.85} rx={0.5} />;
        })}
      </svg>
      <div style={{ fontSize: 10, color: "#555", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
        <span>{data[0]?.k.slice(5)}</span><span>{data[n - 1]?.k.slice(5)}</span>
      </div>
    </div>
  );
}

function DistRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#bbb", marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: "#fff", fontWeight: 600 }}>{value} <span style={{ color: "#666", fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: 0.6 }}>{title}</h2>
      <div style={{ padding: 16, background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 10 }}>{children}</div>
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "#666", fontSize: 13, padding: "12px 0", textAlign: "center" }}>{children}</div>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "6px 10px", fontWeight: 600, fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase" }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "6px 10px", ...style }}>{children}</td>;
}
