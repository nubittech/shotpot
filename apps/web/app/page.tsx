import Link from "next/link";
import { createClient } from "../lib/supabase/server-rsc";
import { getServerCopy, getServerLocale } from "../lib/i18n/server";
import { LanguageToggle } from "../components/LanguageToggle";
import { LandingPricing } from "./LandingPricing";
import { HeroShowcase } from "../components/landing/HeroShowcase";
import { SnapJackLogo } from "../components/SnapJackLogo";

/* ─── Design tokens ─── */
const C = {
  bg0: "#08050a", bg1: "#110a08", bg2: "#1a0f0a",
  line: "rgba(232,200,118,0.12)", lineS: "rgba(232,200,118,0.28)",
  b300: "#e8c876", b400: "#c89a4a", b500: "#8b6a30",
  i100: "#fff8e8", i200: "#f0e0c0", i300: "#c8b890",
  i400: "#8b7d5e", i500: "#5a4f3a",
  e300: "#ff8a4a", e400: "#e8533a", e500: "#c81e35",
  green: "#7be38a",
};

/* Slot symbols per reel — doubled for seamless loop */
const REELS = [
  ["7","♥","BAR","★","7","♥","7","♥","BAR","★","7","♥"],
  ["BAR","7","★","♥","BAR","7","BAR","7","★","♥","BAR","7"],
  ["♥","BAR","7","7","★","♥","♥","BAR","7","7","★","♥"],
];
const symColor = (s: string) =>
  s === "7" ? C.b300 : s === "♥" ? C.e400 : s === "★" ? "#f7d83a" : C.i300;
const symSize = (s: string) => s === "BAR" ? "clamp(13px,1.8vw,18px)" : "clamp(26px,4vw,52px)";

/* Bulbs — 14 top, 14 bottom, 8 left, 8 right */
const BULBS = [
  ...Array.from({length:14},(_,i)=>({ x:`${5+i*(90/13)}%`, y:"8px", d: i*0.05 })),
  ...Array.from({length:14},(_,i)=>({ x:`${5+i*(90/13)}%`, y:"calc(100% - 16px)", d: i*0.05+0.7 })),
  ...Array.from({length:8},(_,i)=>({ x:"8px", y:`${5+i*(90/7)}%`, d: i*0.08+0.3 })),
  ...Array.from({length:8},(_,i)=>({ x:"calc(100% - 16px)", y:`${5+i*(90/7)}%`, d: i*0.08+1.1 })),
];

/* Animations CSS */
const CSS = `
:root{--b300:#e8c876;--b400:#c89a4a;--i300:#c8b890;--i400:#8b7d5e;--i500:#5a4f3a;
  --bg0:#08050a;--bg1:#110a08;--line:rgba(232,200,118,0.12);--lineS:rgba(232,200,118,0.28);}
*{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{margin:0;padding:0;background:#08050a;color:#f0e0c0;font-family:var(--font-inter),Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(60% 40% at 50% 0%,rgba(232,200,118,0.07),transparent 70%),radial-gradient(40% 30% at 80% 60%,rgba(200,30,53,0.05),transparent 70%);pointer-events:none;z-index:0;}
a{text-decoration:none;}
@keyframes reel-roll{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
@keyframes reel-roll-2{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
@keyframes reel-roll-3{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
@keyframes bulb-pulse{0%,100%{opacity:.35;box-shadow:0 0 4px rgba(232,200,118,0.4)}50%{opacity:1;box-shadow:0 0 14px rgba(232,200,118,0.9)}}
@keyframes lever-pulse{0%,100%{transform:translateY(0)}40%,60%{transform:translateY(36px)}}
@keyframes coin-float{0%,100%{transform:translateY(0) rotate(0deg);opacity:.85}50%{transform:translateY(-28px) rotate(180deg);opacity:1}}
@keyframes shine{0%,100%{opacity:0}50%{opacity:.06}}
.reel-strip-0{animation:reel-roll 3.5s cubic-bezier(.15,.7,.25,1) infinite;}
.reel-strip-1{animation:reel-roll-2 4.2s cubic-bezier(.15,.7,.25,1) .15s infinite;}
.reel-strip-2{animation:reel-roll-3 5s cubic-bezier(.15,.7,.25,1) .3s infinite;}
.benefit-card:hover{transform:translateY(-4px);border-color:rgba(232,200,118,0.28)!important;}
.benefit-card{transition:transform .2s,border-color .2s;}
.faq-item[open]{border-color:rgba(232,200,118,0.28)!important;}
.faq-item .faq-icon{transition:transform .2s;}
.faq-item[open] .faq-icon{transform:rotate(45deg);}
.nav-link{color:#c8b890;font-size:14px;font-weight:500;transition:color .15s;}
.nav-link:hover{color:#e8c876;}
.foot-link{color:#c8b890;font-size:14px;transition:color .15s;}
.foot-link:hover{color:#e8c876;}
.btn-ghost{color:#c8b890;border:1px solid rgba(232,200,118,0.2);padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;transition:border-color .15s,color .15s;}
.btn-ghost:hover{border-color:#e8c876;color:#e8c876;}
.btn-primary{background:linear-gradient(160deg,#f0d690 0%,#c89a4a 50%,#8b6a30 100%);color:#1a0f06;padding:11px 22px;border-radius:10px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px;box-shadow:inset 0 1px 0 rgba(255,244,212,0.6),0 4px 14px -4px rgba(232,200,118,0.4);}
.btn-primary-lg{background:linear-gradient(160deg,#f0d690 0%,#c89a4a 50%,#8b6a30 100%);color:#1a0f06;padding:15px 32px;border-radius:12px;font-size:15px;font-weight:700;display:inline-flex;align-items:center;gap:10px;box-shadow:inset 0 1px 0 rgba(255,244,212,0.6),inset 0 -1px 0 rgba(74,52,20,0.5),0 8px 24px -8px rgba(232,200,118,0.5);}
.btn-ghost-lg{color:#c8b890;border:1px solid rgba(232,200,118,0.22);padding:14px 28px;border-radius:12px;font-size:15px;font-weight:600;display:inline-flex;align-items:center;gap:8px;}
.btn-ghost-lg:hover{border-color:#e8c876;color:#e8c876;}
@media(max-width:900px){
  .hero-grid{grid-template-columns:1fr!important;}
  .slot-stage{max-width:360px;margin:0 auto;}
  .benefits-grid,.stats-grid,.flow,.foot-grid{grid-template-columns:1fr 1fr!important;}
  .nav-links-wrap{display:none!important;}
}
@media(max-width:560px){
  nav .container{height:auto!important;min-height:60px;gap:12px;padding:10px 18px!important;}
  nav .container > div:last-child{gap:8px!important;}
  nav .container > a:first-child span{font-size:15px!important;}
  nav .container > a:first-child div{width:30px!important;height:30px!important;font-size:15px!important;}
  .btn-ghost,.btn-primary{padding:9px 12px!important;font-size:12px!important;}
  .hero-section{padding:76px 0 70px!important;}
  .hero-grid{gap:34px!important;}
  .hero-copy{position:relative;z-index:1;}
  .hero-copy h1{font-size:clamp(38px, 13vw, 54px)!important;line-height:1.02!important;margin-top:16px!important;}
  .hero-copy p{font-size:15px!important;line-height:1.55!important;margin-top:20px!important;}
  .hero-actions{margin-top:28px!important;display:grid!important;grid-template-columns:1fr!important;}
  .hero-actions a{justify-content:center!important;width:100%;}
  .hero-metrics{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;margin-top:26px!important;}
  .hero-metric-divider{display:none!important;}
  .slot-stage{display:none!important;}
  .slot-stage [data-slot-cabinet]{padding:18px!important;border-radius:22px!important;}
  .slot-stage [data-slot-lever]{display:none!important;}
  .benefits-grid,.stats-grid,.flow,.foot-grid{grid-template-columns:1fr!important;}
  .flow-line{display:none!important;}
  section{padding-top:68px!important;padding-bottom:68px!important;}
  .cta-band{padding:40px 24px!important;}
  .container{padding:0 20px!important;}
}
@media(max-width:430px){
  nav .container{padding:10px 14px!important;}
  .btn-ghost{display:none!important;}
  .btn-primary{padding:10px 14px!important;}
  .hero-section{padding-top:58px!important;}
  .hero-copy h1{font-size:40px!important;}
}
`;

export default async function HomePage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const locale = getServerLocale();
  const copy = getServerCopy();
  const landing = copy.landing;
  const common = copy.common;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ═══════ NAV ═══════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        background: "rgba(8,5,10,0.78)",
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <SnapJackLogo size={36} withWordmark />
          </Link>

          {/* Nav links */}
          <div className="nav-links-wrap" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="#how" className="nav-link">{landing.nav.how}</a>
            <a href="#benefits" className="nav-link">{landing.nav.benefits}</a>
            <a href="#pricing" className="nav-link">{landing.nav.pricing}</a>
            <a href="#faq" className="nav-link">{landing.nav.faq}</a>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <LanguageToggle initialLocale={locale} />
            {user ? (
              <Link href="/dashboard" className="btn-primary">{common.goDashboard}</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">{common.login}</Link>
                <Link href="/signup" className="btn-primary">
                  {common.connectVenue}
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <HeroShowcase locale={locale} bar={landing.hero} />

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how" style={{ padding: "100px 0", position: "relative" }}>
        <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>{landing.how.eyebrow}</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100, letterSpacing: "-0.01em" }}>{landing.how.title}</h2>
            <p style={{ margin: "18px auto 0", maxWidth: 560, fontSize: 17, color: C.i300, lineHeight: 1.6 }}>
              {landing.how.body}
            </p>
          </div>

          <div className="flow" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, position: "relative" }}>
            {/* Dashed connecting line */}
            <div className="flow-line" style={{
              position: "absolute", top: 36, left: "8%", right: "8%", height: 2,
              background: `repeating-linear-gradient(90deg, ${C.lineS} 0, ${C.lineS} 4px, transparent 4px, transparent 10px)`,
            }} />
            {landing.how.steps.map((s) => (
              <div key={s.n} style={{ position: "relative", textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, margin: "0 auto 20px",
                  borderRadius: "50%",
                  background: `linear-gradient(160deg, #2a1808, #08050a)`,
                  border: `2px solid ${C.b300}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 28, color: C.b300,
                  position: "relative", zIndex: 1,
                  boxShadow: `0 0 0 8px #08050a, 0 0 20px rgba(232,200,118,0.25)`,
                }}>{s.n}</div>
                <h4 style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 17, color: C.i100 }}>{s.title}</h4>
                <p style={{ margin: 0, fontSize: 14, color: C.i400, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ BENEFITS ═══════ */}
      <section id="benefits" style={{ padding: "100px 0", background: "linear-gradient(180deg, transparent, rgba(232,200,118,0.02), transparent)" }}>
        <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(30px,5vw,52px)", letterSpacing: "0.16em", color: C.b300, textTransform: "uppercase", lineHeight: 1.05 }}>{landing.benefits.eyebrow}</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100, letterSpacing: "-0.01em" }}>{landing.benefits.title}</h2>
            <p style={{ margin: "18px auto 0", maxWidth: 560, fontSize: 17, color: C.i300, lineHeight: 1.6 }}>
              {landing.benefits.body}
            </p>
          </div>

          <div className="benefits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {landing.benefits.cards.map((b) => (
              <div key={b.title} className="benefit-card" style={{
                padding: "36px 28px", borderRadius: 18,
                background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)`,
                border: `1px solid ${C.line}`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.b300}, transparent)`, opacity: 0.4 }} />
                <div style={{
                  width: 52, height: 52, borderRadius: 13,
                  background: "linear-gradient(160deg, rgba(232,200,118,0.14), rgba(232,200,118,0.04))",
                  border: `1px solid ${C.lineS}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 22, color: C.b300, fontSize: 22,
                }}>{b.icon}</div>
                <h3 style={{ margin: "0 0 10px", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "clamp(16px,1.4vw,20px)", color: C.i100, lineHeight: 1.25 }}>{b.title}</h3>
                <p style={{ margin: 0, fontSize: 15, color: C.i400, lineHeight: 1.65 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PANEL ═══════ */}
      <section id="panel" style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "100px 0", background: "linear-gradient(180deg, transparent, rgba(232,200,118,0.03), transparent)" }}>
        <div className="container hero-grid" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1fr 1.12fr", gap: 56, alignItems: "center" }}>
          {/* Left — copy */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>{landing.panel.eyebrow}</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(28px,3.6vw,46px)", color: C.i100, letterSpacing: "-0.01em", lineHeight: 1.08 }}>{landing.panel.title}</h2>
            <p style={{ marginTop: 20, fontSize: "clamp(15px,1.2vw,17px)", lineHeight: 1.6, color: C.i300, maxWidth: 480 }}>{landing.panel.body}</p>
            <ul style={{ listStyle: "none", margin: "26px 0 0", padding: 0, display: "grid", gap: 12 }}>
              {landing.panel.features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, color: C.i200, lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: "rgba(232,200,118,0.12)", border: `1px solid ${C.lineS}`, color: C.b300, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          {/* Right — dashboard mockup */}
          <DashboardPreview locale={locale} />
        </div>
      </section>

      <LandingPricing signedIn={Boolean(user)} copyText={copy} />

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" style={{ padding: "100px 0" }}>
        <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>{landing.nav.faq}</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100 }}>{landing.faq.title}</h2>
          </div>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {landing.faq.items.map((f, i) => (
              <details key={i} className="faq-item" style={{
                background: C.bg1, border: `1px solid ${C.line}`,
                borderRadius: 14, overflow: "hidden",
              }}>
                <summary style={{
                  listStyle: "none", cursor: "pointer",
                  padding: "20px 24px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontWeight: 600, color: C.i100, fontSize: 16,
                  userSelect: "none",
                }}>
                  {f.q}
                  <span className="faq-icon" style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(232,200,118,0.1)", color: C.b300,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>+</span>
                </summary>
                <div style={{ padding: "0 24px 22px", color: C.i300, lineHeight: 1.65, fontSize: 15 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA BAND ═══════ */}
      <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px 80px" }}>
        <div className="cta-band" style={{
          padding: "64px 56px", borderRadius: 28, textAlign: "center",
          background: `radial-gradient(60% 80% at 80% 50%, rgba(200,30,53,0.18), transparent 70%),
                       radial-gradient(50% 70% at 20% 50%, rgba(232,200,118,0.16), transparent 70%),
                       linear-gradient(180deg, #1a0f08 0%, #08050a 100%)`,
          border: `1px solid ${C.lineS}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>{landing.cta.eyebrow}</div>
          <h2 style={{ margin: "12px 0 16px", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(28px,4vw,48px)", color: C.i100, letterSpacing: "-0.01em" }}>
            {landing.cta.titleLine1}<br/>{landing.cta.titleLine2}
          </h2>
          <p style={{ fontSize: 17, maxWidth: 520, margin: "0 auto 32px", color: C.i300, lineHeight: 1.6 }}>
            {landing.cta.body}
          </p>
          <Link href="/signup" className="btn-primary-lg">
            {common.connectVenue}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "48px 0 32px", color: C.i400 }}>
        <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <div className="foot-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 40 }}>
            <div>
              <Link href="/" style={{ display: "flex", alignItems: "center" }}>
                <SnapJackLogo size={32} withWordmark />
              </Link>
              <p style={{ marginTop: 16, maxWidth: 300, fontSize: 14, color: C.i400, lineHeight: 1.6 }}>{landing.footer.description}</p>
            </div>
            <div>
              <h5 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.b300, letterSpacing: "0.18em", margin: "0 0 16px" }}>{landing.footer.product}</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["#how",landing.nav.how],["#benefits",landing.nav.benefits],["#panel",landing.footer.stats],["#faq",landing.nav.faq]].map(([h,l])=>(
                  <a key={h} href={h} className="foot-link">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.b300, letterSpacing: "0.18em", margin: "0 0 16px" }}>{landing.footer.owners}</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["/login",landing.footer.dashboardLogin],["/signup",landing.footer.connectVenue],["#faq",landing.nav.faq]].map(([h,l])=>(
                  <Link key={h} href={h} className="foot-link">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.b300, letterSpacing: "0.18em", margin: "0 0 16px" }}>{landing.footer.contact}</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="mailto:hello@jackpot.bar" className="foot-link">hello@jackpot.bar</a>
                {landing.footer.location && <a href="#" className="foot-link">{landing.footer.location}</a>}
                <a href="#" className="foot-link">Instagram · @jackpot.bar</a>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: `1px solid ${C.line}`, fontSize: 13, color: C.i500, flexWrap: "wrap", gap: 12 }}>
            <div>{landing.footer.rights}</div>
            <div style={{ display: "flex", gap: 22 }}>
              <Link href="/privacy" className="foot-link">{landing.footer.privacy}</Link>
              <Link href="/terms" className="foot-link">{landing.footer.terms}</Link>
              <Link href="/refund" className="foot-link">{landing.footer.refund}</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ─── Dashboard preview mockup (landing visual) ─── */
function DashboardPreview({ locale }: { locale: "tr" | "en" }) {
  const tr = locale === "tr";
  const venueName = tr ? "Pasaj Bar" : "The Copper Tap";
  const t = {
    analytics: tr ? "Analitik" : "Analytics",
    live: tr ? "CANLI" : "LIVE",
    chart: tr ? "Son 7 gün — fiş" : "Last 7 days — receipts",
    topCustomers: tr ? "En iyi müşteriler" : "Top customers",
  };
  const kpis = tr
    ? [
        { v: "11",   l: "Toplam fiş",    c: C.b300 },
        { v: "₺820", l: "30g ciro",      c: "#a78bfa" },
        { v: "%45",  l: "Kazanma oranı", c: C.green },
        { v: "8",    l: "Aktif kupon",   c: C.e300 },
      ]
    : [
        { v: "11",    l: "Receipts",      c: C.b300 },
        { v: "$820",  l: "30d revenue",   c: "#a78bfa" },
        { v: "%45",   l: "Win rate",      c: C.green },
        { v: "8",     l: "Active coupons",c: C.e300 },
      ];
  const bars = [30, 52, 41, 68, 47, 90, 60];
  const days = tr
    ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = tr
    ? [
        { n: "Mert B.", tier: "🥇", spend: "₺1.240", w: "82%" },
        { n: "Elif K.", tier: "🥈", spend: "₺680",   w: "54%" },
        { n: "Can A.",  tier: "🥉", spend: "₺310",   w: "28%" },
      ]
    : [
        { n: "James W.", tier: "🥇", spend: "$1,240", w: "82%" },
        { n: "Sarah M.", tier: "🥈", spend: "$680",   w: "54%" },
        { n: "David L.", tier: "🥉", spend: "$310",   w: "28%" },
      ];

  return (
    <div className="slot-stage" style={{
      borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(180deg, #15100a, #0c0907)",
      border: `1px solid ${C.lineS}`,
      boxShadow: `0 40px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,200,118,0.06)`,
    }}>
      {/* Window chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderBottom: `1px solid ${C.line}`, background: "rgba(255,255,255,0.02)" }}>
        {["#e8533a", "#e8c876", "#7be38a"].map((c) => (
          <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />
        ))}
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.i400, fontFamily: "monospace" }}>
          panel.shotpot.app
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 16, color: C.i100 }}>
            {venueName} <span style={{ color: C.i400, fontWeight: 400 }}>— {t.analytics}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: "0.08em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} /> {t.live}
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
          {kpis.map((k) => (
            <div key={k.l} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 19, color: k.c }}>{k.v}</div>
              <div style={{ marginTop: 3, fontSize: 8.5, color: C.i400, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px 8px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.i400, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{t.chart}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 64 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: "100%", height: `${h}%`, borderRadius: "4px 4px 0 0",
                  background: i === 5 ? `linear-gradient(180deg, ${C.b300}, ${C.b500})` : "rgba(232,200,118,0.18)",
                }} />
                <div style={{ fontSize: 8, color: C.i500 }}>{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top customers */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 10, color: C.i400, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{t.topCustomers}</div>
          {rows.map((r, i) => (
            <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13 }}>{r.tier}</span>
              <span style={{ flex: 1, fontSize: 12, color: C.i200, fontWeight: 600 }}>{r.n}</span>
              <span style={{ width: 56, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                <span style={{ position: "absolute", inset: 0, width: r.w, background: `linear-gradient(90deg, ${C.b500}, ${C.b300})`, borderRadius: 3 }} />
              </span>
              <span style={{ fontSize: 12, color: C.b300, fontWeight: 700, width: 52, textAlign: "right" }}>{r.spend}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
