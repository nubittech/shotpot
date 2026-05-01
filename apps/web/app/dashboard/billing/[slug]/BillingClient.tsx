"use client";

import { useState } from "react";

type Plan = "kampanya" | "pro";

type Props = {
  venueId: string;
  venueName: string;
  currentPlan: string;
  subscriptionStatus: string | null;
  planExpiresAt: string | null;
  hasStripeCustomer: boolean;
};

const PLANS = [
  {
    key: "kampanya" as Plan,
    name: "Kampanya",
    price: "₺499",
    period: "/ay",
    color: "#ffd84e",
    features: [
      "Sınırsız fiş tarama",
      "AI ile fiş doğrulama",
      "3 slot tasarımı",
      "Garson redemption paneli",
      "Temel istatistikler",
    ],
  },
  {
    key: "pro" as Plan,
    name: "Pro",
    price: "₺1.299",
    period: "/ay",
    color: "#a78bfa",
    features: [
      "Kampanya planındaki her şey",
      "Müşteri hesapları",
      "Profil + kupon geçmişi",
      "Sadakat seviyeleri",
      "Kampanya gönderici",
      "Detaylı analytics",
      "CSV export",
    ],
  },
];

export function BillingClient({ venueId, venueName, currentPlan, subscriptionStatus, planExpiresAt, hasStripeCustomer }: Props) {
  const [loading, setLoading] = useState<Plan | "portal" | null>(null);
  const [error, setError] = useState("");

  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  async function handleSubscribe(plan: Plan) {
    setLoading(plan);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, plan }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Bir hata oluştu.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Portal açılamadı.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(null);
    }
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    active:    { text: "Aktif", color: "#4ade80" },
    trialing:  { text: "Deneme", color: "#fbbf24" },
    past_due:  { text: "Ödeme Gecikti", color: "#f87171" },
    canceled:  { text: "İptal Edildi", color: "rgba(244,239,230,0.4)" },
    unpaid:    { text: "Ödenmedi", color: "#f87171" },
    inactive:  { text: "Pasif", color: "rgba(244,239,230,0.4)" },
  };

  const status = subscriptionStatus ?? "inactive";
  const statusInfo = statusLabel[status] ?? statusLabel.inactive;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      {/* Current plan card */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 22px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(244,239,230,0.45)", fontWeight: 600, marginBottom: 4 }}>MEVCUT PLAN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f4efe6" }}>
              {currentPlan === "pro" ? "Pro" : currentPlan === "kampanya" ? "Kampanya" : "Ücretsiz"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", marginTop: 2 }}>{venueName}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: statusInfo.color, padding: "4px 10px", borderRadius: 999, background: `${statusInfo.color}20`, border: `1px solid ${statusInfo.color}40` }}>
              {statusInfo.text}
            </div>
            {planExpiresAt && isActive && (
              <div style={{ fontSize: 11, color: "rgba(244,239,230,0.4)", marginTop: 6 }}>
                Yenileme: {new Date(planExpiresAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
          </div>
        </div>

        {hasStripeCustomer && (
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            style={{ marginTop: 16, padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(244,239,230,0.8)" }}
          >
            {loading === "portal" ? "Açılıyor..." : "💳 Ödeme & Faturalar (Stripe Portal)"}
          </button>
        )}
      </div>

      {/* Plan cards */}
      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#f4efe6" }}>Plan Seç</h2>
      <div style={{ display: "grid", gap: 14 }}>
        {PLANS.map((p) => {
          const isCurrent = currentPlan === p.key && isActive;
          return (
            <div key={p.key} style={{
              background: "rgba(255,255,255,0.03)",
              border: `1.5px solid ${isCurrent ? p.color : "rgba(255,255,255,0.08)"}`,
              borderRadius: 18,
              padding: "22px 20px",
              boxShadow: isCurrent ? `0 0 30px ${p.color}20` : "none",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: p.color }}>{p.name}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#f4efe6", lineHeight: 1.2, marginTop: 2 }}>
                    {p.price}<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(244,239,230,0.4)" }}>{p.period}</span>
                  </div>
                </div>
                {isCurrent ? (
                  <div style={{ padding: "6px 14px", borderRadius: 999, background: `${p.color}20`, color: p.color, fontSize: 11, fontWeight: 700, border: `1px solid ${p.color}50` }}>
                    ✓ Mevcut Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(p.key)}
                    disabled={loading !== null}
                    style={{
                      padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      border: "none", background: p.color, color: "#111",
                      opacity: loading !== null ? 0.7 : 1,
                    }}
                  >
                    {loading === p.key ? "Yönlendiriliyor..." : currentPlan === p.key ? "Yenile" : "Geç"}
                  </button>
                )}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ fontSize: 12, color: "rgba(244,239,230,0.65)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: p.color, fontSize: 10, fontWeight: 900 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
}
