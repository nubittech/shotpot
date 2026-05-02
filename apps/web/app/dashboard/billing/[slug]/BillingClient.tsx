"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any;
  }
}

type PlanKey = "kampanya" | "pro";

type Props = {
  venueId: string;
  venueName: string;
  userEmail: string;
  currentPlan: string;
  subscriptionStatus: string | null;
  planExpiresAt: string | null;
  hasPaddleCustomer: boolean;
  paddleSubscriptionId: string | null;
  paddleClientToken: string;
  paddleEnvironment: string;
  priceKampanya: string;
  pricePro: string;
};

const PLANS = [
  {
    key: "kampanya" as PlanKey,
    name: "Campaign",
    price: "$14",
    period: "/mo",
    color: "#ffd84e",
    features: [
      "Unlimited receipt scanning",
      "AI receipt verification",
      "3 slot machine themes",
      "Staff redemption panel",
      "Basic analytics",
    ],
  },
  {
    key: "pro" as PlanKey,
    name: "Pro",
    price: "$36",
    period: "/mo",
    color: "#a78bfa",
    features: [
      "Everything in Campaign",
      "Customer accounts",
      "Profile + coupon history",
      "Loyalty tiers",
      "Campaign sender",
      "Detailed analytics",
      "CSV export",
    ],
  },
];

export function BillingClient({
  venueId, venueName, userEmail, currentPlan, subscriptionStatus,
  planExpiresAt, hasPaddleCustomer, paddleSubscriptionId,
  paddleClientToken, paddleEnvironment, priceKampanya, pricePro,
}: Props) {
  const [loading, setLoading] = useState<PlanKey | "portal" | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);
  const [error, setError] = useState("");

  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  // Load Paddle.js
  useEffect(() => {
    if (window.Paddle) { setPaddleReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      window.Paddle.Environment.set(paddleEnvironment);
      window.Paddle.Initialize({ token: paddleClientToken });
      setPaddleReady(true);
    };
    document.head.appendChild(script);
  }, [paddleClientToken, paddleEnvironment]);

  function getPriceId(plan: PlanKey) {
    return plan === "pro" ? pricePro : priceKampanya;
  }

  function handleSubscribe(plan: PlanKey) {
    if (!paddleReady || !window.Paddle) {
      setError("Ödeme sistemi yüklenemedi. Sayfayı yenileyip tekrar dene.");
      return;
    }
    setLoading(plan);
    setError("");

    window.Paddle.Checkout.open({
      items: [{ priceId: getPriceId(plan), quantity: 1 }],
      customer: { email: userEmail },
      customData: { venue_id: venueId, plan },
      successUrl: `${window.location.origin}/dashboard/billing/${window.location.pathname.split("/").pop()}?success=1`,
      settings: { displayMode: "overlay", locale: "en" },
    });

    // Reset loading after paddle opens (no direct callback in overlay mode)
    setTimeout(() => setLoading(null), 2000);
  }

  function handlePortal() {
    if (!paddleReady || !window.Paddle || !paddleSubscriptionId) {
      setError("Abonelik bulunamadı.");
      return;
    }
    setLoading("portal");
    // Open subscription management overlay
    window.Paddle.Checkout.open({
      settings: { displayMode: "overlay" },
      // For managing existing subscription, Paddle provides a management URL
      // User should visit: vendors.paddle.com/subscriptions or we redirect to management URL
    });
    setTimeout(() => setLoading(null), 2000);
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    active:   { text: "Aktif",            color: "#4ade80" },
    trialing: { text: "Deneme",           color: "#fbbf24" },
    past_due: { text: "Ödeme Gecikti",    color: "#f87171" },
    canceled: { text: "İptal Edildi",     color: "rgba(244,239,230,0.4)" },
    paused:   { text: "Duraklatıldı",     color: "#94a3b8" },
    inactive: { text: "Pasif",            color: "rgba(244,239,230,0.4)" },
  };
  const statusInfo = statusLabel[subscriptionStatus ?? "inactive"] ?? statusLabel.inactive;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      {/* Current plan card */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 22px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(244,239,230,0.45)", fontWeight: 600, marginBottom: 4 }}>MEVCUT PLAN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f4efe6" }}>
              {currentPlan === "pro" ? "Pro" : currentPlan === "kampanya" ? "Campaign" : "Ücretsiz"}
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

        {hasPaddleCustomer && (
          <a
            href={`https://sandbox-vendors.paddle.com/subscriptions/${paddleSubscriptionId ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: 16, display: "inline-block", padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(244,239,230,0.8)", textDecoration: "none" }}
          >
            💳 Paddle'da Yönet (Fatura & Kart)
          </a>
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
              borderRadius: 18, padding: "22px 20px",
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
                    disabled={loading !== null || !paddleReady}
                    style={{
                      padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      cursor: "pointer", border: "none", background: p.color, color: "#111",
                      opacity: (loading !== null || !paddleReady) ? 0.7 : 1,
                    }}
                  >
                    {loading === p.key ? "Açılıyor..." : "Abone Ol"}
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

      <p style={{ marginTop: 20, fontSize: 11, color: "rgba(244,239,230,0.3)", textAlign: "center" }}>
        Ödemeler Paddle tarafından güvenle işlenir. İstediğin zaman iptal edebilirsin.
      </p>
    </div>
  );
}
