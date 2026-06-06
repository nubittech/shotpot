import Link from "next/link";
import { getServiceClient } from "../../../lib/supabase/server";
import type { DigitalMenuCategory, DigitalMenuItem, DigitalMenu, MenuLanding } from "../../../lib/supabase/types";
import { getServerCopy } from "../../../lib/i18n/server";
import { PublicMenu, type PublicCategory } from "./PublicMenu";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };
const CUR: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
const pageWrap: React.CSSProperties = { minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" };

export default async function PublicMenuPage({ params }: Params) {
  const copy = getServerCopy().menuPublic;
  const svc = getServiceClient();

  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, currency, interface_language, digital_menu_enabled, menu_landing")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();
  const v = venue as {
    id: string; name: string; slug: string; currency: string;
    interface_language: "tr" | "en"; digital_menu_enabled: boolean; menu_landing: MenuLanding;
  } | null;

  const wrap = (msg: string) => (
    <div style={pageWrap}><div style={{ maxWidth: 540, margin: "0 auto", padding: "80px 24px", textAlign: "center", color: "rgba(244,239,230,0.6)", fontSize: 15 }}>{msg}</div></div>
  );
  if (!v) return wrap(copy.notFound);
  if (!v.digital_menu_enabled) return wrap(copy.notAvailable);

  const en = v.interface_language === "en";
  const { data: menusRaw } = await svc
    .from("digital_menus").select("id, title, title_en, icon, active, sort_order, design")
    .eq("venue_id", v.id).eq("active", true).order("sort_order", { ascending: true });
  type MenuRow = Pick<DigitalMenu, "id" | "title" | "title_en" | "icon" | "active" | "sort_order" | "design">;
  const menus = (menusRaw ?? []) as MenuRow[];
  const landing = v.menu_landing ?? {};

  // ── Entry/landing page when there are menus ──
  if (menus.length > 0) {
    const title = (m: MenuRow) => (en && m.title_en ? m.title_en : m.title);
    return (
      <div style={{ ...pageWrap, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 22px", overflow: "hidden" }}>
        {landing.bgUrl && (
          <>
            <img src={landing.bgUrl} alt="" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
            <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.78))", zIndex: 0 }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, textAlign: "center" }}>
          {landing.logoUrl
            ? <img src={landing.logoUrl} alt={v.name} style={{ width: 96, height: 96, objectFit: "contain", margin: "0 auto 16px", borderRadius: 16 }} />
            : <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.18em", color: "#ffd84e", textTransform: "uppercase", marginBottom: 6 }}>{copy.menu}</div>}
          <h1 style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 800 }}>{v.name}</h1>
          {(en ? landing.headlineEn || landing.headline : landing.headline) && (
            <p style={{ margin: "0 0 8px", fontSize: 15, color: "rgba(244,239,230,0.7)" }}>{en ? landing.headlineEn || landing.headline : landing.headline}</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26 }}>
            {menus.map((m) => (
              <Link key={m.id} href={`/m/${v.slug}/${m.id}`} style={btn}>
                {m.icon ? `${m.icon} ` : ""}{title(m)}
              </Link>
            ))}
            {landing.showPlay && (
              <Link href={`/play/${v.slug}`} style={{ ...btn, background: "rgba(255,216,78,0.14)", border: "1px solid rgba(255,216,78,0.45)", color: "#ffd84e" }}>
                {(en ? landing.playLabelEn || landing.playLabel : landing.playLabel) || (en ? "🎁 Win a reward" : "🎁 Ödül kazan")}
              </Link>
            )}
          </div>
          <div style={{ marginTop: 28, fontSize: 11, color: "rgba(244,239,230,0.3)", letterSpacing: "0.05em" }}>{copy.poweredBy}</div>
        </div>
      </div>
    );
  }

  // ── Fallback: legacy structured menu (categories/items) ──
  const { data: catsRaw } = await svc.from("digital_menu_categories").select("*").eq("venue_id", v.id).eq("active", true).order("sort_order", { ascending: true });
  const cats = (catsRaw ?? []) as DigitalMenuCategory[];
  const { data: itemsRaw } = await svc.from("digital_menu_items").select("*").eq("venue_id", v.id).eq("active", true).order("sort_order", { ascending: true });
  const items = (itemsRaw ?? []) as DigitalMenuItem[];
  const categories: PublicCategory[] = cats.map((c) => ({
    id: c.id, name: c.name, nameEn: c.name_en ?? "",
    items: items.filter((it) => it.category_id === c.id).map((it) => ({
      id: it.id, name: it.name, nameEn: it.name_en ?? "", description: it.description ?? "", descriptionEn: it.description_en ?? "",
      price: it.price, imageUrl: it.image_url ?? "", tags: Array.isArray(it.tags) ? it.tags : [], isAvailable: it.is_available,
    })),
  }));
  return (
    <div style={pageWrap}>
      <PublicMenu venueName={v.name} currency={CUR[v.currency] ?? ""} defaultLang={v.interface_language} categories={categories} copy={copy} />
    </div>
  );
}

const btn: React.CSSProperties = {
  display: "block", padding: "16px 20px", borderRadius: 14, textDecoration: "none",
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
  color: "#f4efe6", fontSize: 16, fontWeight: 700, backdropFilter: "blur(6px)",
};
