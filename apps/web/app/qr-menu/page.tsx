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

      {/* ── Why QR menu — 5 value features (cream, full-width) ── */}
      <section style={{ background: "#f7f3ec", color: "#1a140d" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "66px 24px 64px", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#c89a4a", textTransform: "uppercase" }}>{copy.whyEyebrow}</div>
          <h2 style={{ fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 800, margin: "10px 0 0", color: "#1a140d", letterSpacing: "-0.01em" }}>{copy.whyTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 24, marginTop: 46 }} className="qm-feat">
            {copy.features.map((f, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 66, height: 66, margin: "0 auto", borderRadius: "50%", background: "linear-gradient(180deg,#efe7d8,#e2d5be)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a6a2e", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" }}>
                  {FEATURE_ICONS[i]}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 16, color: "#1a140d" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#6b5e49", marginTop: 8, lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", background: "#000" }}>

        {/* ── Editor showcase (dark): text left, editor mockup right ── */}
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr)", gap: 44, alignItems: "center", padding: "66px 0 56px" }} className="qm-two">
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase" }}>{copy.editorEyebrow}</div>
            <h2 style={{ ...sectionTitle, marginTop: 12, fontSize: "clamp(24px,3.2vw,34px)", lineHeight: 1.15 }}>{copy.editorTitle}</h2>
            <p style={{ fontSize: 15, color: C.t300, lineHeight: 1.6, margin: "16px 0 0", maxWidth: 420 }}>{copy.editorDesc}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 26px", display: "grid", gap: 12 }}>
              {copy.editorTicks.map((t, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, color: C.t200, fontWeight: 600 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,200,118,0.15)", color: C.gold, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✓</span>{t}
                </li>
              ))}
            </ul>
            <ApplyCta variant="gold" />
          </div>
          <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.lineS}`, boxShadow: "0 30px 70px -28px rgba(0,0,0,0.9), 0 0 0 1px rgba(232,200,118,0.06)", background: "#0a0a0c" }}>
            <img src="/qrmenu/editor.png" alt="" style={{ width: "100%", height: "auto", display: "block" }} />
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
          .qm-feat{grid-template-columns:repeat(3,1fr)!important;row-gap:36px!important;}
          .qm-two{grid-template-columns:1fr!important;}
        }
        @media(max-width:520px){
          .qm-back{display:none!important;}
          .qm-feat{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>
    </div>
  );
}

const sectionTitle: React.CSSProperties ={ fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" };

const FEATURE_ICONS = [
  // Upload menu design — image
  <svg key="0" width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.4"/><path d="M5 18l4.5-4.5 3 3L16 13l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // Edit — pencil
  <svg key="1" width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13.5 7.5l3 3" stroke="currentColor" strokeWidth="1.6"/></svg>,
  // Share via QR — phone
  <svg key="2" width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M10.5 5.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><rect x="9.5" y="9" width="2.5" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/><path d="M13 12.5h1.5V14M14.5 9v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  // Update instantly — clock
  <svg key="3" width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6"/><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // Track performance — bar chart
  <svg key="4" width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><rect x="6" y="11" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="7" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="16" y="13" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>,
];
