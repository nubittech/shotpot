import Link from "next/link";
import { getServerCopy, getServerLocale } from "../../lib/i18n/server";
import { LanguageToggle } from "../../components/LanguageToggle";
import { SnapJackLogo } from "../../components/SnapJackLogo";
import { ApplyForm } from "./ApplyForm";
import { SampleMenu } from "./SampleMenu";

export const dynamic = "force-dynamic";

const C = {
  bg0: "#08050a", bg1: "#110a08",
  line: "rgba(232,200,118,0.12)", lineS: "rgba(232,200,118,0.26)",
  gold: "#e8c876", goldDim: "#c89a4a",
  t100: "#fff8e8", t200: "#f0e0c0", t300: "#c8b890", t400: "#8b7d5e",
};

export default function QrMenuLandingPage() {
  const locale = getServerLocale();
  const copy = getServerCopy().qrMenuApply;

  return (
    <div style={{ minHeight: "100vh", background: C.bg0, color: C.t100, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px) saturate(160%)", background: "rgba(8,5,10,0.8)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center" }}><SnapJackLogo size={32} withWordmark /></Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" style={{ color: C.t300, fontSize: 13, fontWeight: 600, textDecoration: "none" }} className="qm-back">{copy.backHome}</Link>
            <LanguageToggle initialLocale={locale} />
            <a href="#basvuru" style={{ ...goldBtn, padding: "9px 16px", fontSize: 13 }}>{copy.ctaApply}</a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* ── Hero ── */}
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,420px)", gap: 48, alignItems: "center", padding: "64px 0 56px" }} className="qm-hero">
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase" }}>{copy.eyebrow}</div>
            <h1 style={{ margin: "14px 0 0", fontSize: "clamp(34px,5vw,52px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.02em" }}>{copy.title}</h1>
            <p style={{ margin: "20px 0 0", fontSize: 17, color: C.t300, lineHeight: 1.6, maxWidth: 540 }}>{copy.subtitle}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <a href="#basvuru" style={goldBtn}>{copy.ctaApply} →</a>
              <a href="#ornek" style={ghostBtn}>{copy.ctaSample}</a>
            </div>
          </div>
          <div id="ornek" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <SampleMenu locale={locale} />
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.t100 }}>{copy.showcaseTitle}</div>
                <div style={{ fontSize: 12.5, color: C.t400, marginTop: 2 }}>{copy.showcaseDesc}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: "8px 0 48px" }}>
          <h2 style={sectionTitle}>{copy.howTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 22 }} className="qm-steps">
            {copy.steps.map((s, i) => (
              <div key={i} style={card}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(232,200,118,0.12)", color: C.gold, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: C.t300, marginTop: 6, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Included + Deploy ── */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "8px 0 48px" }} className="qm-two">
          <div style={{ ...card, padding: 28 }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>{copy.benefitsTitle}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "grid", gap: 12 }}>
              {copy.benefits.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 14.5, color: C.t200, lineHeight: 1.5 }}>
                  <span style={{ color: C.gold, fontWeight: 800 }}>✓</span><span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ ...card, padding: 28 }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>{copy.deployTitle}</h2>
            <p style={{ fontSize: 14, color: C.t300, lineHeight: 1.55, margin: "12px 0 0" }}>{copy.deployDesc}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 10 }}>
              {copy.deployPoints.map((p, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: C.t200, lineHeight: 1.5 }}>
                  <span style={{ color: C.gold }}>◆</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Application form ── */}
        <section id="basvuru" style={{ padding: "8px 0 40px", scrollMarginTop: 80 }}>
          <div style={{ maxWidth: 560, margin: "0 auto", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.lineS}`, borderRadius: 20, padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>{copy.formTitle}</h2>
            <p style={{ fontSize: 13.5, color: C.t400, margin: "8px 0 6px", textAlign: "center", lineHeight: 1.5 }}>{copy.formDesc}</p>
            <p style={{ fontSize: 12.5, color: C.gold, margin: "0 0 18px", textAlign: "center" }}>{copy.priceNote}</p>
            <ApplyForm copy={copy} />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: "8px 0 48px", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ ...sectionTitle, textAlign: "center" }}>{copy.faqTitle}</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            {copy.faq.map((f, i) => (
              <details key={i} className="faq-item" style={{ background: C.bg1, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px" }}>
                <summary style={{ cursor: "pointer", fontSize: 15, fontWeight: 700, color: C.t100, listStyle: "none", display: "flex", justifyContent: "space-between", gap: 12 }}>
                  {f.q}<span style={{ color: C.gold }}>+</span>
                </summary>
                <p style={{ margin: "10px 0 0", fontSize: 14, color: C.t300, lineHeight: 1.6 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding: "20px 0 80px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 800, margin: 0 }}>{copy.finalCtaTitle}</h2>
          <div style={{ marginTop: 22 }}>
            <a href="#basvuru" style={{ ...goldBtn, padding: "15px 32px", fontSize: 15 }}>{copy.ctaApply} →</a>
          </div>
        </section>
      </main>

      <style>{`
        .faq-item summary::-webkit-details-marker{display:none;}
        .faq-item[open] summary > span:last-child{transform:rotate(45deg);display:inline-block;}
        @media(max-width:820px){
          .qm-hero{grid-template-columns:1fr!important;gap:36px!important;}
          .qm-steps{grid-template-columns:1fr 1fr!important;}
          .qm-two{grid-template-columns:1fr!important;}
        }
        @media(max-width:520px){
          .qm-back{display:none!important;}
          .qm-steps{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}

const goldBtn: React.CSSProperties = {
  background: "linear-gradient(160deg,#ffe9a8 0%,#e8c876 45%,#c89a4a 100%)",
  color: "#1a0f06", padding: "13px 24px", borderRadius: 11, fontSize: 14, fontWeight: 800,
  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
  boxShadow: "0 8px 22px -8px rgba(232,200,118,0.55)",
};
const ghostBtn: React.CSSProperties = {
  color: C.t300, border: `1px solid ${C.lineS}`, padding: "13px 22px", borderRadius: 11,
  fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center",
};
const sectionTitle: React.CSSProperties = { fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" };
const card: React.CSSProperties = {
  background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)`,
  border: `1px solid ${C.line}`, borderRadius: 16, padding: 20,
};
