import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { MarketingCampaign } from "../../../../lib/supabase/types";
import { getServerCopy } from "../../../../lib/i18n/server";
import { CampaignComposer } from "./CampaignComposer";

type Params = { params: { slug: string } };

export default async function CampaignsPage({ params }: Params) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = getServiceClient();

  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, tier")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!venue) redirect("/dashboard");

  const v = venue as { id: string; name: string; slug: string; tier: string };
  if (v.tier !== "pro") redirect(`/dashboard/customers/${v.slug}`);

  const serverCopy = getServerCopy();
  const copy = serverCopy.dashboardPages.campaigns;
  const locale = serverCopy.meta.locale;

  // Audience counts
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();

  const [
    { count: total },
    { count: active30 },
    { count: dormant30 },
    { count: silver },
    { count: gold },
    { count: consented },
    { data: campaignsRaw },
  ] = await Promise.all([
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).gte("last_visit_at", d30),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).lt("last_visit_at", d30),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).in("loyalty_tier", ["silver", "gold"]),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).eq("loyalty_tier", "gold"),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).eq("consent_marketing", true),
    svc.from("marketing_campaigns").select("*").eq("venue_id", v.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const campaigns = (campaignsRaw ?? []) as MarketingCampaign[];

  // Compute opened/redeemed from the delivery rows instead of trusting the
  // denormalized counters on marketing_campaigns (which were never kept up to
  // date). This is drift-proof: the truth lives in campaign_deliveries.
  const engagement = new Map<string, { opened: number; redeemed: number }>();
  if (campaigns.length > 0) {
    const { data: deliveries } = await svc
      .from("campaign_deliveries")
      .select("campaign_id, opened_at, redeemed_at")
      .in("campaign_id", campaigns.map((c) => c.id));
    for (const d of (deliveries ?? []) as Array<{ campaign_id: string; opened_at: string | null; redeemed_at: string | null }>) {
      const e = engagement.get(d.campaign_id) ?? { opened: 0, redeemed: 0 };
      if (d.opened_at) e.opened++;
      if (d.redeemed_at) e.redeemed++;
      engagement.set(d.campaign_id, e);
    }
  }

  const audiences = {
    all: total ?? 0,
    active30: active30 ?? 0,
    dormant30: dormant30 ?? 0,
    loyalty_silver: silver ?? 0,
    loyalty_gold: gold ?? 0,
    consented: consented ?? 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>SnapJack</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>{copy.breadcrumb}</span>
        <div style={{ flex: 1 }} />
        <Link href={`/dashboard/customers/${v.slug}`} style={navLink}>{copy.navCustomers}</Link>
        <Link href={`/dashboard/analytics/${v.slug}`} style={navLink}>{copy.navAnalytics}</Link>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800 }}>{copy.title}</h1>

        <CampaignComposer slug={v.slug} venueName={v.name} audiences={audiences} />

        {/* Past campaigns */}
        <h2 style={{ margin: "40px 0 16px", fontSize: 14, fontWeight: 800, color: "rgba(244,239,230,0.65)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{copy.pastTitle.replace("{count}", String(campaigns.length))}</h2>

        {campaigns.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 14, color: "rgba(244,239,230,0.4)", fontSize: 13 }}>
            {copy.pastEmpty}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {campaigns.map((c) => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(244,239,230,0.4)", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {c.sent_at ? new Date(c.sent_at).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : copy.draft}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(244,239,230,0.55)", lineHeight: 1.5, marginBottom: 8 }}>{c.body}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "rgba(244,239,230,0.45)" }}>
                  <span>📤 {c.sent_count} {copy.sent}</span>
                  <span>👁 {engagement.get(c.id)?.opened ?? 0} {copy.opened}</span>
                  <span>🎟 {engagement.get(c.id)?.redeemed ?? 0} {copy.redeemed}</span>
                  {c.reward_label && <span style={{ color: "#a78bfa" }}>🎁 {c.reward_label}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const navLink: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" };
