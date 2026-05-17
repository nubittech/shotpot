import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import { GiftClient } from "./GiftClient";

type Params = { params: { slug: string } };

export default async function GiftsPage({ params }: Params) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = getServiceClient();

  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, tier, gift_daily_enabled")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!venue) redirect("/dashboard");

  const v = venue as { id: string; name: string; slug: string; tier: string; gift_daily_enabled: boolean | null };
  if (v.tier !== "pro") redirect(`/dashboard/customers/${v.slug}`);

  const d30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [
    { count: total },
    { count: active30 },
    { count: dormant30 },
    { count: gold },
    { count: consented },
    { count: pendingSpins },
    { count: usedSpins },
  ] = await Promise.all([
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).gte("last_visit_at", d30),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).lt("last_visit_at", d30),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).eq("loyalty_tier", "gold"),
    svc.from("customers").select("*", { count: "exact", head: true }).eq("venue_id", v.id).is("deleted_at", null).eq("consent_marketing", true),
    svc.from("gift_spins").select("*", { count: "exact", head: true }).eq("venue_id", v.id).eq("status", "pending"),
    svc.from("gift_spins").select("*", { count: "exact", head: true }).eq("venue_id", v.id).eq("status", "used"),
  ]);

  const audiences = {
    all: total ?? 0,
    active30: active30 ?? 0,
    dormant30: dormant30 ?? 0,
    loyalty_gold: gold ?? 0,
    consented: consented ?? 0,
  };
  const granted = (pendingSpins ?? 0) + (usedSpins ?? 0);
  const stats = {
    pending: pendingSpins ?? 0,
    used: usedSpins ?? 0,
    granted,
    usageRate: granted > 0 ? Math.round(((usedSpins ?? 0) / granted) * 100) : 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Receipt Reward</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>Hediye Çark</span>
        <div style={{ flex: 1 }} />
        <Link href={`/dashboard/campaigns/${v.slug}`} style={navLink}>Kampanyalar</Link>
        <Link href={`/dashboard/customers/${v.slug}`} style={navLink}>Müşteriler</Link>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>🎁 Hediye Çark</h1>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.5 }}>
          Müşterilerine fiş okutmadan çark hakkı gönder. Müşteri uygulamayı açtığında
          parlayan bir kart görür ve çevirip kupon kazanır.
        </p>

        <GiftClient
          slug={v.slug}
          audiences={audiences}
          dailyEnabled={!!v.gift_daily_enabled}
          stats={stats}
        />
      </main>
    </div>
  );
}

const navLink: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" };
