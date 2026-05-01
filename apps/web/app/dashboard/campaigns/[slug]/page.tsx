import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { MarketingCampaign } from "../../../../lib/supabase/types";
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

  // Audience counts
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();

  const [
    { count: total },
    { count: active30 },
    { count: dormant30 },
    { count: gold },
    { count: consented },
    { data: campaignsRaw },
  ] = await Promise.all([
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).gte("last_visit_at", d30),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).lt("last_visit_at", d30),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).eq("loyalty_tier", "gold"),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).eq("consent_marketing", true),
    svc.from("marketing_campaigns").select("*").eq("venue_id", v.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const campaigns = (campaignsRaw ?? []) as MarketingCampaign[];
  const audiences = {
    all: total ?? 0,
    active30: active30 ?? 0,
    dormant30: dormant30 ?? 0,
    loyalty_gold: gold ?? 0,
    consented: consented ?? 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Receipt Reward</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>Kampanyalar</span>
        <div style={{ flex: 1 }} />
        <Link href={`/dashboard/customers/${v.slug}`} style={navLink}>Müşteriler</Link>
        <Link href={`/dashboard/analytics/${v.slug}`} style={navLink}>Analitik</Link>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800 }}>Kampanya Gönder</h1>

        <CampaignComposer slug={v.slug} venueName={v.name} audiences={audiences} />

        {/* Past campaigns */}
        <h2 style={{ margin: "40px 0 16px", fontSize: 14, fontWeight: 800, color: "rgba(244,239,230,0.65)", textTransform: "uppercase", letterSpacing: "0.12em" }}>📜 Geçmiş Kampanyalar ({campaigns.length})</h2>

        {campaigns.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 14, color: "rgba(244,239,230,0.4)", fontSize: 13 }}>
            Henüz gönderilmiş kampanya yok.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {campaigns.map((c) => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(244,239,230,0.4)", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {c.sent_at ? new Date(c.sent_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Taslak"}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(244,239,230,0.55)", lineHeight: 1.5, marginBottom: 8 }}>{c.body}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "rgba(244,239,230,0.45)" }}>
                  <span>📤 {c.sent_count} gönderildi</span>
                  <span>👁 {c.opened_count} okundu</span>
                  <span>🎟 {c.redeemed_count} kullanıldı</span>
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
