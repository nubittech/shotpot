"use client";

import { useRef, useState } from "react";
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
};

const ALL_TAGS = ["vegan", "vegetarian", "spicy", "glutenfree", "new", "popular"] as const;
const CUR: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

type Draft = Omit<ItemView, "id"> & { id?: string };

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

  const api = async (method: "POST" | "PUT" | "DELETE", body: Record<string, unknown>) => {
    const res = await fetch("/api/dashboard/digital-menu", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...body }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || copy.saveError);
    return json as { id?: string };
  };

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

  const renameCategory = async (cat: CategoryView, name: string, nameEn: string) => {
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

  const moveCategory = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= categories.length) return;
    const reordered = [...categories];
    [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
    setCategories(reordered);
    try {
      await Promise.all(reordered.map((c, i) => api("PUT", { kind: "category", id: c.id, sortOrder: i })));
    } catch { /* optimistic */ }
  };

  // ---- items ----
  const blankDraft = (categoryId: string): Draft => ({
    categoryId, name: "", nameEn: "", description: "", descriptionEn: "",
    price: null, imageUrl: "", tags: [], isAvailable: true,
  });

  const saveItem = async (d: Draft) => {
    if (!d.name.trim()) { setError(copy.nameRequired); return; }
    setBusy(true); setError("");
    const payload = {
      kind: "item" as const,
      categoryId: d.categoryId,
      name: d.name.trim(),
      nameEn: d.nameEn,
      description: d.description,
      descriptionEn: d.descriptionEn,
      price: d.price,
      imageUrl: d.imageUrl,
      tags: d.tags,
      isAvailable: d.isAvailable,
    };
    try {
      if (d.id) {
        await api("PUT", { id: d.id, ...payload });
        setItems((is) => is.map((i) => (i.id === d.id ? { ...(d as ItemView) } : i)));
      } else {
        const { id } = await api("POST", payload);
        setItems((is) => [...is, { ...(d as ItemView), id: id! }]);
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

  const uncategorized = items.filter((i) => !i.categoryId || !categories.some((c) => c.id === i.categoryId));

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>{copy.title}</h1>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.5 }}>{copy.desc}</p>

      <MenuQR slug={slug} copy={copy} />

      {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff9b9b", fontSize: 13 }}>{error}</div>}

      {/* add category */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
          placeholder={copy.newCategory}
          style={input}
        />
        <button onClick={addCategory} disabled={busy} style={btnPrimary}>{copy.addCategory}</button>
      </div>

      {categories.length === 0 && uncategorized.length === 0 && (
        <p style={{ color: "rgba(244,239,230,0.4)", fontSize: 14 }}>{copy.noCategories}</p>
      )}

      {categories.map((cat, idx) => (
        <CategoryBlock
          key={cat.id}
          cat={cat}
          idx={idx}
          total={categories.length}
          items={items.filter((i) => i.categoryId === cat.id)}
          sym={sym}
          copy={copy}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onMove={moveCategory}
          onAddItem={() => setEditing(blankDraft(cat.id))}
          onEditItem={(it) => setEditing({ ...it })}
          onDeleteItem={deleteItem}
          onToggle={toggleAvailable}
        />
      ))}

      {uncategorized.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "rgba(244,239,230,0.6)", margin: "0 0 10px" }}>{copy.uncategorized}</h3>
          {uncategorized.map((it) => (
            <ItemRow key={it.id} item={it} sym={sym} copy={copy} onEdit={() => setEditing({ ...it })} onDelete={() => deleteItem(it)} onToggle={() => toggleAvailable(it)} />
          ))}
        </div>
      )}

      {editing && (
        <ItemEditor
          slug={slug}
          draft={editing}
          sym={sym}
          copy={copy}
          busy={busy}
          onChange={setEditing}
          onSave={() => saveItem(editing)}
          onCancel={() => { setEditing(null); setError(""); }}
        />
      )}
    </div>
  );
}

/* ---------------- Category block ---------------- */
function CategoryBlock({ cat, idx, total, items, sym, copy, onRename, onDelete, onMove, onAddItem, onEditItem, onDeleteItem, onToggle }: {
  cat: CategoryView; idx: number; total: number; items: ItemView[]; sym: string;
  copy: Copy;
  onRename: (c: CategoryView, name: string, nameEn: string) => void;
  onDelete: (c: CategoryView) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onAddItem: () => void;
  onEditItem: (i: ItemView) => void;
  onDeleteItem: (i: ItemView) => void;
  onToggle: (i: ItemView) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [nameEn, setNameEn] = useState(cat.nameEn);

  return (
    <section style={{ marginBottom: 22, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.03)" }}>
        {editing ? (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, padding: "6px 10px", fontSize: 14 }} />
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder={copy.categoryNameEn} style={{ ...input, padding: "6px 10px", fontSize: 13 }} />
            <button onClick={() => { onRename(cat, name.trim() || cat.name, nameEn); setEditing(false); }} style={btnSmall}>{copy.save}</button>
            <button onClick={() => { setName(cat.name); setNameEn(cat.nameEn); setEditing(false); }} style={btnSmallGhost}>{copy.cancel}</button>
          </>
        ) : (
          <>
            <strong style={{ fontSize: 15 }}>{cat.name}</strong>
            {cat.nameEn && <span style={{ fontSize: 12, color: "rgba(244,239,230,0.4)" }}>/ {cat.nameEn}</span>}
            <span style={{ fontSize: 12, color: "rgba(244,239,230,0.35)" }}>· {copy.itemCount.replace("{n}", String(items.length))}</span>
            <div style={{ flex: 1 }} />
            <button title={copy.moveUp} onClick={() => onMove(idx, -1)} disabled={idx === 0} style={iconBtn}>↑</button>
            <button title={copy.moveDown} onClick={() => onMove(idx, 1)} disabled={idx === total - 1} style={iconBtn}>↓</button>
            <button onClick={() => setEditing(true)} style={btnSmallGhost}>{copy.edit}</button>
            <button onClick={() => onDelete(cat)} style={btnSmallDanger}>{copy.delete}</button>
          </>
        )}
      </header>
      <div style={{ padding: "10px 16px" }}>
        {items.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(244,239,230,0.35)", margin: "6px 0 12px" }}>{copy.categoryEmpty}</p>
        ) : (
          items.map((it) => (
            <ItemRow key={it.id} item={it} sym={sym} copy={copy} onEdit={() => onEditItem(it)} onDelete={() => onDeleteItem(it)} onToggle={() => onToggle(it)} />
          ))
        )}
        <button onClick={onAddItem} style={{ ...btnSmallGhost, marginTop: 6 }}>{copy.addItem}</button>
      </div>
    </section>
  );
}

/* ---------------- Item row ---------------- */
function ItemRow({ item, sym, copy, onEdit, onDelete, onToggle }: {
  item: ItemView; sym: string; copy: Copy;
  onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: item.isAvailable ? 1 : 0.5 }}>
      {item.imageUrl
        ? <img src={item.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
        : <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {item.name}
          {item.tags.map((t) => <span key={t} style={tagChip}>{tagLabel(t, copy)}</span>)}
          {!item.isAvailable && <span style={{ ...tagChip, background: "rgba(255,80,80,0.15)", color: "#ff9b9b" }}>{copy.unavailable}</span>}
        </div>
        {item.description && <div style={{ fontSize: 12, color: "rgba(244,239,230,0.45)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.description}</div>}
      </div>
      {item.price != null && <span style={{ fontSize: 14, fontWeight: 700, color: "#ffd84e" }}>{sym}{item.price}</span>}
      <button onClick={onToggle} title={item.isAvailable ? copy.available : copy.unavailable} style={iconBtn}>{item.isAvailable ? "✓" : "✗"}</button>
      <button onClick={onEdit} style={btnSmallGhost}>{copy.edit}</button>
      <button onClick={onDelete} style={btnSmallDanger}>{copy.delete}</button>
    </div>
  );
}

/* ---------------- Item editor (modal) ---------------- */
function ItemEditor({ slug, draft, sym, copy, busy, onChange, onSave, onCancel }: {
  slug: string; draft: Draft; sym: string; copy: Copy; busy: boolean;
  onChange: (d: Draft) => void; onSave: () => void; onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState("");

  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  const toggleTag = (t: string) => {
    set({ tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setImgErr(copy.imageTooLarge); return; }
    setUploading(true); setImgErr("");
    try {
      const fd = new FormData();
      fd.append("slug", slug);
      fd.append("file", file);
      const res = await fetch("/api/dashboard/digital-menu/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || copy.imageError);
      set({ imageUrl: json.url });
    } catch { setImgErr(copy.imageError); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 100, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#141416", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800 }}>{draft.id ? copy.editItem : copy.newItem}</h3>

        <label style={lbl}>{copy.itemName}</label>
        <input value={draft.name} onChange={(e) => set({ name: e.target.value })} style={input} autoFocus />

        <label style={lbl}>{copy.itemNameEn}</label>
        <input value={draft.nameEn} onChange={(e) => set({ nameEn: e.target.value })} style={input} />

        <label style={lbl}>{copy.itemDesc}</label>
        <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={2} style={{ ...input, resize: "vertical" }} />

        <label style={lbl}>{copy.itemDescEn}</label>
        <textarea value={draft.descriptionEn} onChange={(e) => set({ descriptionEn: e.target.value })} rows={2} style={{ ...input, resize: "vertical" }} />

        <label style={lbl}>{copy.price} {sym && `(${sym})`}</label>
        <input
          type="number"
          inputMode="decimal"
          value={draft.price ?? ""}
          onChange={(e) => set({ price: e.target.value === "" ? null : Number(e.target.value) })}
          placeholder={copy.pricePlaceholder}
          style={input}
        />

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

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(244,239,230,0.8)", marginBottom: 18, cursor: "pointer" }}>
          <input type="checkbox" checked={draft.isAvailable} onChange={(e) => set({ isAvailable: e.target.checked })} />
          {copy.available}
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnGhost}>{copy.cancel}</button>
          <button onClick={onSave} disabled={busy || uploading} style={btnPrimary}>{busy ? copy.saving : copy.save}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- shared ---------------- */
type Copy = ReturnType<typeof getClientCopy>["dashboardPages"]["digitalMenu"];

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
