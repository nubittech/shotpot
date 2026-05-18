"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TierConfig = {
  silverVisits: number;
  silverSpend: number;
  goldVisits: number;
  goldSpend: number;
};

export function TierConfigPanel({ slug, initial }: { slug: string; initial: TierConfig }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<TierConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set(k: keyof TierConfig, val: string) {
    setCfg((c) => ({ ...c, [k]: val === "" ? 0 : Number(val) }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...cfg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Kaydedilemedi.");
      } else {
        setMsg(`✓ Kaydedildi — ${data.changed} müşterinin seviyesi güncellendi.`);
        router.refresh();
      }
    } catch {
      setMsg("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, marginBottom: 24, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", color: "#f4efe6", textAlign: "left" }}
      >
        <span style={{ fontSize: 18 }}>👑</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>VIP Seviye Ayarları</div>
          <div style={{ fontSize: 12, color: "rgba(244,239,230,0.45)" }}>
            Müşteriler harcama veya ziyaret eşiğini geçince otomatik seviye atlar.
          </div>
        </div>
        <span style={{ fontSize: 13, color: "rgba(244,239,230,0.5)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "4px 18px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Silver */}
            <div style={tierBox}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🥈 Silver eşiği</div>
              <Field label="Ziyaret sayısı">
                <input type="number" min={1} value={cfg.silverVisits || ""} onChange={(e) => set("silverVisits", e.target.value)} style={input} />
              </Field>
              <Field label="veya Toplam harcama (₺)">
                <input type="number" min={0} value={cfg.silverSpend || ""} onChange={(e) => set("silverSpend", e.target.value)} style={input} />
              </Field>
            </div>
            {/* Gold */}
            <div style={tierBox}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🥇 Gold eşiği</div>
              <Field label="Ziyaret sayısı">
                <input type="number" min={1} value={cfg.goldVisits || ""} onChange={(e) => set("goldVisits", e.target.value)} style={input} />
              </Field>
              <Field label="veya Toplam harcama (₺)">
                <input type="number" min={0} value={cfg.goldSpend || ""} onChange={(e) => set("goldSpend", e.target.value)} style={input} />
              </Field>
            </div>
          </div>

          <p style={{ fontSize: 11.5, color: "rgba(244,239,230,0.4)", lineHeight: 1.5, margin: "12px 0 0" }}>
            Bir müşteri, eşiklerden <strong>herhangi birini</strong> geçtiğinde o seviyeye yükselir.
            Kaydettiğinde mevcut tüm müşterilerin seviyesi yeni eşiklere göre yeniden hesaplanır.
          </p>

          {msg && (
            <div style={{ fontSize: 12.5, marginTop: 12, color: msg.startsWith("✓") ? "#8ef2a1" : "#ff8060", fontWeight: 600 }}>{msg}</div>
          )}

          <button onClick={save} disabled={busy} style={{
            marginTop: 14, padding: "11px 22px", borderRadius: 10, border: "none",
            background: "#ffd84e", color: "#1a1208", fontSize: 13, fontWeight: 800,
            cursor: "pointer", opacity: busy ? 0.6 : 1,
          }}>
            {busy ? "Kaydediliyor…" : "Kaydet ve yeniden hesapla"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(244,239,230,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const tierBox: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 14px 8px" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 10px", color: "#f4efe6", fontSize: 13, outline: "none" };
