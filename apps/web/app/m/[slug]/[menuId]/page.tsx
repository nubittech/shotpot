import Link from "next/link";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { DigitalMenu, MenuDesign } from "../../../../lib/supabase/types";
import { getServerCopy } from "../../../../lib/i18n/server";
import { MenuDesignView } from "../../../../components/MenuDesignView";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string; menuId: string } };
const pageWrap: React.CSSProperties = { minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" };

export default async function PublicMenuItemPage({ params }: Params) {
  const copy = getServerCopy().menuPublic;
  const svc = getServiceClient();

  const { data: venue } = await svc
    .from("venues").select("id, name, slug, digital_menu_enabled")
    .eq("slug", params.slug).eq("active", true).maybeSingle();
  const v = venue as { id: string; name: string; slug: string; digital_menu_enabled: boolean } | null;
  if (!v || !v.digital_menu_enabled) {
    return <div style={pageWrap}><div style={{ textAlign: "center", padding: "80px 24px", color: "rgba(244,239,230,0.6)" }}>{copy.notFound}</div></div>;
  }

  const { data: menuRaw } = await svc
    .from("digital_menus").select("id, title, design, active, venue_id")
    .eq("id", params.menuId).eq("venue_id", v.id).maybeSingle();
  const m = menuRaw as Pick<DigitalMenu, "id" | "title" | "design" | "active"> | null;
  if (!m || m.active === false) {
    return <div style={pageWrap}><div style={{ textAlign: "center", padding: "80px 24px", color: "rgba(244,239,230,0.6)" }}>{copy.notFound}</div></div>;
  }

  const design = (m.design ?? {}) as MenuDesign;

  return (
    <div style={pageWrap}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)", background: "rgba(10,10,12,0.7)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href={`/m/${v.slug}`} style={{ color: "#ffd84e", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>‹ {copy.menu}</Link>
        <span style={{ fontSize: 14, color: "rgba(244,239,230,0.6)" }}>{m.title}</span>
      </div>
      <div style={{ padding: "14px 12px 44px" }}>
        {design.bgUrl
          ? <MenuDesignView design={design} maxWidth={640} />
          : <p style={{ textAlign: "center", color: "rgba(244,239,230,0.4)", padding: "60px 0" }}>{copy.empty}</p>}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "rgba(244,239,230,0.25)" }}>{copy.poweredBy}</div>
      </div>
    </div>
  );
}
