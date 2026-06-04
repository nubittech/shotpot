import { getServiceClient } from "../../../lib/supabase/server";
import type { DigitalMenuCategory, DigitalMenuItem } from "../../../lib/supabase/types";
import { getServerCopy } from "../../../lib/i18n/server";
import { PublicMenu, type PublicCategory } from "./PublicMenu";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

const CUR: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

export default async function PublicMenuPage({ params }: Params) {
  const copy = getServerCopy().menuPublic;
  const svc = getServiceClient();

  const { data: venue } = await svc
    .from("venues")
    .select("id, name, currency, interface_language, digital_menu_enabled")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();
  const v = venue as {
    id: string; name: string; currency: string;
    interface_language: "tr" | "en"; digital_menu_enabled: boolean;
  } | null;

  const wrap = (msg: string) => (
    <div style={pageWrap}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "80px 24px", textAlign: "center", color: "rgba(244,239,230,0.6)", fontSize: 15 }}>{msg}</div>
    </div>
  );

  if (!v) return wrap(copy.notFound);
  if (!v.digital_menu_enabled) return wrap(copy.notAvailable);

  const { data: catsRaw } = await svc
    .from("digital_menu_categories")
    .select("*")
    .eq("venue_id", v.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const cats = (catsRaw ?? []) as DigitalMenuCategory[];

  const { data: itemsRaw } = await svc
    .from("digital_menu_items")
    .select("*")
    .eq("venue_id", v.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const items = (itemsRaw ?? []) as DigitalMenuItem[];

  const categories: PublicCategory[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    nameEn: c.name_en ?? "",
    items: items
      .filter((it) => it.category_id === c.id)
      .map((it) => ({
        id: it.id,
        name: it.name,
        nameEn: it.name_en ?? "",
        description: it.description ?? "",
        descriptionEn: it.description_en ?? "",
        price: it.price,
        imageUrl: it.image_url ?? "",
        tags: Array.isArray(it.tags) ? it.tags : [],
        isAvailable: it.is_available,
      })),
  }));

  return (
    <div style={pageWrap}>
      <PublicMenu
        venueName={v.name}
        currency={CUR[v.currency] ?? ""}
        defaultLang={v.interface_language}
        categories={categories}
        copy={copy}
      />
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a0a0c",
  color: "#f4efe6",
  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
};
