"use client";

import { useState } from "react";

type Props = {
  venue: {
    slug: string;
    plan: "kampanya" | "isletme";
    tier: "standard" | "pro";
    billingCycle: "monthly" | "yearly";
    active: boolean;
    hasPaddle: boolean;
  };
};

export default function VenueAdminControls({ venue }: Props) {
  const [plan,    setPlan]    = useState(venue.plan);
  const [tier,    setTier]    = useState(venue.tier);
  const [cycle,   setCycle]   = useState(venue.billingCycle);
  const [active,  setActive]  = useState(venue.active);
  const [note,    setNote]    = useState("");
  const [tokens,  setTokens]  = useState(10);
  const [guestToken, setGuestToken] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState<string | null>(null);

  async function saveOverride() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/venues/override-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: venue.slug, plan, tier, billingCycle: cycle, active, note: note || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "fail");
      setMsg("✓ Plan/durum güncellendi");
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      setMsg("✗ " + (e instanceof Error ? e.message : "hata"));
    } finally { setBusy(false); }
  }

  async function grantTokens() {
    setBusy(true); setMsg(null);
    if (!customerId && !guestToken) { setMsg("✗ customerId veya guestToken gerekli"); setBusy(false); return; }
    try {
      const res = await fetch("/api/admin/venues/grant-tokens", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: venue.slug,
          customerId: customerId || undefined,
          guestToken: guestToken || undefined,
          tokens,
          note: note || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "fail");
      setMsg(`✓ ${tokens} token verildi (receipt ${d.receiptId})`);
    } catch (e) {
      setMsg("✗ " + (e instanceof Error ? e.message : "hata"));
    } finally { setBusy(false); }
  }

  return (
    <div style={{
      padding: 16, border: "1px solid #2a2a1a", background: "#161410", borderRadius: 10,
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
    }}>
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e6b800", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
          Plan / Durum Override
        </h3>
        {venue.hasPaddle && (
          <div style={{ fontSize: 11, color: "#cc8866", marginBottom: 10, lineHeight: 1.5 }}>
            ⚠ Bu işletmede aktif Paddle aboneliği var. Sadece DB değişir, Paddle faturalamaya devam eder.
          </div>
        )}
        <Field label="Plan">
          <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} style={selectStyle}>
            <option value="kampanya">kampanya</option>
            <option value="isletme">isletme</option>
          </select>
        </Field>
        <Field label="Tier">
          <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} style={selectStyle}>
            <option value="standard">standard</option>
            <option value="pro">pro</option>
          </select>
        </Field>
        <Field label="Cycle">
          <select value={cycle} onChange={(e) => setCycle(e.target.value as typeof cycle)} style={selectStyle}>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </select>
        </Field>
        <Field label="Aktif">
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span style={{ fontSize: 12, color: "#bbb" }}>{active ? "aktif" : "pasif"}</span>
          </label>
        </Field>
        <button onClick={saveOverride} disabled={busy} style={btnPrimary}>
          {busy ? "..." : "Override kaydet"}
        </button>
      </div>

      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#5eb95e", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
          Demo Token Hediye Et
        </h3>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 10, lineHeight: 1.5 }}>
          Fiş okutmadan müşteriye spin hakkı tanımla. <code>is_synthetic=true</code> olarak işaretlenir, analytics'e karışmaz.
        </div>
        <Field label="Token sayısı">
          <input type="number" min={1} max={1000} value={tokens}
            onChange={(e) => setTokens(parseInt(e.target.value, 10) || 1)} style={inputStyle}/>
        </Field>
        <Field label="Customer ID (Pro)">
          <input type="text" value={customerId} onChange={(e) => setCustomerId(e.target.value)}
            placeholder="uuid (opsiyonel)" style={inputStyle}/>
        </Field>
        <Field label="Guest Token (anon)">
          <input type="text" value={guestToken} onChange={(e) => setGuestToken(e.target.value)}
            placeholder="rr_guest_token değeri (opsiyonel)" style={inputStyle}/>
        </Field>
        <button onClick={grantTokens} disabled={busy} style={btnSuccess}>
          {busy ? "..." : "Token ver"}
        </button>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <Field label="Not (audit'e yazılır)">
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="ör: tanıtım kampanyası" style={{ ...inputStyle, width: "100%" }}/>
        </Field>
        {msg && <div style={{ marginTop: 8, fontSize: 12, color: msg.startsWith("✓") ? "#5eb95e" : "#cc6666" }}>{msg}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  padding: "6px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a",
  borderRadius: 6, color: "#fff", fontSize: 13, width: 200,
};
const selectStyle: React.CSSProperties = { ...inputStyle, width: 180 };
const btnPrimary: React.CSSProperties = {
  marginTop: 8, padding: "8px 14px", background: "#3a5b9e", border: "none",
  borderRadius: 6, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
};
const btnSuccess: React.CSSProperties = {
  marginTop: 8, padding: "8px 14px", background: "#2d6b3a", border: "none",
  borderRadius: 6, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
};
