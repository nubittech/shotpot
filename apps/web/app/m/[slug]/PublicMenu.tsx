"use client";

import { useState } from "react";

export type PublicItem = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number | null;
  imageUrl: string;
  tags: string[];
  isAvailable: boolean;
};
export type PublicCategory = { id: string; name: string; nameEn: string; items: PublicItem[] };

type Copy = {
  menu: string; poweredBy: string; empty: string; soldOut: string;
  priceOnRequest: string; notFound: string; notAvailable: string;
  tags: { vegan: string; vegetarian: string; spicy: string; glutenfree: string; new: string; popular: string };
};

export function PublicMenu({ venueName, currency, defaultLang, categories, copy }: {
  venueName: string;
  currency: string;
  defaultLang: "tr" | "en";
  categories: PublicCategory[];
  copy: Copy;
}) {
  const [lang, setLang] = useState<"tr" | "en">(defaultLang);
  const hasEn = categories.some((c) => c.nameEn || c.items.some((i) => i.nameEn || i.descriptionEn));

  const catName = (c: PublicCategory) => (lang === "en" && c.nameEn ? c.nameEn : c.name);
  const itemName = (i: PublicItem) => (lang === "en" && i.nameEn ? i.nameEn : i.name);
  const itemDesc = (i: PublicItem) => (lang === "en" && i.descriptionEn ? i.descriptionEn : i.description);

  const tagLabel = (t: string) =>
    t === "vegan" ? copy.tags.vegan :
    t === "vegetarian" ? copy.tags.vegetarian :
    t === "spicy" ? copy.tags.spicy :
    t === "glutenfree" ? copy.tags.glutenfree :
    t === "new" ? copy.tags.new :
    t === "popular" ? copy.tags.popular : t;

  const nonEmpty = categories.filter((c) => c.items.length > 0);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 18px 60px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#ffd84e", textTransform: "uppercase" }}>{copy.menu}</div>
          <h1 style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 800 }}>{venueName}</h1>
        </div>
        {hasEn && (
          <div style={{ display: "flex", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", fontSize: 12, fontWeight: 700 }}>
            {(["tr", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "6px 12px", border: "none", cursor: "pointer",
                background: lang === l ? "#ffd84e" : "transparent",
                color: lang === l ? "#0a0a0c" : "rgba(244,239,230,0.6)",
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        )}
      </header>

      {nonEmpty.length === 0 && (
        <p style={{ color: "rgba(244,239,230,0.4)", fontSize: 15, textAlign: "center", marginTop: 40 }}>{copy.empty}</p>
      )}

      {nonEmpty.map((cat) => (
        <section key={cat.id} style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px", paddingBottom: 8, borderBottom: "2px solid rgba(255,216,78,0.3)" }}>
            {catName(cat)}
          </h2>
          {cat.items.map((it) => (
            <div key={it.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: it.isAvailable ? 1 : 0.45 }}>
              {it.imageUrl && (
                <img src={it.imageUrl} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{itemName(it)}</span>
                  <div style={{ flex: 1 }} />
                  {it.price != null && <span style={{ fontSize: 16, fontWeight: 800, color: "#ffd84e", whiteSpace: "nowrap" }}>{currency}{it.price}</span>}
                </div>
                {itemDesc(it) && <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.45 }}>{itemDesc(it)}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {!it.isAvailable && <span style={{ ...chip, background: "rgba(255,80,80,0.15)", color: "#ff9b9b" }}>{copy.soldOut}</span>}
                  {it.tags.map((t) => <span key={t} style={chip}>{tagLabel(t)}</span>)}
                </div>
              </div>
            </div>
          ))}
        </section>
      ))}

      <footer style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: "rgba(244,239,230,0.25)", letterSpacing: "0.05em" }}>
        {copy.poweredBy}
      </footer>
    </div>
  );
}

const chip: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
  background: "rgba(255,255,255,0.07)", color: "rgba(244,239,230,0.6)",
  textTransform: "uppercase", letterSpacing: "0.04em",
};
