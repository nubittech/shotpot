import Link from "next/link";
import { createClient } from "../lib/supabase/server-rsc";

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
  .benefits-grid,.stats-grid,.flow,.foot-grid{grid-template-columns:1fr!important;}
  .flow-line{display:none!important;}
  .cta-band{padding:40px 24px!important;}
  .container{padding:0 20px!important;}
}
`;

export default async function HomePage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();

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
            <span style={{ fontWeight: 700, fontSize: 16, color: C.i100, letterSpacing: "0.01em" }}>Jackpot</span>
          </Link>

          {/* Nav links */}
          <div className="nav-links-wrap" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="#how" className="nav-link">Nasıl çalışır</a>
            <a href="#benefits" className="nav-link">Faydalar</a>
            <a href="#pricing" className="nav-link">Fiyatlar</a>
            <a href="#faq" className="nav-link">SSS</a>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {user ? (
              <Link href="/dashboard" className="btn-primary">Panele Git</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Giriş yap</Link>
                <Link href="/signup" className="btn-primary">
                  Mekanını bağla
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section style={{ padding: "80px 0 120px", position: "relative", overflow: "hidden" }}>
        <div className="container hero-grid" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Left copy */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>
              Barlar için sadakat çarkı · B2B
            </div>
            <h1 style={{ margin: "18px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.0, color: C.i100, letterSpacing: "-0.01em" }}>
              Müşteri fişini taratır.<br/>
              <span style={{ color: C.e400, fontStyle: "italic" }}>Çark döner.</span><br/>
              <span style={{ color: C.b300 }}>Bara geri gelir.</span>
            </h1>
            <p style={{ marginTop: 28, fontSize: "clamp(16px,1.3vw,18px)", lineHeight: 1.55, color: C.i300, maxWidth: 520 }}>
              Jackpot, fişten doğan ikinci bir tur. Her ödeme sonrası müşteriniz
              slot makinesini çevirir; kazandığı ikram sadece sizin barınızda geçerlidir.
              Sadakat — eğlenceli, şeffaf, anında.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-primary-lg">
                Mekanını bağla
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <a href="#how" className="btn-ghost-lg">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l5 4-5 4V3z" fill="currentColor"/></svg>
                Nasıl çalışır
              </a>
            </div>
            <div style={{ marginTop: 36, display: "flex", gap: 24, alignItems: "center", color: C.i400, fontSize: 13, flexWrap: "wrap" }}>
              <div><strong style={{ color: C.b300, fontWeight: 700 }}>40+</strong> bar İstanbul&apos;da</div>
              <div style={{ width: 1, height: 20, background: C.lineS }} />
              <div><strong style={{ color: C.b300, fontWeight: 700 }}>%34</strong> ortalama tekrar ziyaret</div>
              <div style={{ width: 1, height: 20, background: C.lineS }} />
              <div><strong style={{ color: C.b300, fontWeight: 700 }}>0₺</strong> kurulum ücreti</div>
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
            <div style={{
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
              <div style={{ position: "absolute", right: -16, top: "28%", width: 28, height: 90, zIndex: 5 }}>
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
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>Nasıl çalışır</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100, letterSpacing: "-0.01em" }}>Dört adımda ikinci tur</h2>
            <p style={{ margin: "18px auto 0", maxWidth: 560, fontSize: 17, color: C.i300, lineHeight: 1.6 }}>
              Müşteri zaten ödedi. Şimdi geri gelmesi için bir sebep daha verelim.
            </p>
          </div>

          <div className="flow" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, position: "relative" }}>
            {/* Dashed connecting line */}
            <div className="flow-line" style={{
              position: "absolute", top: 36, left: "8%", right: "8%", height: 2,
              background: `repeating-linear-gradient(90deg, ${C.lineS} 0, ${C.lineS} 4px, transparent 4px, transparent 10px)`,
            }} />
            {[
              { n: "1", title: "Fişini tarat", desc: "Müşteri masada ödediği fişi telefon kamerasıyla okutur. OCR doğrular." },
              { n: "2", title: "Çarkı çevir", desc: "Bir spin hakkı kazanır. Kolu çeker, slot makinesi döner — anlık eğlence." },
              { n: "3", title: "İkram düşer", desc: "Bedava içecek, indirim, mezenin yanında ekstra. Hep sizin barınızdan." },
              { n: "4", title: "Geri gelir", desc: "Kupon QR olarak telefonda. Garson okutur, biter. Veriyi siz görürsünüz." },
            ].map((s) => (
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
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>Bar sahipleri için</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100, letterSpacing: "-0.01em" }}>Reklam değil — tekrar.</h2>
            <p style={{ margin: "18px auto 0", maxWidth: 560, fontSize: 17, color: C.i300, lineHeight: 1.6 }}>
              Yeni müşteri bulmak pahalı. Geleni geri getirmek, akıllı.
            </p>
          </div>

          <div className="benefits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "★", title: "Sadakat, eğlenceli olduğunda işler", desc: "Klasik puan kart sıkıcı. Slot makinesi anlık dopamin — müşteri arkadaşına da gösterir, organik trafik." },
              { icon: "▣", title: "Sıfır kurulum, sıfır donanım", desc: "POS değiştirmeyin, tablet eklemeyin. Müşteri kendi telefonundan girer. Siz dashboard'dan kuponları görürsünüz." },
              { icon: "↑", title: "Her şeyi siz kontrol edersiniz", desc: "Kazanma oranı, ikram havuzu, geçerlilik süresi — hepsi sizin elinizde. Riskli görseniz kapatırsınız." },
              { icon: "⏱", title: "Sessiz saatlerde otomatik kampanya", desc: "Salı 22:00'de kazanma şansı 2x — müşterilere bildirim gider. Ölü saatler dolar, planlı." },
              { icon: "◈", title: "Gerçek müşteri verisi", desc: "Kim ne içiyor, hangi gün geliyor, kaç defa döndü. Kararları artık tahminle değil, veriyle alın." },
              { icon: "◉", title: "Kendi markanızla, kendi sayfanızda", desc: "jackpot.bar/komun gibi link verin. Müşteri direkt sizin slotunuza gelir, başka bara değil." },
            ].map((b) => (
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
          {[
            { num: "40+", label: "Aktif mekan", sub: "İstanbul, Ankara, İzmir" },
            { num: "%34", label: "Tekrar ziyaret artışı", sub: "İlk 90 gün ortalaması" },
            { num: "180k+", label: "Toplam spin", sub: "Son 12 ay" },
            { num: "%92", label: "Kupon kullanım oranı", sub: "7 gün içinde" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(36px,5vw,62px)", color: C.b300, lineHeight: 1, textShadow: "0 0 24px rgba(232,200,118,0.3)" }}>{s.num}</div>
              <div style={{ marginTop: 8, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em", fontSize: 13, color: C.i400, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: C.i300 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" style={{ padding: "100px 0" }}>
        <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>Fiyatlandırma</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100 }}>Basit, şeffaf fiyatlar</h2>
            <p style={{ margin: "18px auto 0", maxWidth: 520, fontSize: 17, color: C.i300, lineHeight: 1.6 }}>
              İlk 30 gün ücretsiz. Kart bilgisi istemiyoruz.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, maxWidth: 760, margin: "0 auto" }}>
            {/* Kampanya */}
            <div style={{ background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)`, border: `1px solid ${C.line}`, borderRadius: 20, padding: "32px 28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: C.i400, textTransform: "uppercase", marginBottom: 8 }}>Kampanya</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 40, color: C.i100, lineHeight: 1 }}>
                $14<span style={{ fontSize: 15, color: C.i400, fontWeight: 600 }}>/ay</span>
              </div>
              <p style={{ fontSize: 14, color: C.i400, margin: "14px 0 24px", lineHeight: 1.55 }}>Anonim oyun akışı. Müşteri hesabı yok, basit kupon dağıtımı.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: C.i300 }}>
                {["Sınırsız fiş tarama","AI ile fiş doğrulama","3 slot tasarımı","Garson redemption paneli","Temel istatistikler"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.green, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? "/dashboard" : "/signup?plan=kampanya"} style={{
                display: "block", textAlign: "center", padding: "13px",
                borderRadius: 12, border: `1px solid ${C.lineS}`,
                color: C.b300, fontSize: 14, fontWeight: 600,
              }}>
                {user ? "Panelde Başla" : "Ücretsiz Başla"}
              </Link>
            </div>

            {/* Pro */}
            <div style={{
              background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)`,
              border: `2px solid ${C.b300}`,
              borderRadius: 20, padding: "32px 28px",
              boxShadow: `0 0 40px rgba(232,200,118,0.12)`,
              position: "relative",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: C.b300, textTransform: "uppercase" }}>Pro</div>
                <span style={{ padding: "3px 10px", borderRadius: 999, background: C.b300, color: "#1a0f06", fontSize: 10, fontWeight: 800 }}>POPÜLER</span>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 40, color: C.i100, lineHeight: 1 }}>
                $36<span style={{ fontSize: 15, color: C.i400, fontWeight: 600 }}>/ay</span>
              </div>
              <p style={{ fontSize: 14, color: C.i400, margin: "14px 0 24px", lineHeight: 1.55 }}>Müşteri hesabı + sadakat sistemi + kampanya gönderimi.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: C.i300 }}>
                {["Kampanya planındaki her şey","Müşteri hesapları (e-posta giriş)","Profil + kupon geçmişi","Sadakat seviyesi","Kampanya gönderici","Detaylı analytics","CSV export"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.b300, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? "/dashboard" : "/signup?plan=pro"} className="btn-primary-lg" style={{ display: "block", textAlign: "center", justifyContent: "center" }}>
                {user ? "Pro&apos;ya Geç" : "Pro Hesap Aç"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" style={{ padding: "100px 0" }}>
        <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>Sorular</div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(30px,4vw,52px)", color: C.i100 }}>Sık sorulanlar</h2>
          </div>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { q: "Maliyeti ne? Kurulum var mı?", a: "Kurulum ücretsiz. Aylık sabit bir abonelik ya da spin başına küçük bir ücret — mekanınızın boyutuna göre seçersiniz. İlk 30 gün deneme, kart bilgisi istemiyoruz." },
              { q: "Müşteri uygulama indirmek zorunda mı?", a: "Hayır. QR kod ile mobil web sayfası açılır, fişini tarar, çarkı çevirir. İsteyen telefon ana ekranına ekler — ayrı bir app yok." },
              { q: "Kazanma oranını biz mi belirliyoruz?", a: "Evet, tamamen. İkram havuzu, kazanma yüzdesi, hangi ürünün ne sıklıkla çıkacağı — dashboard'dan ayarlanır. Anlık değiştirebilirsiniz." },
              { q: "Yasal olarak kumar değil mi?", a: "Hayır. Müşteri çark için para yatırmaz; zaten ödediği fişin yan ürünü olarak hak kazanır. Bu, yasal sadakat programıdır — Starbucks'ın yıldızlarıyla aynı kategoride." },
              { q: "Mevcut POS sistemimle nasıl entegre olur?", a: "Entegre olmasına gerek yok. Müşteri fotoğraftan okur, OCR doğrular. İsteğe bağlı olarak Adisyo, Ikas, Doping gibi sistemlerle API entegrasyonu da var." },
              { q: "Kuponları garson nasıl okur?", a: "Müşteri telefonundaki QR'ı garsona gösterir. Garson kendi mobil panelinden okutur, otomatik düşülür." },
            ].map((f, i) => (
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
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>İlk spin sizden</div>
          <h2 style={{ margin: "12px 0 16px", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(28px,4vw,48px)", color: C.i100, letterSpacing: "-0.01em" }}>
            Mekanınızı bu hafta bağlayın.<br/>Cuma akşamı yayında olun.
          </h2>
          <p style={{ fontSize: 17, maxWidth: 520, margin: "0 auto 32px", color: C.i300, lineHeight: 1.6 }}>
            5 dakikada hesap, aynı gün test, ilk hafta sonunda gerçek müşteri verisi.
          </p>
          <Link href="/signup" className="btn-primary-lg">
            Mekanını bağla
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
                <span style={{ fontWeight: 700, fontSize: 15, color: C.i100 }}>Jackpot</span>
              </Link>
              <p style={{ marginTop: 16, maxWidth: 300, fontSize: 14, color: C.i400, lineHeight: 1.6 }}>Bar ve mekanlar için sadakat çarkı. İstanbul, Karaköy.</p>
            </div>
            <div>
              <h5 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.b300, letterSpacing: "0.18em", margin: "0 0 16px" }}>Ürün</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["#how","Nasıl çalışır"],["#benefits","Faydalar"],["#stats","Rakamlar"],["#faq","SSS"]].map(([h,l])=>(
                  <a key={h} href={h} className="foot-link">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.b300, letterSpacing: "0.18em", margin: "0 0 16px" }}>Bar sahipleri</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["/login","Dashboard girişi"],["/signup","Mekan bağla"],["#faq","SSS"]].map(([h,l])=>(
                  <Link key={h} href={h} className="foot-link">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.b300, letterSpacing: "0.18em", margin: "0 0 16px" }}>İletişim</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="mailto:hello@jackpot.bar" className="foot-link">hello@jackpot.bar</a>
                <a href="#" className="foot-link">Karaköy, İstanbul</a>
                <a href="#" className="foot-link">Instagram · @jackpot.bar</a>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: `1px solid ${C.line}`, fontSize: 13, color: C.i500, flexWrap: "wrap", gap: 12 }}>
            <div>© 2026 Jackpot. Tüm hakları saklıdır.</div>
            <div style={{ display: "flex", gap: 22 }}>
              <Link href="/privacy" className="foot-link">Gizlilik</Link>
              <Link href="/terms" className="foot-link">Şartlar</Link>
              <Link href="/refund" className="foot-link">İade</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
