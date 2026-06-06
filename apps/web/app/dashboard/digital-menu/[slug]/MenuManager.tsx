"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { getClientLocale } from "../../../../lib/i18n/client";
import type { DigitalMenu, MenuLanding } from "../../../../lib/supabase/types";
import { MenuQR } from "./MenuQR";

function T(en: boolean) {
  return {
    title: en ? "QR Menu Management" : "QR Menü Yönetimi",
    desc: en ? "Create menus and design your entry page. Each menu becomes a button on the entry page." : "Menüleri oluştur ve giriş sayfanı tasarla. Her menü, giriş sayfasında bir buton olur.",
    tabMenus: en ? "Menus" : "Menüler",
    tabLanding: en ? "Entry Page" : "Giriş Sayfası",
    newMenuPh: en ? "New menu name (e.g. Drinks)" : "Yeni menü adı (örn. İçecekler)",
    add: en ? "+ Add Menu" : "+ Menü Ekle",
    edit: en ? "Edit" : "Düzenle",
    del: en ? "Delete" : "Sil",
    show: en ? "Show" : "Göster",
    hide: en ? "Hide" : "Gizle",
    noMenus: en ? "No menus yet. Add your first one." : "Henüz menü yok. İlkini ekle.",
    confirmDel: en ? "Delete this menu?" : "Bu menü silinsin mi?",
    nameReq: en ? "Menu name required." : "Menü adı gerekli.",
    saveErr: en ? "Could not save." : "Kaydedilemedi.",
    notReady: en ? "no design yet" : "tasarım yok",
    ready: en ? "designed" : "tasarlı",
    background: en ? "Entry background" : "Giriş arka planı",
    logo: en ? "Logo" : "Logo",
    upload: en ? "Upload" : "Yükle",
    uploading: en ? "Uploading…" : "Yükleniyor…",
    remove: en ? "Remove" : "Kaldır",
    headline: en ? "Headline (optional)" : "Başlık (opsiyonel)",
    showPlay: en ? "Show campaign / game button" : "Kampanya / oyun butonu göster",
    playLabel: en ? "Campaign button label" : "Kampanya buton etiketi",
    saveLanding: en ? "Save Entry Page" : "Giriş Sayfasını Kaydet",
    saved: en ? "✓ Saved" : "✓ Kaydedildi",
    saving: en ? "Saving…" : "Kaydediliyor…",
    qrTitle: en ? "Entry Page QR" : "Giriş Sayfası QR",
    qrDesc: en ? "Place on tables; scanning opens your entry page." : "Masalara koy; okutunca giriş sayfan açılır.",
    qrDownloadPng: en ? "Download PNG" : "PNG İndir",
    qrDownloadSvg: en ? "Download SVG" : "SVG İndir",
    qrCopyLink: en ? "Copy Link" : "Linki Kopyala",
    qrCopied: en ? "✓ Copied" : "✓ Kopyalandı",
    previewMenu: en ? "Preview ↗" : "Önizle ↗",
  };
}

export function MenuManager({ slug, initialMenus, initialLanding }: { slug: string; initialMenus: DigitalMenu[]; initialLanding: MenuLanding }) {
  const L = T(getClientLocale() === "en");
  const [tab, setTab] = useState<"menus" | "landing">("menus");
  const [menus, setMenus] = useState<DigitalMenu[]>(initialMenus);
  const [landing, setLanding] = useState<MenuLanding>(initialLanding ?? {});
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [up, setUp] = useState<"" | "bg" | "logo">("");
  const bgRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const api = async (method: string, body: Record<string, unknown>) => {
    const res = await fetch("/api/dashboard/qr-menus", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, ...body }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || L.saveErr);
    return j;
  };

  const addMenu = async () => {
    if (!newName.trim()) { setMsg(L.nameReq); return; }
    setBusy(true); setMsg("");
    try { const j = await api("POST", { title: newName.trim() }); setMenus((m) => [...m, j.menu]); setNewName(""); }
    catch (e) { setMsg(e instanceof Error ? e.message : L.saveErr); } finally { setBusy(false); }
  };
  const toggleActive = async (m: DigitalMenu) => {
    const next = !m.active;
    setMenus((ms) => ms.map((x) => (x.id === m.id ? { ...x, active: next } : x)));
    try { await api("PUT", { kind: "menu", id: m.id, active: next }); } catch { setMenus((ms) => ms.map((x) => (x.id === m.id ? { ...x, active: !next } : x))); }
  };
  const del = async (m: DigitalMenu) => {
    if (!confirm(L.confirmDel)) return;
    setBusy(true);
    try { await api("DELETE", { id: m.id }); setMenus((ms) => ms.filter((x) => x.id !== m.id)); }
    catch (e) { setMsg(e instanceof Error ? e.message : L.saveErr); } finally { setBusy(false); }
  };
  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir; if (j < 0 || j >= menus.length) return;
    const list = [...menus]; [list[idx], list[j]] = [list[j], list[idx]]; setMenus(list);
    try { await Promise.all(list.map((m, i) => api("PUT", { kind: "menu", id: m.id, sortOrder: i }))); } catch { /* optimistic */ }
  };

  const uploadImg = async (which: "bg" | "logo", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUp(which); setMsg("");
    try {
      const fd = new FormData(); fd.append("slug", slug); fd.append("file", file);
      const res = await fetch("/api/dashboard/digital-menu/upload", { method: "POST", body: fd });
      const j = await res.json(); if (!res.ok) throw new Error(j.error);
      setLanding((l) => ({ ...l, [which === "bg" ? "bgUrl" : "logoUrl"]: j.url }));
    } catch { setMsg(L.saveErr); } finally { setUp(""); if (which === "bg" && bgRef.current) bgRef.current.value = ""; if (which === "logo" && logoRef.current) logoRef.current.value = ""; }
  };

  const saveLanding = async () => {
    setBusy(true); setMsg("");
    try { await api("PUT", { kind: "landing", landing }); setMsg(L.saved); setTimeout(() => setMsg(""), 2000); }
    catch (e) { setMsg(e instanceof Error ? e.message : L.saveErr); } finally { setBusy(false); }
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>{L.title}</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.5 }}>{L.desc}</p>

      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: 4, width: "fit-content", marginBottom: 20 }}>
        {(["menus", "landing"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: tab === t ? "#ffd84e" : "transparent", color: tab === t ? "#0a0a0c" : "rgba(244,239,230,0.6)" }}>{t === "menus" ? L.tabMenus : L.tabLanding}</button>
        ))}
      </div>

      {msg && <div style={{ marginBottom: 14, fontSize: 13, color: msg.startsWith("✓") ? "#7be08a" : "#ff9b9b" }}>{msg}</div>}

      {tab === "menus" ? (
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addMenu(); }} placeholder={L.newMenuPh} style={input} />
            <button onClick={addMenu} disabled={busy} style={btnPrimary}>{L.add}</button>
          </div>
          {menus.length === 0 && <p style={{ color: "rgba(244,239,230,0.4)", fontSize: 14 }}>{L.noMenus}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {menus.map((m, i) => {
              const ready = !!m.design?.bgUrl;
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", opacity: m.active ? 1 : 0.55 }}>
                  <span style={{ fontSize: 18 }}>{m.icon || "📋"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{m.title}</div>
                    <div style={{ fontSize: 11.5, color: ready ? "#7be08a" : "rgba(244,239,230,0.4)" }}>{ready ? L.ready : L.notReady}</div>
                  </div>
                  <button onClick={() => move(i, -1)} disabled={i === 0} style={iconBtn}>↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === menus.length - 1} style={iconBtn}>↓</button>
                  <button title={m.active ? L.hide : L.show} onClick={() => toggleActive(m)} style={iconBtn}>{m.active ? "👁" : "🚫"}</button>
                  <Link href={`/dashboard/digital-menu/${slug}?menu=${m.id}`} style={btnSmallGold}>{L.edit}</Link>
                  <button onClick={() => del(m)} style={btnSmallDanger}>{L.del}</button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="ml-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 24, alignItems: "start" }}>
          <div style={{ maxWidth: 520 }}>
            <Lbl>{L.background}</Lbl>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {landing.bgUrl && <img src={landing.bgUrl} alt="" style={{ width: 80, height: 56, borderRadius: 8, objectFit: "cover" }} />}
              <input ref={bgRef} type="file" accept="image/*" onChange={(e) => uploadImg("bg", e)} style={{ display: "none" }} />
              <button onClick={() => bgRef.current?.click()} disabled={up === "bg"} style={miniBtn}>{up === "bg" ? L.uploading : L.upload}</button>
              {landing.bgUrl && <button onClick={() => setLanding((l) => ({ ...l, bgUrl: "" }))} style={btnSmallDanger}>{L.remove}</button>}
            </div>

            <Lbl>{L.logo}</Lbl>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {landing.logoUrl && <img src={landing.logoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "contain", background: "rgba(255,255,255,0.05)" }} />}
              <input ref={logoRef} type="file" accept="image/*" onChange={(e) => uploadImg("logo", e)} style={{ display: "none" }} />
              <button onClick={() => logoRef.current?.click()} disabled={up === "logo"} style={miniBtn}>{up === "logo" ? L.uploading : L.upload}</button>
              {landing.logoUrl && <button onClick={() => setLanding((l) => ({ ...l, logoUrl: "" }))} style={btnSmallDanger}>{L.remove}</button>}
            </div>

            <Lbl>{L.headline}</Lbl>
            <input value={landing.headline ?? ""} onChange={(e) => setLanding((l) => ({ ...l, headline: e.target.value }))} style={input} />

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(244,239,230,0.85)", margin: "12px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={!!landing.showPlay} onChange={(e) => setLanding((l) => ({ ...l, showPlay: e.target.checked }))} />{L.showPlay}
            </label>
            {landing.showPlay && (<><Lbl>{L.playLabel}</Lbl><input value={landing.playLabel ?? ""} onChange={(e) => setLanding((l) => ({ ...l, playLabel: e.target.value }))} placeholder={getClientLocale() === "en" ? "Win a reward 🎁" : "Ödül kazan 🎁"} style={input} /></>)}

            <button onClick={saveLanding} disabled={busy} style={{ ...btnPrimary, marginTop: 14 }}>{busy ? L.saving : `💾 ${L.saveLanding}`}</button>
          </div>

          <div>
            <MenuQR slug={slug} copy={L} />
          </div>
        </div>
      )}

      <style>{`@media(max-width:820px){ .ml-grid{grid-template-columns:1fr!important;} }`}</style>
    </div>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "10px 0 5px" }}>{children}</label>;
}

const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f4efe6", fontSize: 14, boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: 9, background: "#ffd84e", color: "#0a0a0c", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const miniBtn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnSmallGold: React.CSSProperties = { padding: "7px 14px", borderRadius: 8, background: "#ffd84e", color: "#0a0a0c", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" };
const btnSmallDanger: React.CSSProperties = { padding: "7px 12px", borderRadius: 8, background: "rgba(255,80,80,0.1)", color: "#ff9b9b", border: "1px solid rgba(255,80,80,0.25)", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const iconBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.7)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, cursor: "pointer", flexShrink: 0 };
