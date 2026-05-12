"use client";

import { useEffect, useRef, useState } from "react";
import { getClientCopy } from "../../../../lib/i18n/client";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any;
    __shotpotPaddleInitialized?: boolean;
  }
}

type PlanKey = "kampanya" | "pro";
type BillingPeriod = "monthly" | "annual";

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
  priceKampanyaAnnual?: string;
  priceProAnnual?: string;
  autoCheckout?: boolean;
  initialPlan?: PlanKey | null;
  initialPeriod?: BillingPeriod | null;
};

type PlanView = {
  key: PlanKey;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualMonthly: string;
  period: string;
  color: string;
  features: readonly string[];
  badge?: string;
};

const PLAN_BASE = [
  {
    key: "kampanya",
    monthlyPrice: "$5",
    annualPrice: "$20",
    annualMonthly: "$1.67",
    period: "/mo",
    color: "#ffd84e",
  },
  {
    key: "pro",
    monthlyPrice: "$10",
    annualPrice: "$50",
    annualMonthly: "$4.17",
    period: "/mo",
    color: "#a78bfa",
  },
] as const;

export function BillingClient({
  venueId, venueName, userEmail, currentPlan, subscriptionStatus,
  planExpiresAt, hasPaddleCustomer, paddleSubscriptionId,
  paddleClientToken, paddleEnvironment, priceKampanya, pricePro,
  priceKampanyaAnnual, priceProAnnual, autoCheckout = false,
  initialPlan, initialPeriod,
}: Props) {
  const copyText = getClientCopy();
  const billing = copyText.billing;
  const common = copyText.common;
  const [loading, setLoading] = useState<PlanKey | "portal" | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<BillingPeriod>(initialPeriod ?? "monthly");
  const autoCheckoutOpened = useRef(false);

  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  // Load Paddle.js
  useEffect(() => {
    if (!paddleClientToken) {
      setError(billing.missingToken);
      return;
    }
    if (window.Paddle && window.__shotpotPaddleInitialized) { setPaddleReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      if (paddleEnvironment === "sandbox") {
        window.Paddle.Environment.set("sandbox");
      }
      window.Paddle.Initialize({ token: paddleClientToken, pwCustomer: {} });
      window.__shotpotPaddleInitialized = true;
      setPaddleReady(true);
    };
    document.head.appendChild(script);
  }, [billing.missingToken, paddleClientToken, paddleEnvironment]);

  function getPriceId(plan: PlanKey) {
    if (period === "annual") {
      return plan === "pro" ? (priceProAnnual ?? pricePro) : (priceKampanyaAnnual ?? priceKampanya);
    }
    return plan === "pro" ? pricePro : priceKampanya;
  }

  function handleSubscribe(plan: PlanKey) {
    const priceId = getPriceId(plan);
    if (!priceId) {
      setError(billing.missingPrice);
      return;
    }
    if (!paddleReady || !window.Paddle) {
      setError(billing.paymentLoadError);
      return;
    }
    setLoading(plan);
    setError("");

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: userEmail },
      customData: { venue_id: venueId, plan, billing_cycle: period },
      settings: {
        displayMode: "overlay",
        locale: copyText.meta.lang,
        successUrl: `${window.location.origin}/dashboard/billing/${window.location.pathname.split("/").pop()}?success=1`,
      },
    });

    // Reset loading after paddle opens (no direct callback in overlay mode)
    setTimeout(() => setLoading(null), 2000);
  }

  useEffect(() => {
    if (!autoCheckout || autoCheckoutOpened.current || !initialPlan || !paddleReady) return;
    autoCheckoutOpened.current = true;
    handleSubscribe(initialPlan);
  }, [autoCheckout, initialPlan, paddleReady]);

  function handlePortal() {
    if (!paddleReady || !window.Paddle || !paddleSubscriptionId) {
      setError(billing.subscriptionMissing);
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
    active:   { text: billing.statuses.active, color: "#4ade80" },
    trialing: { text: billing.statuses.trialing, color: "#fbbf24" },
    past_due: { text: billing.statuses.past_due, color: "#f87171" },
    canceled: { text: billing.statuses.canceled, color: "rgba(244,239,230,0.4)" },
    paused:   { text: billing.statuses.paused, color: "#94a3b8" },
    inactive: { text: billing.statuses.inactive, color: "rgba(244,239,230,0.4)" },
  };
  const statusInfo = statusLabel[subscriptionStatus ?? "inactive"] ?? statusLabel.inactive;
  const normalizedCurrentPlan: PlanKey | "" =
    currentPlan === "pro" || currentPlan === "isletme" ? "pro" : currentPlan === "kampanya" ? "kampanya" : "";
  const plans: PlanView[] = PLAN_BASE.map((plan) => ({
    ...plan,
    name: plan.key === "pro" ? billing.plans.pro.name : billing.plans.standard.name,
    features: plan.key === "pro" ? billing.plans.pro.features : billing.plans.standard.features,
    badge: plan.key === "pro" ? billing.popular : undefined,
  }));

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      {/* Current plan card */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 22px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(244,239,230,0.45)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>{billing.currentPlanLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f4efe6" }}>
              {currentPlan === "pro" || currentPlan === "isletme" ? billing.plans.pro.name : currentPlan === "kampanya" ? billing.plans.standard.name : billing.freePlan}
            </div>
            <div style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", marginTop: 2 }}>{venueName}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: statusInfo.color, padding: "4px 10px", borderRadius: 999, background: `${statusInfo.color}20`, border: `1px solid ${statusInfo.color}40` }}>
              {statusInfo.text}
            </div>
            {planExpiresAt && isActive && (
              <div style={{ fontSize: 11, color: "rgba(244,239,230,0.4)", marginTop: 6 }}>
                {billing.renewal}: {new Date(planExpiresAt).toLocaleDateString(copyText.meta.locale, { day: "numeric", month: "long", year: "numeric" })}
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
            {billing.managePaddle}
          </a>
        )}
      </div>

      {/* Billing period toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#f4efe6" }}>{billing.choosePlan}</h2>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 3, gap: 2 }}>
          {(["monthly", "annual"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              type="button"
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer",
                background: period === p ? "rgba(255,216,78,0.15)" : "transparent",
                color: period === p ? "#ffd84e" : "rgba(244,239,230,0.5)",
              }}
            >
              {p === "monthly" ? common.monthly : common.annual}
              {p === "annual" && <span style={{ fontSize: 10, marginLeft: 4, color: "#4ade80" }}>{billing.annualCheap}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {plans.map((p) => {
          const isCurrent = normalizedCurrentPlan === p.key && isActive;
          const displayPrice = period === "annual" ? p.annualPrice : p.monthlyPrice;
          const displaySub = period === "annual" ? billing.yearlySuffix : common.monthSuffix;
          const monthlyEquiv = period === "annual" ? p.annualMonthly : null;
          return (
            <div key={p.key} style={{
              background: "rgba(255,255,255,0.03)",
              border: `1.5px solid ${isCurrent ? p.color : p.key === "pro" ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 18, padding: "22px 20px", position: "relative", overflow: "hidden",
              boxShadow: isCurrent ? `0 0 30px ${p.color}20` : "none",
            }}>
              {p.badge && !isCurrent && (
                <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}>
                  {p.badge}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: p.color }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#f4efe6", lineHeight: 1.1 }}>{displayPrice}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(244,239,230,0.4)" }}>{displaySub}</span>
                  </div>
                  {monthlyEquiv && (
                    <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>{monthlyEquiv}{billing.monthlyEquivalent}</div>
                  )}
                </div>
                {isCurrent ? (
                  <div style={{ padding: "6px 14px", borderRadius: 999, background: `${p.color}20`, color: p.color, fontSize: 11, fontWeight: 700, border: `1px solid ${p.color}50` }}>
                    {billing.currentPlan}
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
                    {loading === p.key ? billing.opening : billing.subscribe}
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
        {billing.secure}
      </p>
    </div>
  );
}
