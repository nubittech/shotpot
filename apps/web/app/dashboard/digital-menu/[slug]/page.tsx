import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { DigitalMenuCategory, DigitalMenuItem, DigitalMenu, MenuLanding, MenuDesign } from "../../../../lib/supabase/types";
import { getServerCopy } from "../../../../lib/i18n/server";
import { MenuBuilderClient, type CategoryView, type ItemView } from "./MenuBuilderClient";
import { MenuDesigner } from "./MenuDesigner";
import { MenuManager } from "./MenuManager";

type Params = { params: { slug: string }; searchParams: { mode?: string; menu?: string } };

export default async function DigitalMenuPage({ params, searchParams }: Params) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = getServiceClient();
  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, currency, digital_menu_enabled, menu_landing")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!venue) redirect("/dashboard");
  const v = venue as { id: string; name: string; slug: string; currency: string; digital_menu_enabled: boolean; menu_landing: MenuLanding };
  const copy = getServerCopy().dashboardPages.digitalMenu;

  const shell = (inner: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>SnapJack</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>{copy.breadcrumb}</span>
      </header>
      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 24px" }}>{inner}</main>
    </div>
  );

  if (!v.digital_menu_enabled) {
    return shell(
      <>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>{copy.title}</h1>
        <div style={{ marginTop: 24, padding: "20px 24px", borderRadius: 14, background: "rgba(255,216,78,0.06)", border: "1px solid rgba(255,216,78,0.2)", color: "rgba(244,239,230,0.8)", fontSize: 14, lineHeight: 1.6 }}>
          🔒 {copy.notEnabled}
        </div>
      </>
    );
  }

  // Legacy structured builder (kept, reachable via ?mode=structured)
  if (searchParams.mode === "structured") {
    const [{ data: catsRaw }, { data: itemsRaw }] = await Promise.all([
      svc.from("digital_menu_categories").select("*").eq("venue_id", v.id).order("sort_order", { ascending: true }),
      svc.from("digital_menu_items").select("*").eq("venue_id", v.id).order("sort_order", { ascending: true }),
    ]);
    const cats = (catsRaw ?? []) as DigitalMenuCategory[];
    const items = (itemsRaw ?? []) as DigitalMenuItem[];
    const categoryViews: CategoryView[] = cats.map((c) => ({ id: c.id, name: c.name, nameEn: c.name_en ?? "", active: c.active }));
    const itemViews: ItemView[] = items.map((it) => ({
      id: it.id, categoryId: it.category_id, name: it.name, nameEn: it.name_en ?? "",
      description: it.description ?? "", descriptionEn: it.description_en ?? "", price: it.price,
      imageUrl: it.image_url ?? "", tags: Array.isArray(it.tags) ? it.tags : [], isAvailable: it.is_available, active: it.active,
    }));
    return shell(<MenuBuilderClient slug={v.slug} currency={v.currency} initialCategories={categoryViews} initialItems={itemViews} />);
  }

  // Load menus
  const { data: menusRaw } = await svc.from("digital_menus").select("*").eq("venue_id", v.id).order("sort_order", { ascending: true });
  const menus = (menusRaw ?? []) as DigitalMenu[];

  // Per-menu visual editor
  if (searchParams.menu) {
    const m = menus.find((x) => x.id === searchParams.menu);
    if (m) {
      return shell(
        <MenuDesigner
          slug={v.slug}
          menuId={m.id}
          menuTitle={m.title}
          backHref={`/dashboard/digital-menu/${v.slug}`}
          initialDesign={(m.design ?? {}) as MenuDesign}
        />
      );
    }
  }

  // Manager (menus list + entry page)
  return shell(<MenuManager slug={v.slug} initialMenus={menus} initialLanding={v.menu_landing ?? {}} />);
}
