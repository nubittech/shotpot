import type { MenuDesign, MenuTextLayer } from "../lib/supabase/types";

/** Maps a stored fontFamily key to a real CSS font stack (fonts loaded in layout). */
export const MENU_FONTS: Record<string, string> = {
  Inter: "var(--font-inter), Inter, system-ui, sans-serif",
  "Playfair Display": "'Playfair Display', serif",
  Cinzel: "'Cinzel', serif",
  "Bebas Neue": "'Bebas Neue', sans-serif",
  Pacifico: "'Pacifico', cursive",
  Caveat: "'Caveat', cursive",
  Nunito: "'Nunito', sans-serif",
};

export function layerStyle(l: MenuTextLayer): React.CSSProperties {
  return {
    position: "absolute",
    left: `${l.xPct}%`,
    top: `${l.yPct}%`,
    width: `${l.widthPct}%`,
    fontSize: `${l.fontSizePct}cqw`,
    fontFamily: MENU_FONTS[l.fontFamily] ?? MENU_FONTS.Inter,
    color: l.color,
    textAlign: l.align,
    letterSpacing: `${l.letterSpacing}em`,
    lineHeight: l.lineHeight,
    opacity: l.opacity,
    fontWeight: l.weight,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
  };
}

/** Read-only responsive render of a visual menu design (bg image + text layers).
 *  Used by the public menu and as the editor's static base. cqw units make the
 *  text scale with the container width. */
export function MenuDesignView({ design, maxWidth = 640 }: { design: MenuDesign; maxWidth?: number }) {
  const aspect = design.aspect && design.aspect > 0 ? design.aspect : 1.414;
  const layers = (design.layers ?? []).filter((l) => l.visible !== false);
  return (
    <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>
      <div style={{ position: "relative", width: "100%", paddingTop: `${aspect * 100}%`, containerType: "inline-size", background: "#0a0a0c", borderRadius: 8, overflow: "hidden" } as React.CSSProperties}>
        {design.bgUrl && (
          <img src={design.bgUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {layers.map((l) => (
          <p key={l.id} style={layerStyle(l)}>{l.content}</p>
        ))}
      </div>
    </div>
  );
}
