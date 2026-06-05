import Link from "next/link";
import { getServerCopy, getServerLocale } from "../../lib/i18n/server";
import { LanguageToggle } from "../../components/LanguageToggle";
import { SnapJackLogo } from "../../components/SnapJackLogo";
import { ApplyCta } from "./ApplyCta";

export const dynamic = "force-dynamic";

const C = {
  bg0: "#08050a", bg1: "#110a08",
  line: "rgba(232,200,118,0.12)", lineS: "rgba(232,200,118,0.26)",
  gold: "#e8c876", t100: "#fff8e8", t200: "#f0e0c0", t300: "#c8b890", t400: "#8b7d5e",
};

export default function QrMenuLandingPage() {
  const locale = getServerLocale();
  const copy = getServerCopy().qrMenuApply;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: C.t100, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 60, backdropFilter: "blur(20px) saturate(160%)", background: "rgba(0,0,0,0.7)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center" }}><SnapJackLogo size={32} withWordmark /></Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" style={{ color: C.t300, fontSize: 13, fontWeight: 600, textDecoration: "none" }} className="qm-back">{copy.backHome}</Link>
            <LanguageToggle initialLocale={locale} />
            <ApplyCta variant="small" />
          </div>
        </div>
      </header>

      {/* ── Hero: image right-aligned on black, text left ── */}
      <section className="qm-hero" style={{ position: "relative", background: "#000", overflow: "hidden" }}>
        {/* Right photographic composition */}
        <div className="qm-hero-img" style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "60%" }}>
          <img src="/qrmenu/hero.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "right center", display: "block" }} />
          {/* fade the image's left edge into the black so text stays legible */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 14%, rgba(0,0,0,0.25) 42%, transparent 70%)" }} />
        </div>

        {/* Left text */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
          <div className="qm-hero-copy" style={{ maxWidth: 540, padding: "92px 0 96px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 999, background: "rgba(232,200,118,0.1)", border: `1px solid ${C.line}`, fontSize: 12.5, fontWeight: 700, color: C.t200 }}>
              ♥ {copy.eyebrow}
            </div>
            <h1 style={{ margin: "20px 0 0", fontSize: "clamp(36px,5.4vw,58px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em" }}>
              {copy.heroLine1}<br />{copy.heroLine2}<br /><span style={{ color: C.gold }}>{copy.heroLine3}</span>
            </h1>
            <p style={{ margin: "22px 0 0", fontSize: 17, color: C.t300, lineHeight: 1.6, maxWidth: 460 }}>{copy.subtitle}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, margin: "26px 0 0" }}>
              {copy.heroTicks.map((t, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: C.t200, fontWeight: 600 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(232,200,118,0.15)", color: C.gold, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✓</span>{t}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <ApplyCta variant="gold" />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 34 }}>
              <div style={{ display: "flex" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,#c89a4a,#8b6a30)`, border: "2px solid #000", marginLeft: i ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>★★★★★ 4.9/5</div>
                <div style={{ fontSize: 12, color: C.t400 }}>{copy.socialProof}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", background: "#000" }}>
        {/* ── How it works ── */}
        <section id="nasil" style={{ padding: "62px 0 48px", scrollMarginTop: 80 }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase" }}>{copy.eyebrow}</div>
            <h2 style={{ ...sectionTitle, marginTop: 8 }}>{copy.howTitle}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="qm-steps">
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
        <section style={{ padding: "20px 0 84px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 800, margin: "0 0 22px" }}>{copy.finalCtaTitle}</h2>
          <div style={{ display: "inline-flex" }}><ApplyCta variant="gold" /></div>
        </section>
      </main>

      <style>{`
        .qm-hero{min-height:660px;}
        .faq-item summary::-webkit-details-marker{display:none;}
        .faq-item[open] summary > span:last-child{transform:rotate(45deg);display:inline-block;}
        @media(max-width:900px){
          .qm-hero-img{position:relative!important;width:100%!important;height:300px!important;}
          .qm-hero{min-height:0!important;}
          .qm-hero-copy{padding:48px 0 40px!important;max-width:none!important;}
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

const sectionTitle: React.CSSProperties ={ fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" };
const card: React.CSSProperties = {
  background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)`,
  border: `1px solid ${C.line}`, borderRadius: 16, padding: 20,
};
