"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Audience = "all" | "active30" | "dormant30" | "loyalty_silver" | "loyalty_gold" | "consented";

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "🌐 Tümü",
  active30: "✨ Aktif (30g)",
  dormant30: "😴 Uyuyan (30g+)",
  loyalty_silver: "🥈 Silver+ Üyeler",
  loyalty_gold: "🥇 Altın Üyeler",
  consented: "✅ Onaylı Pazarlama",
};

export type MenuItemView = { name: string; description: string; oldPrice: number | null; newPrice: number | null };
export type MenuView = {
  id: string;
  title: string;
  description: string;
  audience: Audience;
  active: boolean;
  validFrom: string;
  validTo: string;
  items: MenuItemView[];
};

function blankMenu(): MenuView {
  return {
    id: "", title: "", description: "", audience: "all", active: true,
    validFrom: "", validTo: "",
    items: [{ name: "", description: "", oldPrice: null, newPrice: null }],
  };
}

/**
 * Real visibility status — NOT just the `active` flag. A menu can be active
 * but invisible to customers because its date window is in the past/future.
 * The customer API (/api/play/menus) filters on exactly these dates, so the
 * dashboard must reflect the same truth or owners think a menu is live when
 * it isn't.
 */
type MenuStatus = { label: string; color: string };
function menuStatus(m: MenuView): MenuStatus {
  if (!m.active) return { label: "○ Taslak", color: "rgba(244,239,230,0.4)" };
  const today = new Date().toISOString().slice(0, 10);
  if (m.validTo && m.validTo < today) {
    return { label: "⛔ Süresi doldu", color: "#ff7e5a" };
  }
  if (m.validFrom && m.validFrom > today) {
    const d = new Date(m.validFrom).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    return { label: `🕓 ${d}'de başlar`, color: "#ffd84e" };
  }
  return { label: "● Yayında", color: "#8ef2a1" };
}

export function MenuClient({ slug, initialMenus }: { slug: string; initialMenus: MenuView[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MenuView | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function patch(p: Partial<MenuView>) {
    setEditing((m) => (m ? { ...m, ...p } : m));
  }
  function patchItem(idx: number, p: Partial<MenuItemView>) {
    setEditing((m) => {
      if (!m) return m;
      const items = m.items.map((it, i) => (i === idx ? { ...it, ...p } : it));
      return { ...m, items };
    });
  }
  function addItem() {
    setEditing((m) => (m ? { ...m, items: [...m.items, { name: "", description: "", oldPrice: null, newPrice: null }] } : m));
  }
  function removeItem(idx: number) {
    setEditing((m) => (m ? { ...m, items: m.items.filter((_, i) => i !== idx) } : m));
  }

  async function save() {
    if (!editing) return;
    if (!editing.title.trim()) { setMsg({ ok: false, text: "Menü başlığı gerekli." }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const payload = {
        slug,
        id: editing.id || undefined,
        title: editing.title,
        description: editing.description,
        audience: editing.audience,
        active: editing.active,
        validFrom: editing.validFrom || null,
        validTo: editing.validTo || null,
        items: editing.items
          .filter((it) => it.name.trim())
          .map((it) => ({
            name: it.name,
            description: it.description,
            oldPrice: it.oldPrice,
            newPrice: it.newPrice,
          })),
      };
      const res = await fetch("/api/dashboard/menus", {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Kaydedilemedi." });
      } else {
        setEditing(null);
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Bağlantı hatası." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu menü silinsin mi?")) return;
    try {
      const res = await fetch("/api/dashboard/menus", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, id }),
      });
      if (res.ok) router.refresh();
    } catch { /* silent */ }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {!editing && (
        <button onClick={() => { setEditing(blankMenu()); setMsg(null); }} style={primaryBtn}>
          + Yeni Menü Oluştur
        </button>
      )}

      {/* Editor */}
      {editing && (
        <div style={cardBox}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
            {editing.id ? "Menüyü Düzenle" : "Yeni Menü"}
          </div>

          <Label>Menü Başlığı</Label>
          <input value={editing.title} onChange={(e) => patch({ title: e.target.value })} placeholder="örn. Salı Akşamı Kampanyası" style={input} />

          <Label>Açıklama</Label>
          <input value={editing.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Kısa açıklama (opsiyonel)" style={input} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>Kime Görünsün</Label>
              <select value={editing.audience} onChange={(e) => patch({ audience: e.target.value as Audience })} style={input}>
                {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
                  <option key={a} value={a} style={{ background: "#1a1a1c" }}>{AUDIENCE_LABELS[a]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Durum</Label>
              <button onClick={() => patch({ active: !editing.active })} style={{ ...input, textAlign: "left", cursor: "pointer", color: editing.active ? "#8ef2a1" : "rgba(244,239,230,0.5)" }}>
                {editing.active ? "● Yayında" : "○ Taslak"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>Başlangıç (ops.)</Label>
              <input type="date" value={editing.validFrom} onChange={(e) => patch({ validFrom: e.target.value })} style={input} />
            </div>
            <div>
              <Label>Bitiş (ops.)</Label>
              <input type="date" value={editing.validTo} onChange={(e) => patch({ validTo: e.target.value })} style={input} />
              {editing.active && editing.validTo && editing.validTo < new Date().toISOString().slice(0, 10) && (
                <div style={{ fontSize: 11, color: "#ff7e5a", marginTop: 6, lineHeight: 1.4 }}>
                  ⚠ Bu tarih geçmişte — kaydedersen menü müşterilere görünmez. Boş bırak = süresiz.
                </div>
              )}
            </div>
          </div>

          <Label>Menü Ürünleri</Label>
          <div style={{ display: "grid", gap: 8 }}>
            {editing.items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 70px 70px 28px", gap: 6, alignItems: "center" }}>
                <input value={it.name} onChange={(e) => patchItem(i, { name: e.target.value })} placeholder="Ürün adı" style={inputSm} />
                <input value={it.description} onChange={(e) => patchItem(i, { description: e.target.value })} placeholder="Açıklama" style={inputSm} />
                <input type="number" value={it.oldPrice ?? ""} onChange={(e) => patchItem(i, { oldPrice: e.target.value ? Number(e.target.value) : null })} placeholder="Eski" style={inputSm} />
                <input type="number" value={it.newPrice ?? ""} onChange={(e) => patchItem(i, { newPrice: e.target.value ? Number(e.target.value) : null })} placeholder="Yeni" style={inputSm} />
                <button onClick={() => removeItem(i)} style={{ ...inputSm, cursor: "pointer", color: "#ff7e5a", textAlign: "center", padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={addItem} style={{ ...ghostBtn, marginTop: 8 }}>+ Ürün ekle</button>

          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, margin: "14px 0 0", fontSize: 13,
              background: msg.ok ? "rgba(142,242,161,0.1)" : "rgba(255,100,80,0.1)",
              border: `1px solid ${msg.ok ? "rgba(142,242,161,0.3)" : "rgba(255,100,80,0.3)"}`,
              color: msg.ok ? "#8ef2a1" : "#ff8060",
            }}>{msg.text}</div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={save} disabled={busy} style={{ ...primaryBtn, flex: 1, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button onClick={() => { setEditing(null); setMsg(null); }} style={ghostBtn}>Vazgeç</button>
          </div>
        </div>
      )}

      {/* Existing menus */}
      {!editing && (
        <>
          <h2 style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 800, color: "rgba(244,239,230,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Menüler ({initialMenus.length})
          </h2>
          {initialMenus.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 14, color: "rgba(244,239,230,0.4)", fontSize: 13 }}>
              Henüz menü yok. İlk özel menünü oluştur.
            </div>
          ) : (
            initialMenus.map((m) => {
              const status = menuStatus(m);
              const expired = m.active && !!m.validTo && m.validTo < new Date().toISOString().slice(0, 10);
              return (
              <div key={m.id} style={cardBox}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>
                      {m.title}{" "}
                      <span style={{ fontSize: 11, fontWeight: 600, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", marginTop: 3 }}>
                      {AUDIENCE_LABELS[m.audience]} · {m.items.length} ürün
                      {m.validTo && <> · bitiş {new Date(m.validTo).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</>}
                    </div>
                    {expired && (
                      <div style={{ fontSize: 11, color: "#ff7e5a", marginTop: 6, lineHeight: 1.4 }}>
                        Bu menü müşterilere görünmüyor — bitiş tarihi geçti. Düzenleyip tarihi uzat.
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => { setEditing(m); setMsg(null); }} style={ghostBtn}>Düzenle</button>
                    <button onClick={() => remove(m.id)} style={{ ...ghostBtn, color: "#ff7e5a" }}>Sil</button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "12px 0 6px" }}>{children}</div>;
}

const cardBox: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#f4efe6", fontSize: 13, outline: "none" };
const inputSm: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "#f4efe6", fontSize: 12, outline: "none" };
const primaryBtn: React.CSSProperties = { padding: "13px 20px", borderRadius: 12, border: "none", background: "#ffd84e", color: "#1a1208", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(244,239,230,0.8)", fontSize: 13, fontWeight: 700, cursor: "pointer" };
