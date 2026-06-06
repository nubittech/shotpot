import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { DigitalMenuCategory, DigitalMenuItem, MenuDesign } from "../../../../lib/supabase/types";
import { getServerCopy, getServerLocale } from "../../../../lib/i18n/server";
import { MenuBuilderClient, type CategoryView, type ItemView } from "./MenuBuilderClient";
import { MenuDesigner } from "./MenuDesigner";

type Params = { params: { slug: string }; searchParams: { mode?: string } };

export default async function DigitalMenuPage({ params, searchParams }: Params) {
  const structured = searchParams.mode === "structured";
  const en = getServerLocale() === "en";
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = getServiceClient();

  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, currency, digital_menu_enabled, menu_design")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!venue) redirect("/dashboard");

  const v = venue as { id: string; name: string; slug: string; currency: string; digital_menu_enabled: boolean; menu_design: MenuDesign };
  const copy = getServerCopy().dashboardPages.digitalMenu;

  const shell = (inner: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#ffd84e", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>SnapJack</Link>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{v.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
        <span style={{ color: "#f4efe6", fontSize: 13 }}>{copy.breadcrumb}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: 3 }}>
          <Link href={`/dashboard/digital-menu/${v.slug}`} style={tab(!structured)}>{en ? "Visual" : "Görsel"}</Link>
          <Link href={`/dashboard/digital-menu/${v.slug}?mode=structured`} style={tab(structured)}>{en ? "Structured" : "Yapılandırılmış"}</Link>
        </div>
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

  const { data: catsRaw } = await svc
    .from("digital_menu_categories")
    .select("*")
    .eq("venue_id", v.id)
    .order("sort_order", { ascending: true });
  const cats = (catsRaw ?? []) as DigitalMenuCategory[];

  const { data: itemsRaw } = await svc
    .from("digital_menu_items")
    .select("*")
    .eq("venue_id", v.id)
    .order("sort_order", { ascending: true });
  const items = (itemsRaw ?? []) as DigitalMenuItem[];

  const categoryViews: CategoryView[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    nameEn: c.name_en ?? "",
    active: c.active,
  }));

  const itemViews: ItemView[] = items.map((it) => ({
    id: it.id,
    categoryId: it.category_id,
    name: it.name,
    nameEn: it.name_en ?? "",
    description: it.description ?? "",
    descriptionEn: it.description_en ?? "",
    price: it.price,
    imageUrl: it.image_url ?? "",
    tags: Array.isArray(it.tags) ? it.tags : [],
    isAvailable: it.is_available,
    active: it.active,
  }));

  return shell(
    structured
      ? <MenuBuilderClient slug={v.slug} currency={v.currency} initialCategories={categoryViews} initialItems={itemViews} />
      : <MenuDesigner slug={v.slug} initialDesign={v.menu_design ?? {}} />
  );
}

function tab(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, textDecoration: "none",
    background: active ? "#ffd84e" : "transparent",
    color: active ? "#0a0a0c" : "rgba(244,239,230,0.6)",
  };
}
