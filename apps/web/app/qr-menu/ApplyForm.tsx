"use client";

import { useRef, useState } from "react";
import { getClientCopy } from "../../lib/i18n/client";

type Copy = ReturnType<typeof getClientCopy>["qrMenuApply"];

export function ApplyForm({ copy }: { copy: Copy }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const merged = [...photos, ...picked].slice(0, 10);
    setPhotos(merged);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError("");
    if (!businessName.trim() || (!phone.trim() && !email.trim())) { setError(copy.errorRequired); return; }
    if (photos.length === 0) { setError(copy.errorPhotos); return; }
    if (photos.length > 10) { setError(copy.errorTooMany); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("businessName", businessName);
      fd.append("contactName", contactName);
      fd.append("phone", phone);
      fd.append("email", email);
      fd.append("city", city);
      fd.append("message", message);
      photos.forEach((f) => fd.append("photos", f));
      const res = await fetch("/api/qr-menu/apply", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || copy.errorSubmit);
      setDone(true);
    } catch {
      setError(copy.errorSubmit);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div style={{ padding: "24px 4px", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#7be08a", marginBottom: 8 }}>{copy.successTitle}</div>
        <p style={{ fontSize: 14, color: "rgba(244,239,230,0.6)", lineHeight: 1.5, margin: 0 }}>{copy.successDesc}</p>
      </div>
    );
  }

  return (
    <div>
      <label style={lbl}>{copy.businessName} *</label>
      <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={copy.businessNamePh} style={input} />

      <label style={lbl}>{copy.contactName}</label>
      <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={copy.contactNamePh} style={input} />

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{copy.phone}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={copy.phonePh} inputMode="tel" style={input} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{copy.city}</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={copy.cityPh} style={input} />
        </div>
      </div>

      <label style={lbl}>{copy.email}</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={copy.emailPh} inputMode="email" style={input} />

      <label style={lbl}>{copy.message}</label>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={copy.messagePh} rows={2} style={{ ...input, resize: "vertical" }} />

      <label style={lbl}>{copy.photos} *</label>
      <p style={{ fontSize: 12, color: "rgba(244,239,230,0.4)", margin: "0 0 8px", lineHeight: 1.4 }}>{copy.photosHint}</p>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple onChange={onPick} style={{ display: "none" }} />
      <button onClick={() => fileRef.current?.click()} style={btnGhost}>{copy.addPhotos}</button>
      {photos.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "rgba(244,239,230,0.55)", margin: "10px 0 6px" }}>{copy.photosCount.replace("{n}", String(photos.length))}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {photos.map((f, i) => (
              <div key={i} style={{ position: "relative" }}>
                {f.type.startsWith("image/")
                  ? <img src={URL.createObjectURL(f)} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />
                  : <div style={{ width: 64, height: 64, borderRadius: 8, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "rgba(244,239,230,0.6)" }}>PDF</div>}
                <button onClick={() => removePhoto(i)} aria-label="remove" style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 999, background: "#ff5050", color: "#fff", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}

      {error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff9b9b", fontSize: 13 }}>{error}</div>}

      <button onClick={submit} disabled={busy} style={{ ...btnPrimary, width: "100%", marginTop: 18, padding: "13px", fontSize: 15 }}>
        {busy ? copy.submitting : copy.submit}
      </button>
    </div>
  );
}

const input: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f4efe6", fontSize: 14, marginBottom: 6, boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "rgba(244,239,230,0.55)", margin: "10px 0 4px" };
const btnPrimary: React.CSSProperties = { padding: "11px 18px", borderRadius: 10, background: "#ffd84e", color: "#0a0a0c", border: "none", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.85)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, fontWeight: 600, cursor: "pointer" };
