"use client";

import Link from "next/link";
import { useState } from "react";
import { copy } from "../lib/i18n";

const C = {
  bg0: "#08050a",
  bg1: "#110a08",
  line: "rgba(232,200,118,0.12)",
  lineS: "rgba(232,200,118,0.28)",
  b300: "#e8c876",
  i100: "#fff8e8",
  i300: "#c8b890",
  i400: "#8b7d5e",
  green: "#7be38a",
};

type BillingPeriod = "monthly" | "annual";

type Props = {
  signedIn: boolean;
};

export function LandingPricing({ signedIn }: Props) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const pricing = copy.pricing;
  const common = copy.common;
  const standard = pricing.plans.standard;
  const pro = pricing.plans.pro;

  return (
    <section id="pricing" style={{ padding: "100px 0" }}>
      <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>{pricing.eyebrow}</div>
          <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100 }}>{pricing.title}</h2>
          <p style={{ margin: "18px auto 0", maxWidth: 520, fontSize: 17, color: C.i300, lineHeight: 1.6 }}>
            {pricing.body}
          </p>
          <div style={{ display: "inline-flex", marginTop: 28, background: "rgba(232,200,118,0.06)", border: `1px solid ${C.line}`, borderRadius: 12, padding: 4, gap: 3 }}>
            <PeriodButton active={period === "monthly"} onClick={() => setPeriod("monthly")}>{common.monthly}</PeriodButton>
            <PeriodButton active={period === "annual"} onClick={() => setPeriod("annual")}>
              {common.annual} <span style={{ fontSize: 10, color: "#4ade80", marginLeft: 4 }}>{pricing.annualBadge}</span>
            </PeriodButton>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, maxWidth: 760, margin: "0 auto" }}>
          <PlanCard
            title={standard.title}
            price={period === "monthly" ? standard.monthlyPrice : standard.annualPrice}
            suffix={period === "monthly" ? common.monthSuffix : common.yearSuffix}
            subPrice={period === "annual" ? pricing.equivalentMonthly.standard : undefined}
            description={standard.description}
            features={[...standard.features]}
            cta={signedIn ? standard.signedInCta : standard.signedOutCta}
            href={signedIn ? "/dashboard" : "/signup?plan=kampanya"}
          />
          <PlanCard
            title={pro.title}
            price={period === "monthly" ? pro.monthlyPrice : pro.annualPrice}
            suffix={period === "monthly" ? common.monthSuffix : common.yearSuffix}
            subPrice={period === "annual" ? pricing.equivalentMonthly.pro : undefined}
            description={pro.description}
            features={[...pro.features]}
            cta={signedIn ? pro.signedInCta : pro.signedOutCta}
            href={signedIn ? "/dashboard" : "/signup?plan=pro"}
            featured
          />
        </div>
      </div>
    </section>
  );
}

function PeriodButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: "8px 22px",
        borderRadius: 8,
        border: "none",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .15s",
        background: active ? "rgba(232,200,118,0.14)" : "transparent",
        color: active ? C.b300 : C.i400,
      }}
    >
      {children}
    </button>
  );
}

function PlanCard({
  title,
  price,
  suffix,
  subPrice,
  description,
  features,
  cta,
  href,
  featured,
}: {
  title: string;
  price: string;
  suffix: string;
  subPrice?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)`,
        border: featured ? `2px solid ${C.b300}` : `1px solid ${C.line}`,
        borderRadius: 20,
        padding: "32px 28px",
        boxShadow: featured ? "0 0 40px rgba(232,200,118,0.12)" : undefined,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: featured ? C.b300 : C.i400, textTransform: "uppercase" }}>{title}</div>
        {featured && <span style={{ padding: "3px 10px", borderRadius: 999, background: C.b300, color: "#1a0f06", fontSize: 10, fontWeight: 800 }}>{copy.pricing.popular}</span>}
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 40, color: C.i100, lineHeight: 1 }}>
        {price}<span style={{ fontSize: 15, color: C.i400, fontWeight: 600 }}>{suffix}</span>
      </div>
      {subPrice && <div style={{ fontSize: 12, color: "#4ade80", marginTop: 2 }}>{subPrice}</div>}
      <p style={{ fontSize: 14, color: C.i400, margin: "14px 0 24px", lineHeight: 1.55 }}>{description}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: C.i300 }}>
        {features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: featured ? C.b300 : C.green, fontWeight: 700 }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={featured ? "btn-primary-lg" : undefined}
        style={{
          display: "block",
          textAlign: "center",
          justifyContent: "center",
          padding: featured ? undefined : "13px",
          borderRadius: featured ? undefined : 12,
          border: featured ? undefined : `1px solid ${C.lineS}`,
          color: featured ? undefined : C.b300,
          fontSize: featured ? undefined : 14,
          fontWeight: featured ? undefined : 600,
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
