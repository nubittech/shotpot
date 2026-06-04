"use client";

import { useState } from "react";
import type { DigitalMenuApplication } from "../../../lib/supabase/types";

const STATUSES: Array<DigitalMenuApplication["status"]> = ["new", "contacted", "done", "rejected"];
const STATUS_LABEL: Record<string, string> = { new: "Yeni", contacted: "İletişimde", done: "Tamamlandı", rejected: "Reddedildi" };
const STATUS_COLOR: Record<string, string> = { new: "#e6b800", contacted: "#7bb3ff", done: "#5eb95e", rejected: "#cc6666" };

export function ApplicationCard({ app }: { app: DigitalMenuApplication }) {
  const [status, setStatus] = useState(app.status);
  const [note, setNote] = useState(app.admin_note ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (patch: { status?: string; adminNote?: string }) => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/qr-menu/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, ...patch }),
      });
      if (!res.ok) throw new Error();
      setMsg("✓");
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setMsg("✗ hata");
    } finally { setBusy(false); }
  };

  const photos = Array.isArray(app.photo_urls) ? app.photo_urls : [];

  return (
    <div style={{ border: "1px solid #1f1f1f", borderRadius: 10, background: "#121212", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 16, color: "#fff" }}>{app.business_name}</strong>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#1c1c1c", color: STATUS_COLOR[status], fontWeight: 700 }}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 6, lineHeight: 1.6 }}>
            {app.contact_name && <>{app.contact_name}<br /></>}
            {app.phone && <>📞 {app.phone}{" "}</>}
            {app.email && <>· ✉ {app.email}</>}
            {app.city && <><br />📍 {app.city}</>}
          </div>
          {app.message && <div style={{ fontSize: 13, color: "#ccc", marginTop: 8, fontStyle: "italic" }}>“{app.message}”</div>}
          <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>{new Date(app.created_at).toLocaleString("tr-TR")}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <select
            value={status}
            onChange={(e) => { const s = e.target.value as DigitalMenuApplication["status"]; setStatus(s); save({ status: s }); }}
            disabled={busy}
            style={{ padding: "6px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", fontSize: 13 }}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "#5eb95e" : "#cc6666" }}>{msg}</span>}
        </div>
      </div>

      {photos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {photos.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="" style={{ width: 88, height: 88, borderRadius: 8, objectFit: "cover", border: "1px solid #2a2a2a" }} />
            </a>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Admin notu…"
          style={{ flex: 1, padding: "7px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", fontSize: 13 }}
        />
        <button onClick={() => save({ adminNote: note })} disabled={busy} style={{ padding: "7px 14px", background: "#3a5b9e", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
          Not kaydet
        </button>
      </div>
    </div>
  );
}
