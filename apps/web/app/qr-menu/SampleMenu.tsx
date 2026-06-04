import type { Locale } from "../../lib/i18n";

/** Static sample digital menu rendered inside a phone frame — the visual
 *  showcase of what a guest sees. Mirrors the real /m/[slug] styling. */

type Item = { name: string; desc: string; price: string; tags?: string[] };
type Cat = { name: string; items: Item[] };

const DATA: Record<Locale, { venue: string; menu: string; cats: Cat[] }> = {
  tr: {
    venue: "Komün Bar", menu: "MENÜ",
    cats: [
      { name: "Kokteyller", items: [
        { name: "Negroni", desc: "Gin, Campari, kırmızı vermut", price: "₺320", tags: ["popüler"] },
        { name: "Espresso Martini", desc: "Votka, espresso, kahve likörü", price: "₺340" },
      ] },
      { name: "Atıştırmalık", items: [
        { name: "Trüflü Patates", desc: "Parmesan, taze kekik", price: "₺180", tags: ["vejetaryen"] },
        { name: "Baharatlı Kanat", desc: "Ev yapımı acı sos", price: "₺220", tags: ["acı"] },
      ] },
    ],
  },
  en: {
    venue: "Komün Bar", menu: "MENU",
    cats: [
      { name: "Cocktails", items: [
        { name: "Negroni", desc: "Gin, Campari, sweet vermouth", price: "₺320", tags: ["popular"] },
        { name: "Espresso Martini", desc: "Vodka, espresso, coffee liqueur", price: "₺340" },
      ] },
      { name: "Bites", items: [
        { name: "Truffle Fries", desc: "Parmesan, fresh thyme", price: "₺180", tags: ["veggie"] },
        { name: "Spicy Wings", desc: "House-made hot sauce", price: "₺220", tags: ["spicy"] },
      ] },
    ],
  },
};

export function SampleMenu({ locale }: { locale: Locale }) {
  const d = DATA[locale] ?? DATA.tr;
  return (
    <div style={{
      width: 290, maxWidth: "100%", background: "#0a0a0c",
      border: "10px solid #1c1c20", borderRadius: 38,
      boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,200,118,0.12)",
      overflow: "hidden",
    }}>
      {/* notch */}
      <div style={{ height: 26, background: "#1c1c20", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ width: 90, height: 16, background: "#0a0a0c", borderRadius: "0 0 12px 12px" }} />
      </div>
      <div style={{ padding: "16px 16px 22px", maxHeight: 420, overflow: "hidden" }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "#ffd84e", textTransform: "uppercase" }}>{d.menu}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f4efe6", margin: "2px 0 14px" }}>{d.venue}</div>
        {d.cats.map((cat) => (
          <div key={cat.name} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f4efe6", paddingBottom: 6, borderBottom: "2px solid rgba(255,216,78,0.3)", marginBottom: 8 }}>{cat.name}</div>
            {cat.items.map((it) => (
              <div key={it.name} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#f4efe6" }}>{it.name}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#ffd84e", whiteSpace: "nowrap" }}>{it.price}</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)", marginTop: 2, lineHeight: 1.4 }}>{it.desc}</div>
                {it.tags && (
                  <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                    {it.tags.map((t) => (
                      <span key={t} style={{ fontSize: 8.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "rgba(244,239,230,0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
