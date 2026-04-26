import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server-rsc";
import { getServiceClient } from "../../lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import { CopyLinkButton } from "./CopyLinkButton";

export default async function DashboardPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  // Use service client to also see venues regardless of RLS quirks
  const svc = getServiceClient();
  const { data: venuesRaw } = await svc
    .from("venues")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  const venues = (venuesRaw ?? []) as Array<{ id: string; slug: string; name: string; plan: string; active: boolean; created_at: string }>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#ffd84e" }}>Receipt Reward</div>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ fontSize: 13, color: "rgba(244,239,230,0.5)" }}>Dashboard</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "rgba(244,239,230,0.5)" }}>{user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>İşletmelerim</h1>
          <Link href="/studio" style={primaryLink}>+ Yeni İşletme</Link>
        </div>

        {venues.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 16, color: "rgba(244,239,230,0.55)" }}>
            <p style={{ margin: 0, fontSize: 14 }}>Henüz işletme kurmadın.</p>
            <Link href="/studio" style={{ ...primaryLink, marginTop: 16, display: "inline-block" }}>İlk işletmeni kur →</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {venues.map((v) => (
              <div key={v.id} style={cardStyle}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", marginTop: 4 }}>
                    /play/{v.slug} · {v.plan === "kampanya" ? "Kampanya" : "İşletme"} · {v.active ? "aktif" : "pasif"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <CopyLinkButton slug={v.slug} />
                  <Link href={`/play/${v.slug}`} target="_blank" style={secondaryLink}>Önizle</Link>
                  <Link href={`/scan?venue=${v.slug}`} style={secondaryLink}>Garson</Link>
                  <Link href={`/studio?slug=${v.slug}`} style={primaryLink}>Düzenle</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "18px 22px", borderRadius: 14,
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
};

const primaryLink: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 10, background: "#ffd84e", color: "#111",
  fontSize: 12, fontWeight: 700, textDecoration: "none",
};

const secondaryLink: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 10,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(244,239,230,0.85)", fontSize: 12, fontWeight: 600, textDecoration: "none",
};
