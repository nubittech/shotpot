import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { CustomerMenu, CustomerMenuItem } from "../../../../lib/supabase/types";
import { MenuClient, type MenuView } from "./MenuClient";

type Params = { params: { slug: string } };

export default async function MenusPage({ params }: Params) {
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

  const { data: menusRaw } = await svc
    .from("customer_menus")
    .select("*")
    .eq("venue_id", v.id)
    .order("created_at", { ascending: false });
  const menus = (menusRaw ?? []) as CustomerMenu[];

  let items: CustomerMenuItem[] = [];
  if (menus.length > 0) {
    const { data: itemsRaw } = await svc
      .from("customer_menu_items")
      .select("*")
      .in("menu_id", menus.map((m) => m.id))
      .order("sort_order", { ascending: true });
    items = (itemsRaw ?? []) as CustomerMenuItem[];
  }

  const menuViews: MenuView[] = menus.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? "",
    audience: m.audience,
    active: m.active,
    validFrom: m.valid_from ?? "",
    validTo: m.valid_to ?? "",
    items: items
      .filter((it) => it.menu_id === m.id)
      .map((it) => ({
        name: it.name,
        description: it.description ?? "",
        oldPrice: it.old_price,
        newPrice: it.new_price,
      })),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>SnapJack</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>Özel Menüler</span>
        <div style={{ flex: 1 }} />
        <Link href={`/dashboard/gifts/${v.slug}`} style={navLink}>Hediye Çark</Link>
        <Link href={`/dashboard/campaigns/${v.slug}`} style={navLink}>Kampanyalar</Link>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>📋 Sana Özel Menü</h1>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.5 }}>
          Belirli müşteri segmentlerine özel indirimli menüler yayınla. Müşteri
          uygulamasında sadece kendi segmentindeki menüyü görür — gelmeden önce
          o günün kampanyasına bakar.
        </p>

        <MenuClient slug={v.slug} initialMenus={menuViews} />
      </main>
    </div>
  );
}

const navLink: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" };
