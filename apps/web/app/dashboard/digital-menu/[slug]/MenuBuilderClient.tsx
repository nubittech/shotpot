"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getClientCopy } from "../../../../lib/i18n/client";
import { MenuQR } from "./MenuQR";

export type CategoryView = { id: string; name: string; nameEn: string; active: boolean };
export type ItemView = {
  id: string;
  categoryId: string | null;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number | null;
  imageUrl: string;
  tags: string[];
  isAvailable: boolean;
  active: boolean;
};

const ALL_TAGS = ["vegan", "vegetarian", "spicy", "glutenfree", "new", "popular"] as const;
const CUR: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };
const keyc = (c: string | null) => c ?? "__none__";

type Draft = Omit<ItemView, "id"> & { id?: string };
type Copy = ReturnType<typeof getClientCopy>["dashboardPages"]["digitalMenu"];

export function MenuBuilderClient({ slug, currency, initialCategories, initialItems }: {
  slug: string;
  currency: string;
  initialCategories: CategoryView[];
  initialItems: ItemView[];
}) {
  const copy = getClientCopy().dashboardPages.digitalMenu;
  const sym = CUR[currency] ?? "";

  const [categories, setCategories] = useState<CategoryView[]>(initialCategories);
  const [items, setItems] = useState<ItemView[]>(initialItems);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);

  const catDrag = useRef<number | null>(null);
  const itemDrag = useRef<{ catId: string | null; index: number } | null>(null);

  const api = async (method: "POST" | "PUT" | "DELETE", body: Record<string, unknown>) => {
    const res = await fetch("/api/dashboard/digital-menu", {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...body }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || copy.saveError);
    return json as { id?: string };
  };

  const itemsOf = (catId: string | null) => items.filter((i) => keyc(i.categoryId) === keyc(catId));

  // ---- categories ----
  const addCategory = async () => {
    if (!newCat.trim()) { setError(copy.categoryNameRequired); return; }
    setBusy(true); setError("");
    try {
      const { id } = await api("POST", { kind: "category", name: newCat.trim() });
      setCategories((c) => [...c, { id: id!, name: newCat.trim(), nameEn: "", active: true }]);
      setNewCat("");
    } catch (e) { setError(e instanceof Error ? e.message : copy.connectionError); }
    finally { setBusy(false); }
  };

  const renameCategory = async (cat: CategoryView, nameRaw: string, nameEnRaw: string) => {
    const name = nameRaw.trim(); const nameEn = nameEnRaw.trim();
    if (!name) { setError(copy.categoryNameRequired); return; }
    setBusy(true); setError("");
    try {
      await api("PUT", { kind: "category", id: cat.id, name, nameEn });
      setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, name, nameEn } : c)));
    } catch (e) { setError(e instanceof Error ? e.message : copy.connectionError); }
    finally { setBusy(false); }
  };

  const deleteCategory = async (cat: CategoryView) => {
    if (!confirm(copy.confirmDeleteCategory)) return;
    setBusy(true); setError("");
    try {
      await api("DELETE", { kind: "category", id: cat.id });
      setCategories((cs) => cs.filter((c) => c.id !== cat.id));
      setItems((is) => is.filter((i) => i.categoryId !== cat.id));
    } catch (e) { setError(e instanceof Error ? e.message : copy.connectionError); }
    finally { setBusy(false); }
  };

  const toggleCategoryActive = async (cat: CategoryView) => {
    const next = !cat.active;
    setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, active: next } : c)));
    try { await api("PUT", { kind: "category", id: cat.id, active: next }); }
    catch { setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, active: !next } : c))); }
  };

  const persistCatOrder = async (list: CategoryView[]) => {
    setCategories(list);
    try { await Promise.all(list.map((c, i) => api("PUT", { kind: "category", id: c.id, sortOrder: i }))); }
    catch { /* optimistic */ }
  };
  const moveCategory = (from: number, to: number) => {
    if (to < 0 || to >= categories.length || from === to) return;
    const list = [...categories]; const [m] = list.splice(from, 1); list.splice(to, 0, m);
    persistCatOrder(list);
  };

  // ---- items ----
  const blankDraft = (categoryId: string | null): Draft => ({
    categoryId, name: "", nameEn: "", description: "", descriptionEn: "",
    price: null, imageUrl: "", tags: [], isAvailable: true, active: true,
  });

  const saveItem = async (d: Draft) => {
    if (!d.name.trim()) { setError(copy.nameRequired); return; }
    setBusy(true); setError("");
    const payload = {
      kind: "item" as const, categoryId: d.categoryId, name: d.name.trim(), nameEn: d.nameEn,
      description: d.description, descriptionEn: d.descriptionEn, price: d.price,
      imageUrl: d.imageUrl, tags: d.tags, isAvailable: d.isAvailable, active: d.active,
    };
    try {
      if (d.id) {
        await api("PUT", { id: d.id, ...payload });
        setItems((is) => is.map((i) => (i.id === d.id ? { ...d, id: d.id! } as ItemView : i)));
      } else {
        const { id } = await api("POST", payload);
        setItems((is) => [...is, { ...d, id: id! } as ItemView]);
      }
      setEditing(null);
    } catch (e) { setError(e instanceof Error ? e.message : copy.connectionError); }
    finally { setBusy(false); }
  };

  const deleteItem = async (item: ItemView) => {
    if (!confirm(copy.confirmDeleteItem)) return;
    setBusy(true); setError("");
    try {
      await api("DELETE", { kind: "item", id: item.id });
      setItems((is) => is.filter((i) => i.id !== item.id));
    } catch (e) { setError(e instanceof Error ? e.message : copy.connectionError); }
    finally { setBusy(false); }
  };

  const toggleAvailable = async (item: ItemView) => {
    const next = !item.isAvailable;
    setItems((is) => is.map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)));
    try { await api("PUT", { kind: "item", id: item.id, isAvailable: next }); }
    catch { setItems((is) => is.map((i) => (i.id === item.id ? { ...i, isAvailable: !next } : i))); }
  };

  const toggleItemActive = async (item: ItemView) => {
    const next = !item.active;
    setItems((is) => is.map((i) => (i.id === item.id ? { ...i, active: next } : i)));
    try { await api("PUT", { kind: "item", id: item.id, active: next }); }
    catch { setItems((is) => is.map((i) => (i.id === item.id ? { ...i, active: !next } : i))); }
  };

  const reorderItems = (catId: string | null, from: number, to: number) => {
    if (from === to) return;
    const sub = itemsOf(catId);
    if (to < 0 || to >= sub.length) return;
    const ns = [...sub]; const [m] = ns.splice(from, 1); ns.splice(to, 0, m);
    setItems((prev) => { let k = 0; return prev.map((i) => (keyc(i.categoryId) === keyc(catId) ? ns[k++] : i)); });
    Promise.all(ns.map((it, i) => api("PUT", { kind: "item", id: it.id, sortOrder: i }))).catch(() => {});
  };

  const uncategorized = items.filter((i) => !i.categoryId || !categories.some((c) => c.id === i.categoryId));

  /* ---- render a single item row ---- */
  const ItemRow = (it: ItemView, catId: string | null, idx: number) => (
    <div
      key={it.id}
      draggable
      onDragStart={() => { itemDrag.current = { catId, index: idx }; }}
      onDragOver={(e) => { if (itemDrag.current && keyc(itemDrag.current.catId) === keyc(catId)) e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); const d = itemDrag.current; itemDrag.current = null; if (d && keyc(d.catId) === keyc(catId)) reorderItems(catId, d.index, idx); }}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: it.active ? (it.isAvailable ? 1 : 0.6) : 0.4 }}
    >
      <span title={copy.dragHint} style={{ cursor: "grab", color: "rgba(244,239,230,0.3)", fontSize: 14, flexShrink: 0 }}>⠿</span>
      {it.imageUrl
        ? <img src={it.imageUrl} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
        : <div style={{ width: 42, height: 42, borderRadius: 8, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {it.name}
          {!it.active && <span style={{ ...tagChip, background: "rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.5)" }}>{copy.hiddenLabel}</span>}
          {it.tags.map((t) => <span key={t} style={tagChip}>{tagLabel(t, copy)}</span>)}
          {!it.isAvailable && <span style={{ ...tagChip, background: "rgba(255,80,80,0.15)", color: "#ff9b9b" }}>{copy.unavailable}</span>}
        </div>
        {it.description && <div style={{ fontSize: 12, color: "rgba(244,239,230,0.45)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.description}</div>}
      </div>
      {it.price != null && <span style={{ fontSize: 14, fontWeight: 700, color: "#ffd84e", flexShrink: 0 }}>{sym}{it.price}</span>}
      <button onClick={() => toggleAvailable(it)} title={it.isAvailable ? copy.available : copy.unavailable} style={iconBtn}>{it.isAvailable ? "✓" : "✗"}</button>
      <button onClick={() => toggleItemActive(it)} title={it.active ? copy.hide : copy.show} style={iconBtn}>{it.active ? "👁" : "🚫"}</button>
      <button onClick={() => setEditing({ ...it })} style={btnSmallGhost}>{copy.edit}</button>
      <button onClick={() => deleteItem(it)} style={btnSmallDanger}>{copy.delete}</button>
    </div>
  );

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>{copy.title}</h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.5 }}>{copy.desc}</p>

      <MenuQR slug={slug} copy={copy} />

      {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff9b9b", fontSize: 13 }}>{error}</div>}

      <div className="dm-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 24, alignItems: "start" }}>
        {/* ── Editor ── */}
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }} placeholder={copy.newCategory} style={input} />
            <button onClick={addCategory} disabled={busy} style={btnPrimary}>{copy.addCategory}</button>
          </div>

          {categories.length === 0 && uncategorized.length === 0 && (
            <p style={{ color: "rgba(244,239,230,0.4)", fontSize: 14 }}>{copy.noCategories}</p>
          )}

          {categories.map((cat, idx) => (
            <CategoryBlock
              key={cat.id} cat={cat} idx={idx} total={categories.length}
              itemsCount={itemsOf(cat.id).length} copy={copy}
              onRename={renameCategory} onDelete={deleteCategory} onMove={moveCategory}
              onToggleActive={toggleCategoryActive} onAddItem={() => setEditing(blankDraft(cat.id))}
              catDrag={catDrag}
            >
              {itemsOf(cat.id).length === 0
                ? <p style={{ fontSize: 13, color: "rgba(244,239,230,0.35)", margin: "6px 0 12px" }}>{copy.categoryEmpty}</p>
                : itemsOf(cat.id).map((it, i) => ItemRow(it, cat.id, i))}
              <button onClick={() => setEditing(blankDraft(cat.id))} style={{ ...btnSmallGhost, marginTop: 6 }}>{copy.addItem}</button>
            </CategoryBlock>
          ))}

          {uncategorized.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "rgba(244,239,230,0.6)", margin: "0 0 10px" }}>{copy.uncategorized}</h3>
              {uncategorized.map((it, i) => ItemRow(it, null, i))}
            </div>
          )}
        </div>

        {/* ── Live preview ── */}
        <aside className="dm-preview" style={{ position: "sticky", top: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(244,239,230,0.45)", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>{copy.livePreview}</div>
          <LivePreview categories={categories} items={items} sym={sym} copy={copy} />
        </aside>
      </div>

      {editing && createPortal(
        <ItemEditor
          slug={slug} draft={editing} sym={sym} copy={copy} busy={busy}
          categories={categories}
          onChange={setEditing} onSave={() => saveItem(editing)}
          onCancel={() => { setEditing(null); setError(""); }}
        />, document.body)}

      <style>{`@media(max-width:880px){ .dm-grid{grid-template-columns:1fr!important;} .dm-preview{position:static!important;} }`}</style>
    </div>
  );
}

/* ---------------- Category block ---------------- */
function CategoryBlock({ cat, idx, total, itemsCount, copy, onRename, onDelete, onMove, onToggleActive, onAddItem, catDrag, children }: {
  cat: CategoryView; idx: number; total: number; itemsCount: number; copy: Copy;
  onRename: (c: CategoryView, name: string, nameEn: string) => void;
  onDelete: (c: CategoryView) => void;
  onMove: (from: number, to: number) => void;
  onToggleActive: (c: CategoryView) => void;
  onAddItem: () => void;
  catDrag: React.MutableRefObject<number | null>;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [nameEn, setNameEn] = useState(cat.nameEn);

  return (
    <section
      onDragOver={(e) => { if (catDrag.current !== null) e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); const from = catDrag.current; catDrag.current = null; if (from !== null) onMove(from, idx); }}
      style={{ marginBottom: 18, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", opacity: cat.active ? 1 : 0.55 }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "rgba(255,255,255,0.03)" }}>
        {editing ? (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, padding: "6px 10px", fontSize: 14, marginBottom: 0 }} />
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder={copy.categoryNameEn} style={{ ...input, padding: "6px 10px", fontSize: 13, marginBottom: 0 }} />
            <button onClick={() => { onRename(cat, name, nameEn); setEditing(false); }} style={btnSmall}>{copy.save}</button>
            <button onClick={() => { setName(cat.name); setNameEn(cat.nameEn); setEditing(false); }} style={btnSmallGhost}>{copy.cancel}</button>
          </>
        ) : (
          <>
            <span
              draggable
              onDragStart={() => { catDrag.current = idx; }}
              title={copy.dragHint}
              style={{ cursor: "grab", color: "rgba(244,239,230,0.3)", fontSize: 15 }}
            >⠿</span>
            <strong style={{ fontSize: 15 }}>{cat.name}</strong>
            {cat.nameEn && <span style={{ fontSize: 12, color: "rgba(244,239,230,0.4)" }}>/ {cat.nameEn}</span>}
            {!cat.active && <span style={{ ...tagChip, background: "rgba(255,255,255,0.08)", color: "rgba(244,239,230,0.5)" }}>{copy.hiddenLabel}</span>}
            <span style={{ fontSize: 12, color: "rgba(244,239,230,0.35)" }}>· {copy.itemCount.replace("{n}", String(itemsCount))}</span>
            <div style={{ flex: 1 }} />
            <button title={copy.moveUp} onClick={() => onMove(idx, idx - 1)} disabled={idx === 0} style={iconBtn}>↑</button>
            <button title={copy.moveDown} onClick={() => onMove(idx, idx + 1)} disabled={idx === total - 1} style={iconBtn}>↓</button>
            <button title={cat.active ? copy.hide : copy.show} onClick={() => onToggleActive(cat)} style={iconBtn}>{cat.active ? "👁" : "🚫"}</button>
            <button onClick={() => setEditing(true)} style={btnSmallGhost}>{copy.edit}</button>
            <button onClick={() => onDelete(cat)} style={btnSmallDanger}>{copy.delete}</button>
          </>
        )}
      </header>
      <div style={{ padding: "10px 14px" }}>{children}</div>
    </section>
  );
}

/* ---------------- Live preview (phone) ---------------- */
function LivePreview({ categories, items, sym, copy }: { categories: CategoryView[]; items: ItemView[]; sym: string; copy: Copy }) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const cats = categories.filter((c) => c.active);
  const itemsFor = (cid: string) => items.filter((i) => i.categoryId === cid && i.active);
  const nameOf = (n: string, en: string) => (lang === "en" && en ? en : n);
  const visibleCats = cats.filter((c) => itemsFor(c.id).length > 0);

  return (
    <div style={{ width: "100%", maxWidth: 320, margin: "0 auto", background: "#0a0a0c", border: "9px solid #1c1c20", borderRadius: 34, boxShadow: "0 20px 50px -18px rgba(0,0,0,0.8)", overflow: "hidden" }}>
      <div style={{ height: 22, background: "#1c1c20", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 80, height: 14, background: "#0a0a0c", borderRadius: "0 0 10px 10px" }} />
      </div>
      <div style={{ padding: "14px 14px 22px", maxHeight: 520, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <div style={{ display: "flex", borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", fontSize: 10, fontWeight: 800 }}>
            {(["tr", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: "3px 9px", border: "none", cursor: "pointer", background: lang === l ? "#ffd84e" : "transparent", color: lang === l ? "#0a0a0c" : "rgba(244,239,230,0.6)" }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {visibleCats.length === 0 && <p style={{ fontSize: 12, color: "rgba(244,239,230,0.35)", textAlign: "center", padding: "30px 0" }}>{copy.previewEmpty}</p>}
        {visibleCats.map((c) => (
          <div key={c.id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f4efe6", paddingBottom: 5, borderBottom: "2px solid rgba(255,216,78,0.3)", marginBottom: 8 }}>{nameOf(c.name, c.nameEn)}</div>
            {itemsFor(c.id).map((it) => (
              <div key={it.id} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: it.isAvailable ? 1 : 0.5 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {it.imageUrl && <img src={it.imageUrl} alt="" style={{ width: 38, height: 38, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "baseline" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#f4efe6" }}>{nameOf(it.name, it.nameEn)}</span>
                      {it.price != null && <span style={{ fontSize: 12.5, fontWeight: 800, color: "#ffd84e", whiteSpace: "nowrap" }}>{sym}{it.price}</span>}
                    </div>
                    {(lang === "en" && it.descriptionEn ? it.descriptionEn : it.description) && (
                      <div style={{ fontSize: 10.5, color: "rgba(244,239,230,0.5)", marginTop: 1, lineHeight: 1.35 }}>{lang === "en" && it.descriptionEn ? it.descriptionEn : it.description}</div>
                    )}
                    <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                      {!it.isAvailable && <span style={{ ...tagChip, fontSize: 8, background: "rgba(255,80,80,0.15)", color: "#ff9b9b" }}>{copy.unavailable}</span>}
                      {it.tags.map((t) => <span key={t} style={{ ...tagChip, fontSize: 8 }}>{tagLabel(t, copy)}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Item editor (modal, portaled) ---------------- */
function ItemEditor({ slug, draft, sym, copy, busy, categories, onChange, onSave, onCancel }: {
  slug: string; draft: Draft; sym: string; copy: Copy; busy: boolean;
  categories: CategoryView[];
  onChange: (d: Draft) => void; onSave: () => void; onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState("");
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const toggleTag = (t: string) => set({ tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setImgErr(copy.imageTooLarge); if (fileRef.current) fileRef.current.value = ""; return; }
    setUploading(true); setImgErr("");
    try {
      const fd = new FormData(); fd.append("slug", slug); fd.append("file", file);
      const res = await fetch("/api/dashboard/digital-menu/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || copy.imageError);
      set({ imageUrl: json.url });
    } catch { setImgErr(copy.imageError); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 1000, overflowY: "auto", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#141416", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, color: "#f4efe6" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800 }}>{draft.id ? copy.editItem : copy.newItem}</h3>

        <label style={lbl}>{copy.itemName}</label>
        <input value={draft.name} onChange={(e) => set({ name: e.target.value })} style={input} autoFocus />

        <label style={lbl}>{copy.itemNameEn}</label>
        <input value={draft.nameEn} onChange={(e) => set({ nameEn: e.target.value })} style={input} />

        <label style={lbl}>{copy.categoryOf}</label>
        <select value={draft.categoryId ?? ""} onChange={(e) => set({ categoryId: e.target.value || null })} style={{ ...input, cursor: "pointer" }}>
          <option value="">{copy.uncategorized}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={lbl}>{copy.itemDesc}</label>
        <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={2} style={{ ...input, resize: "vertical" }} />

        <label style={lbl}>{copy.itemDescEn}</label>
        <textarea value={draft.descriptionEn} onChange={(e) => set({ descriptionEn: e.target.value })} rows={2} style={{ ...input, resize: "vertical" }} />

        <label style={lbl}>{copy.price} {sym && `(${sym})`}</label>
        <input type="number" inputMode="decimal" value={draft.price ?? ""} onChange={(e) => set({ price: e.target.value === "" ? null : Number(e.target.value) })} placeholder={copy.pricePlaceholder} style={input} />

        <label style={lbl}>{copy.image}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          {draft.imageUrl && <img src={draft.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={btnSmallGhost}>{uploading ? copy.uploading : copy.uploadImage}</button>
          {draft.imageUrl && <button onClick={() => set({ imageUrl: "" })} style={btnSmallDanger}>{copy.removeImage}</button>}
        </div>
        {imgErr && <div style={{ fontSize: 12, color: "#ff9b9b", marginBottom: 6 }}>{imgErr}</div>}

        <label style={lbl}>{copy.tags}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {ALL_TAGS.map((t) => (
            <button key={t} onClick={() => toggleTag(t)} style={{ ...tagChip, cursor: "pointer", background: draft.tags.includes(t) ? "rgba(255,216,78,0.2)" : "rgba(255,255,255,0.05)", color: draft.tags.includes(t) ? "#ffd84e" : "rgba(244,239,230,0.6)", border: draft.tags.includes(t) ? "1px solid rgba(255,216,78,0.4)" : "1px solid rgba(255,255,255,0.1)" }}>{tagLabel(t, copy)}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(244,239,230,0.8)", cursor: "pointer" }}>
            <input type="checkbox" checked={draft.isAvailable} onChange={(e) => set({ isAvailable: e.target.checked })} />{copy.available}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(244,239,230,0.8)", cursor: "pointer" }}>
            <input type="checkbox" checked={draft.active} onChange={(e) => set({ active: e.target.checked })} />{copy.show}
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnGhost}>{copy.cancel}</button>
          <button onClick={onSave} disabled={busy || uploading} style={btnPrimary}>{busy ? copy.saving : copy.save}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- shared ---------------- */
function tagLabel(t: string, copy: Copy): string {
  switch (t) {
    case "vegan": return copy.tagVegan;
    case "vegetarian": return copy.tagVegetarian;
    case "spicy": return copy.tagSpicy;
    case "glutenfree": return copy.tagGlutenfree;
    case "new": return copy.tagNew;
    case "popular": return copy.tagPopular;
    default: return t;
  }
}

const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f4efe6", fontSize: 14, marginBottom: 8, boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "rgba(244,239,230,0.55)", margin: "8px 0 4px" };
const btnPrimary: React.CSSProperties = { padding: "10px 16px", borderRadius: 9, background: "#ffd84e", color: "#0a0a0c", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
const btnGhost: React.CSSProperties = { padding: "10px 16px", borderRadius: 9, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnSmall: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "#ffd84e", color: "#0a0a0c", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const btnSmallGhost: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.75)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnSmallDanger: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "rgba(255,80,80,0.1)", color: "#ff9b9b", border: "1px solid rgba(255,80,80,0.25)", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const iconBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.7)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, cursor: "pointer", flexShrink: 0 };
const tagChip: React.CSSProperties = { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "rgba(244,239,230,0.6)", textTransform: "uppercase", letterSpacing: "0.04em" };
