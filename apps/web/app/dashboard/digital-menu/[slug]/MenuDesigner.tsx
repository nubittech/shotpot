"use client";

import { useRef, useState } from "react";
import { getClientLocale } from "../../../../lib/i18n/client";
import type { MenuDesign, MenuTextLayer } from "../../../../lib/supabase/types";
import { MENU_FONTS, layerStyle } from "../../../../components/MenuDesignView";
import { MenuQR } from "./MenuQR";

const FONT_KEYS = Object.keys(MENU_FONTS);
const SWATCHES = ["#e8c876", "#fff8e8", "#c8b890", "#ffffff", "#1a140d", "#000000"];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const uid = () => `l_${Math.random().toString(36).slice(2, 9)}`;

function T(locale: string) {
  const en = locale === "en";
  return {
    title: en ? "Visual Menu Editor" : "Görsel Menü Editörü",
    desc: en ? "Upload your menu image and place editable text on top." : "Menü görselini yükle, üstüne düzenlenebilir metin yerleştir.",
    uploadBg: en ? "Upload menu background" : "Menü arka planını yükle",
    changeBg: en ? "Change background" : "Arka planı değiştir",
    uploading: en ? "Uploading…" : "Yükleniyor…",
    bgHint: en ? "PNG/JPG, your menu artwork (any aspect)." : "PNG/JPG, menü görselin (her oran).",
    addText: en ? "+ Add New Text" : "+ Yeni Metin Ekle",
    save: en ? "Save Changes" : "Kaydet",
    saving: en ? "Saving…" : "Kaydediliyor…",
    saved: en ? "✓ Saved" : "✓ Kaydedildi",
    layers: en ? "Layers" : "Katmanlar",
    noLayers: en ? "No text yet. Add one." : "Henüz metin yok. Ekle.",
    selectHint: en ? "Select a text layer to edit" : "Düzenlemek için bir metin katmanı seç",
    content: en ? "Content" : "İçerik",
    font: en ? "Text Style" : "Yazı Tipi",
    size: en ? "Font Size" : "Font Boyutu",
    color: en ? "Text Color" : "Yazı Rengi",
    align: en ? "Alignment" : "Hizalama",
    letter: en ? "Letter Spacing" : "Harf Aralığı",
    line: en ? "Line Height" : "Satır Aralığı",
    opacity: en ? "Opacity" : "Opaklık",
    weight: en ? "Weight" : "Kalınlık",
    delete: en ? "Delete" : "Sil",
    duplicate: en ? "Duplicate" : "Kopyala",
    show: en ? "Show" : "Göster",
    hide: en ? "Hide" : "Gizle",
    bold: en ? "Bold" : "Kalın",
    error: en ? "Could not save." : "Kaydedilemedi.",
    newText: en ? "New text" : "Yeni metin",
  };
}

export function MenuDesigner({ slug, initialDesign }: { slug: string; initialDesign: MenuDesign }) {
  const L = T(getClientLocale());
  const [bgUrl, setBgUrl] = useState(initialDesign.bgUrl ?? "");
  const [aspect, setAspect] = useState(initialDesign.aspect ?? 1.414);
  const [layers, setLayers] = useState<MenuTextLayer[]>(initialDesign.layers ?? []);
  const [selId, setSelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sel = layers.find((l) => l.id === selId) ?? null;

  const patch = (id: string, p: Partial<MenuTextLayer>) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  // ---- background upload ----
  const onBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg("");
    try {
      const fd = new FormData(); fd.append("slug", slug); fd.append("file", file);
      const res = await fetch("/api/dashboard/digital-menu/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBgUrl(json.url);
      const img = new Image();
      img.onload = () => setAspect(img.naturalHeight / img.naturalWidth || 1.414);
      img.src = json.url;
    } catch { setMsg(L.error); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  // ---- layers ----
  const addLayer = () => {
    const l: MenuTextLayer = {
      id: uid(), content: L.newText, xPct: 30, yPct: 45, widthPct: 40, fontSizePct: 4,
      fontFamily: "Playfair Display", color: "#fff8e8", align: "left",
      letterSpacing: 0, lineHeight: 1.3, opacity: 1, weight: 600, visible: true,
    };
    setLayers((ls) => [...ls, l]); setSelId(l.id);
  };
  const duplicate = (l: MenuTextLayer) => {
    const c = { ...l, id: uid(), xPct: clamp(l.xPct + 3, 0, 95), yPct: clamp(l.yPct + 3, 0, 95) };
    setLayers((ls) => [...ls, c]); setSelId(c.id);
  };
  const remove = (id: string) => { setLayers((ls) => ls.filter((l) => l.id !== id)); if (selId === id) setSelId(null); };
  const move = (id: string, dir: -1 | 1) => {
    setLayers((ls) => {
      const i = ls.findIndex((l) => l.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const n = [...ls]; [n[i], n[j]] = [n[j], n[i]]; return n;
    });
  };

  // ---- drag / resize ----
  const startDrag = (e: React.PointerEvent, mode: "move" | "resize", l: MenuTextLayer) => {
    e.preventDefault(); e.stopPropagation();
    setSelId(l.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cw = rect.width, chh = rect.height;
    const start = { px: e.clientX, py: e.clientY, x: l.xPct, y: l.yPct, w: l.widthPct, f: l.fontSizePct };
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - start.px) / cw) * 100;
      const dy = ((ev.clientY - start.py) / chh) * 100;
      if (mode === "move") patch(l.id, { xPct: clamp(start.x + dx, 0, 99), yPct: clamp(start.y + dy, 0, 99) });
      else {
        const newW = clamp(start.w + dx, 4, 100);
        const scale = newW / start.w;
        patch(l.id, { widthPct: newW, fontSizePct: clamp(start.f * scale, 0.6, 30) });
      }
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // ---- save ----
  const save = async () => {
    setBusy(true); setMsg("");
    try {
      const design: MenuDesign = { bgUrl: bgUrl || undefined, aspect, layers };
      const res = await fetch("/api/dashboard/menu-design", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, design }),
      });
      if (!res.ok) throw new Error();
      setMsg(L.saved); setTimeout(() => setMsg(""), 2000);
    } catch { setMsg(L.error); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>{L.title}</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(244,239,230,0.5)" }}>{L.desc}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith("✓") ? "#7be08a" : "#ff9b9b" }}>{msg}</span>}
          <button onClick={save} disabled={busy} style={btnPrimary}>{busy ? L.saving : `💾 ${L.save}`}</button>
        </div>
      </div>

      <MenuQR slug={slug} copy={qrCopy(getClientLocale())} />

      <div className="md-grid" style={{ display: "grid", gridTemplateColumns: "240px minmax(0,1fr) 240px", gap: 16, alignItems: "start", marginTop: 16 }}>
        {/* LEFT — properties */}
        <div style={panel}>
          {!sel ? (
            <p style={{ fontSize: 13, color: "rgba(244,239,230,0.4)", lineHeight: 1.5 }}>{L.selectHint}</p>
          ) : (
            <>
              <Lbl>{L.content}</Lbl>
              <textarea value={sel.content} onChange={(e) => patch(sel.id, { content: e.target.value })} rows={2} style={{ ...input, resize: "vertical" }} />

              <Lbl>{L.font}</Lbl>
              <select value={sel.fontFamily} onChange={(e) => patch(sel.id, { fontFamily: e.target.value })} style={{ ...input, cursor: "pointer" }}>
                {FONT_KEYS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              <Lbl>{L.align}</Lbl>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["left", "center", "right"] as const).map((a) => (
                  <button key={a} onClick={() => patch(sel.id, { align: a })} style={{ ...miniBtn, flex: 1, background: sel.align === a ? "rgba(255,216,78,0.2)" : "rgba(255,255,255,0.05)", color: sel.align === a ? "#ffd84e" : "rgba(244,239,230,0.7)" }}>{a === "left" ? "⌷◄" : a === "center" ? "▮" : "►⌷"}</button>
                ))}
              </div>

              <Lbl>{L.color}</Lbl>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
                {SWATCHES.map((c) => (
                  <button key={c} onClick={() => patch(sel.id, { color: c })} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: sel.color === c ? "2px solid #ffd84e" : "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }} />
                ))}
                <input value={sel.color} onChange={(e) => patch(sel.id, { color: e.target.value })} style={{ ...input, width: 72, marginBottom: 0, padding: "5px 7px", fontSize: 11 }} />
              </div>

              <Slider label={L.size} value={Math.round(sel.fontSizePct * 10)} min={8} max={160} step={1} onChange={(v) => patch(sel.id, { fontSizePct: v / 10 })} />
              <Slider label={L.weight} value={sel.weight} min={400} max={900} step={100} onChange={(v) => patch(sel.id, { weight: v })} />
              <Slider label={L.letter} value={sel.letterSpacing} min={-0.05} max={0.4} step={0.01} onChange={(v) => patch(sel.id, { letterSpacing: v })} fixed={2} />
              <Slider label={L.line} value={sel.lineHeight} min={0.9} max={2.4} step={0.1} onChange={(v) => patch(sel.id, { lineHeight: v })} fixed={1} />
              <Slider label={L.opacity} value={Math.round(sel.opacity * 100)} min={10} max={100} step={5} onChange={(v) => patch(sel.id, { opacity: v / 100 })} suffix="%" />

              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <button onClick={() => duplicate(sel)} style={{ ...miniBtn, flex: 1 }}>{L.duplicate}</button>
                <button onClick={() => remove(sel.id)} style={{ ...miniBtn, flex: 1, background: "rgba(255,80,80,0.12)", color: "#ff9b9b" }}>{L.delete}</button>
              </div>
            </>
          )}
        </div>

        {/* CENTER — canvas */}
        <div>
          {!bgUrl ? (
            <div style={{ ...panel, textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>🖼️</div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onBg} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={btnPrimary}>{uploading ? L.uploading : L.uploadBg}</button>
              <p style={{ fontSize: 12, color: "rgba(244,239,230,0.4)", marginTop: 12 }}>{L.bgHint}</p>
            </div>
          ) : (
            <>
              <div
                ref={canvasRef}
                onPointerDown={() => setSelId(null)}
                style={{ position: "relative", width: "100%", paddingTop: `${aspect * 100}%`, containerType: "inline-size", background: "#0a0a0c", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", userSelect: "none", touchAction: "none" } as React.CSSProperties}
              >
                <img src={bgUrl} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                {layers.filter((l) => l.visible !== false).map((l) => (
                  <div
                    key={l.id}
                    onPointerDown={(e) => startDrag(e, "move", l)}
                    style={{ ...layerStyle(l), cursor: "move", outline: selId === l.id ? "1.5px solid #4c8dff" : "none", outlineOffset: 2 }}
                  >
                    {l.content}
                    {selId === l.id && (
                      <span
                        onPointerDown={(e) => startDrag(e, "resize", l)}
                        style={{ position: "absolute", right: -7, bottom: -7, width: 14, height: 14, borderRadius: 3, background: "#4c8dff", border: "2px solid #fff", cursor: "nwse-resize" }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input ref={fileRef} type="file" accept="image/*" onChange={onBg} style={{ display: "none" }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={miniBtn}>{uploading ? L.uploading : L.changeBg}</button>
                <button onClick={addLayer} style={{ ...miniBtn, background: "rgba(255,216,78,0.15)", color: "#ffd84e" }}>{L.addText}</button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — layers */}
        <div style={panel}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>{L.layers}</div>
          {layers.length === 0 && <p style={{ fontSize: 12, color: "rgba(244,239,230,0.4)" }}>{L.noLayers}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {layers.map((l, i) => (
              <div key={l.id} onClick={() => setSelId(l.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 8px", borderRadius: 8, cursor: "pointer", background: selId === l.id ? "rgba(76,141,255,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${selId === l.id ? "rgba(76,141,255,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                <button onClick={(e) => { e.stopPropagation(); patch(l.id, { visible: !l.visible }); }} title={l.visible ? L.hide : L.show} style={eyeBtn}>{l.visible ? "👁" : "🚫"}</button>
                <span style={{ flex: 1, fontSize: 12.5, color: "#f4efe6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: l.visible ? 1 : 0.5 }}>{l.content || "—"}</span>
                <button onClick={(e) => { e.stopPropagation(); move(l.id, -1); }} disabled={i === 0} style={eyeBtn}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); move(l.id, 1); }} disabled={i === layers.length - 1} style={eyeBtn}>↓</button>
              </div>
            ))}
          </div>
          <button onClick={addLayer} style={{ ...miniBtn, width: "100%", marginTop: 12 }}>{L.addText}</button>
        </div>
      </div>

      <style>{`@media(max-width:980px){ .md-grid{grid-template-columns:1fr!important;} }`}</style>
    </div>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "10px 0 4px" }}>{children}</label>;
}
function Slider({ label, value, min, max, step, onChange, fixed, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fixed?: number; suffix?: string }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: "#ffd84e" }}>{fixed != null ? value.toFixed(fixed) : value}{suffix ?? ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "#ffd84e" }} />
    </div>
  );
}

function qrCopy(locale: string) {
  const en = locale === "en";
  return {
    qrTitle: en ? "Table QR Code" : "Masa QR Kodu",
    qrDesc: en ? "Place this on your tables; scanning opens your menu." : "Bunu masalara koy; okutunca menün açılır.",
    qrDownloadPng: en ? "Download PNG" : "PNG İndir",
    qrDownloadSvg: en ? "Download SVG" : "SVG İndir",
    qrCopyLink: en ? "Copy Link" : "Linki Kopyala",
    qrCopied: en ? "✓ Copied" : "✓ Kopyalandı",
    previewMenu: en ? "Preview Menu ↗" : "Menüyü Önizle ↗",
  };
}

const panel: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 };
const input: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f4efe6", fontSize: 13, marginBottom: 6, boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: 9, background: "#ffd84e", color: "#0a0a0c", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const miniBtn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const eyeBtn: React.CSSProperties = { width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.7)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, cursor: "pointer", flexShrink: 0, padding: 0 };
