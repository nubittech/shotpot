import Link from "next/link";
import { createClient } from "../lib/supabase/server-rsc";
import { getServerCopy, getServerLocale } from "../lib/i18n/server";
import { LanguageToggle } from "../components/LanguageToggle";
import { LandingPricing } from "./LandingPricing";

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
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(160deg, #e8c876, #5a3414)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Playfair Display', serif", fontWeight: 900,
              color: "#1a0f06", fontSize: 17,
            }}>J</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: C.i100, letterSpacing: "0.01em" }}>{copy.meta.brand}</span>
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
      <section className="hero-section" style={{ padding: "80px 0 120px", position: "relative", overflow: "hidden" }}>
        <div className="container hero-grid" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Left copy */}
          <div className="hero-copy">
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>
              {landing.hero.eyebrow}
            </div>
            <h1 style={{ margin: "18px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.0, color: C.i100, letterSpacing: "-0.01em" }}>
              {landing.hero.titleLine1}<br/>
              <span style={{ color: C.e400, fontStyle: "italic" }}>{landing.hero.titleLine2}</span><br/>
              <span style={{ color: C.b300 }}>{landing.hero.titleLine3}</span>
            </h1>
            <p style={{ marginTop: 28, fontSize: "clamp(16px,1.3vw,18px)", lineHeight: 1.55, color: C.i300, maxWidth: 520 }}>
              {landing.hero.body}
            </p>
            <div className="hero-actions" style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-primary-lg">
                {landing.hero.primaryCta}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <a href="#how" className="btn-ghost-lg">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l5 4-5 4V3z" fill="currentColor"/></svg>
                {landing.hero.secondaryCta}
              </a>
            </div>
            <div className="hero-metrics" style={{ marginTop: 36, display: "flex", gap: 24, alignItems: "center", color: C.i400, fontSize: 13, flexWrap: "wrap" }}>
              <div><strong style={{ color: C.b300, fontWeight: 700 }}>40+</strong> {landing.hero.metrics.activeBars}</div>
              <div className="hero-metric-divider" style={{ width: 1, height: 20, background: C.lineS }} />
              <div><strong style={{ color: C.b300, fontWeight: 700 }}>%34</strong> {landing.hero.metrics.repeatVisit}</div>
              <div className="hero-metric-divider" style={{ width: 1, height: 20, background: C.lineS }} />
              <div><strong style={{ color: C.b300, fontWeight: 700 }}>0₺</strong> {landing.hero.metrics.setupFee}</div>
            </div>
          </div>

          {/* Right: Slot machine */}
          <div className="slot-stage" style={{ position: "relative", aspectRatio: "1 / 1.08", perspective: "1200px" }}>
            {/* Floating coins */}
            {[
              { top: "-18px", left: "12%", delay: "0s", sym: "$", size: 24 },
              { top: "18%", right: "-10px", delay: "1.2s", sym: "★", size: 18, fontSize: 10 },
              { bottom: "8%", left: "-6px", delay: "2.5s", sym: "7", size: 20, fontSize: 11 },
            ].map((c, i) => (
              <div key={i} style={{
                position: "absolute", ...Object.fromEntries(Object.entries(c).filter(([k])=>["top","bottom","left","right"].includes(k))) as React.CSSProperties,
                width: c.size, height: c.size, borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #fff4d4, #c89a4a)",
                boxShadow: "0 8px 16px rgba(232,200,118,0.4), inset 0 0 0 1px rgba(0,0,0,0.3)",
                animation: `coin-float 5s ease-in-out ${c.delay} infinite`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display', serif", fontWeight: 900,
                color: "#2a1808", fontSize: c.fontSize ?? 13, zIndex: 10,
              }}>{c.sym}</div>
            ))}

            {/* Cabinet */}
            <div data-slot-cabinet style={{
              position: "absolute", inset: 0,
              borderRadius: 28,
              background: "linear-gradient(160deg, #4a2e14 0%, #2a1808 50%, #1a0f06 100%)",
              boxShadow: `inset 0 2px 0 rgba(232,200,118,0.4), inset 0 -2px 8px rgba(0,0,0,0.6), 0 60px 100px -30px rgba(0,0,0,0.8), 0 0 0 2px rgba(232,200,118,0.2)`,
              padding: 24,
              display: "flex", flexDirection: "column",
              transform: "rotateY(-6deg) rotateX(2deg)",
              transformStyle: "preserve-3d",
            }}>
              {/* Bulbs */}
              {BULBS.map((b, i) => (
                <div key={i} style={{
                  position: "absolute", left: b.x, top: b.y,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "radial-gradient(circle, #fff4d4, #e8c876 50%, #8b6a30)",
                  boxShadow: "0 0 8px rgba(232,200,118,0.8)",
                  animation: `bulb-pulse 1.4s ease-in-out ${b.d}s infinite`,
                  pointerEvents: "none",
                }} />
              ))}

              {/* Marquee */}
              <div style={{
                textAlign: "center", padding: "12px 0",
                borderBottom: `2px solid rgba(232,200,118,0.22)`,
                fontFamily: "'Playfair Display', serif", fontWeight: 900,
                color: C.b300, letterSpacing: "0.1em",
                fontSize: "clamp(14px,1.8vw,20px)",
                textShadow: `0 0 12px rgba(232,200,118,0.4)`,
              }}>
                ★ JACKPOT ★
              </div>

              {/* Reels housing */}
              <div style={{
                flex: 1, marginTop: 18,
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
                background: "linear-gradient(180deg, #08050a 0%, #1a0f08 100%)",
                borderRadius: 10, padding: "12px 10px",
                boxShadow: `inset 0 4px 16px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(232,200,118,0.25)`,
                position: "relative", overflow: "hidden",
              }}>
                {/* Win-line glow */}
                <div style={{
                  position: "absolute", left: 0, right: 0, top: "50%",
                  height: 52, transform: "translateY(-50%)",
                  background: "linear-gradient(180deg, transparent, rgba(232,200,118,0.05) 50%, transparent)",
                  pointerEvents: "none", zIndex: 2,
                }} />

                {REELS.map((syms, ri) => (
                  <div key={ri} style={{
                    background: "linear-gradient(180deg, #2a1808 0%, #1a0f06 100%)",
                    borderRadius: 5, overflow: "hidden",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
                    position: "relative",
                  }}>
                    {/* Inner shadow top/bottom */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.5) 100%)", zIndex: 3, pointerEvents: "none" }} />
                    <div className={`reel-strip-${ri}`}>
                      {syms.map((sym, si) => (
                        <div key={si} style={{
                          aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Playfair Display', serif", fontWeight: 900,
                          fontSize: symSize(sym),
                          color: symColor(sym),
                          textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                          borderBottom: `1px solid rgba(232,200,118,0.06)`,
                          letterSpacing: sym === "BAR" ? "0.04em" : 0,
                        }}>{sym}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Base */}
              <div style={{
                marginTop: 16, padding: "12px 10px",
                background: "linear-gradient(180deg, #2a1808 0%, #1a0f06 100%)",
                borderRadius: 8, textAlign: "center",
                border: `1px solid rgba(232,200,118,0.2)`,
                fontFamily: "'Bebas Neue', sans-serif", color: C.b300,
                letterSpacing: "0.18em", fontSize: 13,
              }}>
                ★ MIDNIGHT TAP · TONIGHT ★
              </div>

              {/* Lever */}
              <div data-slot-lever style={{ position: "absolute", right: -16, top: "28%", width: 28, height: 90, zIndex: 5 }}>
                <div style={{
                  position: "absolute", left: 6, top: 0, width: 14, height: "100%",
                  background: `linear-gradient(90deg, #4a3414 0%, #8b6a30 50%, #4a3414 100%)`,
                  borderRadius: 7, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)",
                }} />
                <div style={{
                  position: "absolute", left: -1, top: 6,
                  width: 32, height: 32, borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #ff8a4a, #c81e35 60%, #5a0a14)",
                  boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.5), 0 8px 16px rgba(200,30,53,0.4)",
                  animation: "lever-pulse 2.5s ease-in-out infinite",
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

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
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>{landing.benefits.eyebrow}</div>
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

      {/* ═══════ STATS ═══════ */}
      <section id="stats" style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "80px 0", background: "linear-gradient(180deg, transparent, rgba(232,200,118,0.03), transparent)" }}>
        <div className="container stats-grid" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, textAlign: "center" }}>
          {landing.stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(36px,5vw,62px)", color: C.b300, lineHeight: 1, textShadow: "0 0 24px rgba(232,200,118,0.3)" }}>{s.num}</div>
              <div style={{ marginTop: 8, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em", fontSize: 13, color: C.i400, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: C.i300 }}>{s.sub}</div>
            </div>
          ))}
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
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(160deg, #e8c876, #5a3414)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontWeight: 900, color: "#1a0f06", fontSize: 14 }}>J</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: C.i100 }}>{copy.meta.brand}</span>
              </Link>
              <p style={{ marginTop: 16, maxWidth: 300, fontSize: 14, color: C.i400, lineHeight: 1.6 }}>{landing.footer.description}</p>
            </div>
            <div>
              <h5 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.b300, letterSpacing: "0.18em", margin: "0 0 16px" }}>{landing.footer.product}</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["#how",landing.nav.how],["#benefits",landing.nav.benefits],["#stats",landing.footer.stats],["#faq",landing.nav.faq]].map(([h,l])=>(
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
                <a href="#" className="foot-link">{landing.footer.location}</a>
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
