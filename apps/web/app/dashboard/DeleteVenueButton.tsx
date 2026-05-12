"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DeleteVenueButtonProps = {
  slug: string;
  name: string;
  active: boolean;
  plan: string;
  tier: string;
  billingCycle?: string | null;
  label?: string;
  cancelLabel?: string;
  closeLabel?: string;
  monthlyLabel?: string;
  annualLabel?: string;
  campaignLabel?: string;
  copyText?: {
    title: string;
    permanent: string;
    irreversible: string;
    dataWarning: string;
    paidWarning: string;
    annualWarning: string;
    confirmSlug: string;
    deleting: string;
    submit: string;
    error: string;
  };
};

const defaultCopy = {
  title: "İşletmeyi sil?",
  permanent: "kalıcı olarak silinecek.",
  irreversible: "Bu işlem geri alınamaz.",
  dataWarning: "Müşteri linki, kampanyalar, kuponlar, fişler ve bu işletmeye bağlı veriler silinir.",
  paidWarning: "Bu işletme ücretli/aktif görünüyor ({planLabel}). Paddle iptal entegrasyonu tamamlanana kadar silme işlemi Paddle tarafındaki aboneliği otomatik durdurmayabilir; ücretlendirme devam etmemesi için Plan ekranından Paddle aboneliğini ayrıca iptal etmelisin.",
  annualWarning: "Yıllık üyelikte kalan kullanım süresi kaybolabilir ve işletme silindikten sonra geri getirilemez.",
  confirmSlug: "Onay için slug yaz",
  deleting: "Siliniyor...",
  submit: "İşletmeyi Sil",
  error: "İşletme silinemedi.",
};

export function DeleteVenueButton({
  slug,
  name,
  active,
  plan,
  tier,
  billingCycle,
  label = "Sil",
  cancelLabel = "Vazgeç",
  closeLabel = "Kapat",
  monthlyLabel = "Aylık",
  annualLabel = "Yıllık",
  campaignLabel = "Kampanya",
  copyText = defaultCopy,
}: DeleteVenueButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAnnual = billingCycle === "yearly" || billingCycle === "annual";
  const hasPaidPlan = active || plan === "isletme" || tier === "pro";
  const canDelete = confirmSlug.trim() === slug && !loading;

  const planLabel = useMemo(() => {
    const name = tier === "pro" || plan === "isletme" ? "Pro" : campaignLabel;
    const period = isAnnual ? annualLabel : monthlyLabel;
    return `${name} · ${period}`;
  }, [annualLabel, campaignLabel, isAnnual, monthlyLabel, plan, tier]);

  async function deleteVenue() {
    if (!canDelete) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/dashboard/venues/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? copyText.error);
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : copyText.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setConfirmSlug("");
          setError("");
        }}
        style={{
          padding: "9px 14px",
          borderRadius: 999,
          background: "#150b0b",
          border: "1px solid rgba(255,138,74,0.28)",
          color: "#ffb18a",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          textDecoration: "none",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-venue-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              borderRadius: 18,
              border: "1px solid rgba(255,138,74,0.26)",
              background: "linear-gradient(180deg, #150b0b 0%, #08050a 100%)",
              color: "#f4efe6",
              boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div
                  id="delete-venue-title"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 26,
                    fontWeight: 900,
                    lineHeight: 1.1,
                  }}
                >
                  {copyText.title}
                </div>
                <p style={{ margin: "10px 0 0", color: "#c8b890", fontSize: 14, lineHeight: 1.55 }}>
                  <strong style={{ color: "#fff8e8" }}>{name}</strong> {copyText.permanent}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(232,200,118,0.12)",
                  background: "#110a08",
                  color: "#f0e0c0",
                  cursor: "pointer",
                  fontSize: 22,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 14,
                border: "1px solid rgba(255,138,74,0.28)",
                background: "rgba(255,138,74,0.08)",
                color: "#ffd0bd",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 800, color: "#ffb18a", marginBottom: 8 }}>{copyText.irreversible}</div>
              <div>{copyText.dataWarning}</div>
              {hasPaidPlan && (
                <div style={{ marginTop: 8 }}>
                  {copyText.paidWarning.replace("{planLabel}", planLabel)}
                </div>
              )}
              {isAnnual && (
                <div style={{ marginTop: 8 }}>
                  {copyText.annualWarning}
                </div>
              )}
            </div>

            <label style={{ display: "block", marginTop: 18, color: "#8b7d5e", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {copyText.confirmSlug}
            </label>
            <div style={{ marginTop: 8, color: "#c8b890", fontSize: 13 }}>
              <span style={{ color: "#e8c876", fontFamily: "'DM Mono', monospace" }}>{slug}</span>
            </div>
            <input
              value={confirmSlug}
              onChange={(event) => setConfirmSlug(event.target.value)}
              placeholder={slug}
              autoCapitalize="none"
              autoCorrect="off"
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: 8,
                padding: "13px 14px",
                borderRadius: 12,
                border: "1px solid rgba(232,200,118,0.18)",
                background: "#110a08",
                color: "#fff8e8",
                fontSize: 15,
                outline: "none",
                fontFamily: "'DM Mono', monospace",
              }}
            />

            {error && (
              <div style={{ marginTop: 12, color: "#ffb18a", fontSize: 13, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                style={{
                  padding: "11px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(232,200,118,0.16)",
                  background: "#110a08",
                  color: "#f0e0c0",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={deleteVenue}
                disabled={!canDelete}
                style={{
                  padding: "11px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,138,74,0.35)",
                  background: canDelete ? "linear-gradient(160deg, #ffb18a, #c85b32)" : "rgba(255,138,74,0.12)",
                  color: canDelete ? "#160807" : "rgba(255,209,189,0.45)",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: canDelete ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                {loading ? copyText.deleting : copyText.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
