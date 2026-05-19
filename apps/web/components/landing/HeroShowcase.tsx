"use client";

import { useState, useRef, useMemo, type CSSProperties } from "react";
import Link from "next/link";

/* ─── Bar (Jackpot) tokens ─── */
const C = {
  b300: "#e8c876", i100: "#fff8e8", i300: "#c8b890", i400: "#8b7d5e",
  e400: "#e8533a", lineS: "rgba(232,200,118,0.28)",
};

/* Slot reels — drink symbols (not gambling icons), doubled for seamless loop */
const REELS = [
  ["🍺", "🍷", "🍸", "🥃", "🍹", "🍺", "🍺", "🍷", "🍸", "🥃", "🍹", "🍺"],
  ["🍸", "🥃", "🍺", "🍹", "🍷", "🍸", "🍸", "🥃", "🍺", "🍹", "🍷", "🍸"],
  ["🍷", "🍹", "🥃", "🍺", "🍸", "🍷", "🍷", "🍹", "🥃", "🍺", "🍸", "🍷"],
];
const SYM_SIZE = "clamp(30px,4.6vw,56px)";

const BULBS = [
  ...Array.from({ length: 14 }, (_, i) => ({ x: `${5 + i * (90 / 13)}%`, y: "8px", d: i * 0.05 })),
  ...Array.from({ length: 14 }, (_, i) => ({ x: `${5 + i * (90 / 13)}%`, y: "calc(100% - 16px)", d: i * 0.05 + 0.7 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: "8px", y: `${5 + i * (90 / 7)}%`, d: i * 0.08 + 0.3 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: "calc(100% - 16px)", y: `${5 + i * (90 / 7)}%`, d: i * 0.08 + 1.1 })),
];

/* ─── Café (Çark) — bohemian wheel segments ─── */
const WHEEL_SEGMENTS = [
  { label: "Kahve", color: "#c17f5a", icon: "☕" },
  { label: "Olmadı", color: "#d4b896", icon: "✦" },
  { label: "Çay", color: "#7a9e7e", icon: "🍵" },
  { label: "Kruvasan", color: "#d4a0a0", icon: "🥐" },
  { label: "Pasta", color: "#a0704a", icon: "🍰" },
  { label: "Olmadı", color: "#d4b896", icon: "✦" },
  { label: "Kahvaltı", color: "#8a9a5b", icon: "🍳" },
  { label: "Sürpriz", color: "#c17f5a", icon: "⭐" },
];

type BarCopy = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  titleLine3: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
  metrics: { m1: string; m2: string; m3: string };
};

const CAFE_COPY = {
  tr: {
    eyebrow: "Kafeler için oyunlaştırılmış kampanya sistemi",
    t1: "Misafir fişini taratır.",
    t2: "Çark döner.",
    t3: "Kazanan misafir tekrar uğrar.",
    body: "Ödeme anını bir sadakat fırsatına dönüştürün. Siz kampanyayı kurarsınız — misafir çarkı çevirir, kazandığı indirim veya özel menüyü kullanmak için geri döner. Kim geldi, ne sıklıkla geldi, hangi kampanya tuttu — hepsini görürsünüz. Misafirinizi tanıdıkça teklifleriniz daha iyi, sadakatleri daha güçlü olur.",
    primary: "Mekanını bağla",
    secondary: "Nasıl çalışır",
    m1: "0₺ kurulum",
    m2: "Sıfır teknik bilgi",
    m3: "Mevcut QR menünüze entegre çalışır",
    venue: "Bahçe Kafé",
    tagline: "— küçük ikramlar bekliyor —",
  },
  en: {
    eyebrow: "Gamified campaign system for cafés",
    t1: "Your guest scans a receipt.",
    t2: "The wheel turns.",
    t3: "They win, they come back.",
    body: "Turn the moment of payment into a loyalty opportunity. You set the campaign — your guest spins, wins a discount or something special, and returns to use it. See who visits, how often, and which campaigns land. The better you know your guests, the better you make them feel at home.",
    primary: "Connect your venue",
    secondary: "How it works",
    m1: "0 setup fee",
    m2: "No technical knowledge",
    m3: "Works with your existing QR menu",
    venue: "Garden Café",
    tagline: "— little treats await —",
  },
} as const;

const HERO_CSS = `
@keyframes hero-wheel-spin { to { transform: rotate(360deg); } }
@keyframes sj-confetti { 0%{transform:translateY(-14vh) rotate(0deg);opacity:1} 80%{opacity:1} 100%{transform:translateY(96vh) rotate(720deg);opacity:0} }
.hero-showcase-track { transition: transform .55s cubic-bezier(.4,0,.2,1); }
.hero-dot { transition: all .2s; cursor: pointer; }
.hero-arrow { transition: opacity .15s, transform .15s; }
.hero-arrow:hover { transform: scale(1.08); }
`;

const CONFETTI_COLORS = ["#c17f5a", "#7a9e7e", "#d4a0a0", "#8a9a5b", "#e2b24f", "#f5efe0", "#d83a30"];
const PRIZE_SEGS = [0, 2, 3, 4, 6, 7]; // WHEEL_SEGMENTS prize indices (non-"Olmadı")

export function HeroShowcase({ locale, bar }: { locale: "tr" | "en"; bar: BarCopy }) {
  const [mode, setMode] = useState(0); // 0 = bar, 1 = café
  const drag = useRef<{ x: number; active: boolean }>({ x: 0, active: false });
  const cafe = CAFE_COPY[locale];

  // ── Café wheel: click-to-spin → lands on a prize → confetti ──
  const [wheelRot, setWheelRot] = useState(0);
  const [wheelPhase, setWheelPhase] = useState<"idle" | "spinning" | "won">("idle");
  const [wonSeg, setWonSeg] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.6,
        dur: 2.4 + Math.random() * 1.8,
        size: 7 + Math.random() * 8,
        round: Math.random() > 0.6,
      })),
    []
  );

  function spinWheel() {
    if (wheelPhase === "spinning") return;
    setConfetti(false);
    setWheelPhase("spinning");
    const seg = PRIZE_SEGS[Math.floor(Math.random() * PRIZE_SEGS.length)];
    const targetMod = (360 - seg * 45) % 360;
    setWheelRot((prev) => {
      let next = Math.ceil(prev / 360) * 360 + 5 * 360 + targetMod;
      while (next <= prev + 360) next += 360;
      return next;
    });
    window.setTimeout(() => {
      setWonSeg(seg);
      setWheelPhase("won");
      setConfetti(true);
      // clear confetti once the longest piece has fallen + faded
      window.setTimeout(() => setConfetti(false), 5200);
    }, 4700);
  }

  function onDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, active: true };
  }
  function onUp(e: React.PointerEvent) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    drag.current.active = false;
    if (dx < -55 && mode === 0) setMode(1);
    else if (dx > 55 && mode === 1) setMode(0);
  }

  return (
    <section
      className="hero-section"
      style={{ position: "relative", overflow: "hidden", touchAction: "pan-y" }}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => { drag.current.active = false; }}
    >
      <style>{HERO_CSS}</style>

      {/* ── Sliding track ── */}
      <div
        className="hero-showcase-track"
        style={{ display: "flex", width: "200%", transform: `translateX(-${mode * 50}%)` }}
      >
        {/* ═══ SLIDE 0 · BAR / JACKPOT ═══ */}
        <div style={{ width: "50%", flexShrink: 0, padding: "80px 0 116px" }}>
          <div
            className="container hero-grid"
            style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 60, alignItems: "center" }}
          >
            {/* Copy */}
            <div className="hero-copy">
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "0.24em", color: C.b300, textTransform: "uppercase" }}>
                {bar.eyebrow}
              </div>
              <h1 style={{ margin: "18px 0 0", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.0, color: C.i100, letterSpacing: "-0.01em" }}>
                {bar.titleLine1}<br />
                <span style={{ color: C.e400, fontStyle: "italic" }}>{bar.titleLine2}</span><br />
                <span style={{ color: C.b300 }}>{bar.titleLine3}</span>
              </h1>
              <p style={{ marginTop: 28, fontSize: "clamp(16px,1.3vw,18px)", lineHeight: 1.55, color: C.i300, maxWidth: 520 }}>
                {bar.body}
              </p>
              <div className="hero-actions" style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
                <Link href="/signup" className="btn-primary-lg">
                  {bar.primaryCta}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
                <a href="#how" className="btn-ghost-lg">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l5 4-5 4V3z" fill="currentColor" /></svg>
                  {bar.secondaryCta}
                </a>
              </div>
              <div className="hero-metrics" style={{ marginTop: 36, display: "flex", gap: 16, alignItems: "center", color: C.i300, fontSize: 13, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 600 }}>{bar.metrics.m1}</div>
                <div className="hero-metric-divider" style={{ width: 1, height: 16, background: C.lineS }} />
                <div style={{ fontWeight: 600 }}>{bar.metrics.m2}</div>
                <div className="hero-metric-divider" style={{ width: 1, height: 16, background: C.lineS }} />
                <div style={{ fontWeight: 600 }}>{bar.metrics.m3}</div>
              </div>
            </div>

            {/* Slot machine */}
            <div className="slot-stage" style={{ position: "relative", aspectRatio: "1 / 1.08", perspective: "1200px" }}>
              {[
                { top: "-24px", left: "10%", delay: "0s", size: 32 },
                { top: "16%", right: "-16px", delay: "1.2s", size: 22 },
                { bottom: "6%", left: "-12px", delay: "2.5s", size: 27 },
              ].map((c, i) => (
                <div key={i} style={{
                  position: "absolute",
                  ...Object.fromEntries(Object.entries(c).filter(([k]) => ["top", "bottom", "left", "right"].includes(k))) as CSSProperties,
                  width: c.size, height: c.size, borderRadius: "50%",
                  background: "radial-gradient(circle at 32% 28%, #fff4d4 0%, #e8c876 42%, #b8862e 100%)",
                  boxShadow: "0 8px 16px rgba(232,200,118,0.4), inset 0 2px 3px rgba(255,255,255,0.65), inset 0 -2px 4px rgba(90,60,16,0.5)",
                  animation: `coin-float 5s ease-in-out ${c.delay} infinite`,
                  zIndex: 10,
                }}>
                  {/* inner ring — token rim */}
                  <div style={{
                    position: "absolute", inset: "16%", borderRadius: "50%",
                    border: "1.5px solid rgba(120,80,20,0.45)",
                  }} />
                </div>
              ))}

              <div data-slot-cabinet style={{
                position: "absolute", inset: 0, borderRadius: 28,
                background: "linear-gradient(160deg, #4a2e14 0%, #2a1808 50%, #1a0f06 100%)",
                boxShadow: "inset 0 2px 0 rgba(232,200,118,0.4), inset 0 -2px 8px rgba(0,0,0,0.6), 0 60px 100px -30px rgba(0,0,0,0.8), 0 0 0 2px rgba(232,200,118,0.2)",
                padding: 24, display: "flex", flexDirection: "column",
                transform: "rotateY(-6deg) rotateX(2deg)", transformStyle: "preserve-3d",
              }}>
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

                <div style={{
                  textAlign: "center", padding: "12px 0",
                  borderBottom: "2px solid rgba(232,200,118,0.22)",
                  fontFamily: "'Playfair Display', serif", fontWeight: 900,
                  color: C.b300, letterSpacing: "0.1em",
                  fontSize: "clamp(14px,1.8vw,20px)",
                  textShadow: "0 0 12px rgba(232,200,118,0.4)",
                }}>★ JACKPOT ★</div>

                <div style={{
                  flex: 1, marginTop: 18,
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
                  background: "linear-gradient(180deg, #08050a 0%, #1a0f08 100%)",
                  borderRadius: 10, padding: "12px 10px",
                  boxShadow: "inset 0 4px 16px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(232,200,118,0.25)",
                  position: "relative", overflow: "hidden",
                }}>
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
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)", position: "relative",
                    }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.5) 100%)", zIndex: 3, pointerEvents: "none" }} />
                      <div className={`reel-strip-${ri}`}>
                        {syms.map((sym, si) => (
                          <div key={si} style={{
                            aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: SYM_SIZE,
                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                            borderBottom: "1px solid rgba(232,200,118,0.06)",
                          }}>{sym}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 16, padding: "12px 10px",
                  background: "linear-gradient(180deg, #2a1808 0%, #1a0f06 100%)",
                  borderRadius: 8, textAlign: "center",
                  border: "1px solid rgba(232,200,118,0.2)",
                  fontFamily: "'Bebas Neue', sans-serif", color: C.b300,
                  letterSpacing: "0.18em", fontSize: 13,
                }}>★ MIDNIGHT TAP · TONIGHT ★</div>

                <div data-slot-lever style={{ position: "absolute", right: -16, top: "28%", width: 28, height: 90, zIndex: 5 }}>
                  <div style={{
                    position: "absolute", left: 6, top: 0, width: 14, height: "100%",
                    background: "linear-gradient(90deg, #4a3414 0%, #8b6a30 50%, #4a3414 100%)",
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
        </div>

        {/* ═══ SLIDE 1 · CAFÉ / ÇARK (bohemian) ═══ */}
        <div style={{
          width: "50%", flexShrink: 0, padding: "80px 0 116px",
          background: "radial-gradient(70% 55% at 50% 0%, #faf3e4 0%, #f1e7d2 60%, #ebe0c8 100%)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Confetti */}
          {confetti && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 30, overflow: "hidden" }}>
              {confettiPieces.map((p) => (
                <div key={p.id} style={{
                  position: "absolute", top: 0, left: `${p.left}%`,
                  width: p.size, height: p.round ? p.size : p.size * 1.4,
                  background: p.color, borderRadius: p.round ? "50%" : 2,
                  animation: `sj-confetti ${p.dur}s ${p.delay}s linear forwards`,
                }} />
              ))}
            </div>
          )}
          <div
            className="container hero-grid"
            style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 60, alignItems: "center" }}
          >
            {/* Copy */}
            <div className="hero-copy">
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, fontWeight: 700, letterSpacing: "0.04em", color: "#a0704a" }}>
                {cafe.eyebrow}
              </div>
              <h1 style={{ margin: "10px 0 0", fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: "clamp(48px, 7vw, 84px)", lineHeight: 0.98, color: "#3a2410", letterSpacing: "-0.005em" }}>
                {cafe.t1}<br />
                <span style={{ color: "#c17f5a" }}>{cafe.t2}</span><br />
                <span style={{ color: "#7a9e7e" }}>{cafe.t3}</span>
              </h1>
              <p style={{ marginTop: 22, fontSize: "clamp(16px,1.3vw,18px)", lineHeight: 1.6, color: "#6b4423", maxWidth: 520 }}>
                {cafe.body}
              </p>
              <div className="hero-actions" style={{ display: "flex", gap: 14, marginTop: 36, flexWrap: "wrap" }}>
                <Link href="/signup" style={{
                  background: "#c17f5a", color: "#f5efe0",
                  padding: "15px 32px", borderRadius: 999,
                  fontFamily: "'Caveat', cursive", fontSize: 22, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 10,
                  border: "2px solid #8b5e3c",
                  boxShadow: "3px 3px 0 #8b5e3c",
                }}>
                  {cafe.primary}
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
                <a href="#how" style={{
                  color: "#3a2410", border: "1.5px solid rgba(58,36,16,0.3)",
                  padding: "14px 26px", borderRadius: 999,
                  fontFamily: "'Caveat', cursive", fontSize: 20, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l5 4-5 4V3z" fill="currentColor" /></svg>
                  {cafe.secondary}
                </a>
              </div>
              <div className="hero-metrics" style={{ marginTop: 32, display: "flex", gap: 14, alignItems: "center", color: "#8a6a4a", fontSize: 15, flexWrap: "wrap", fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
                <div>{cafe.m1}</div>
                <div className="hero-metric-divider" style={{ width: 1, height: 16, background: "rgba(58,36,16,0.2)" }} />
                <div>{cafe.m2}</div>
                <div className="hero-metric-divider" style={{ width: 1, height: 16, background: "rgba(58,36,16,0.2)" }} />
                <div>{cafe.m3}</div>
              </div>
            </div>

            {/* Bohemian wheel */}
            <div className="slot-stage" style={{ position: "relative", aspectRatio: "1 / 1.08", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              {/* Venue label */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 30, fontWeight: 700, color: "#3a2410" }}>{cafe.venue}</div>
                <div style={{ fontSize: 12, color: "#8a6a4a", fontStyle: "italic", letterSpacing: "0.06em" }}>{cafe.tagline}</div>
              </div>

              {/* Wheel */}
              <div style={{ position: "relative", width: "min(96%, 440px)", aspectRatio: "1" }}>
                {/* Pointer */}
                <div style={{
                  position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "16px solid transparent", borderRight: "16px solid transparent",
                  borderTop: "32px solid #6b4423", zIndex: 6,
                  filter: "drop-shadow(0 3px 3px rgba(58,36,16,0.35))",
                }} />
                {/* Wood rim */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "radial-gradient(circle, #8b5e3c 0%, #6b4423 70%, #4a2d14 100%)",
                  boxShadow: "0 22px 48px -12px rgba(58,36,16,0.5), inset 0 2px 6px rgba(255,255,255,0.18)",
                }} />
                {/* Spinning face */}
                <div style={{
                  position: "absolute", inset: "6.5%", borderRadius: "50%",
                  background: `conic-gradient(from -22.5deg, ${WHEEL_SEGMENTS.map((s, i) => `${s.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(", ")})`,
                  transform: `rotate(${wheelRot}deg)`,
                  transition: wheelPhase === "spinning" ? "transform 4.6s cubic-bezier(.16,.7,.18,1)" : "none",
                  boxShadow: "inset 0 0 0 3px rgba(245,239,224,0.55)",
                }}>
                  {WHEEL_SEGMENTS.map((s, i) => (
                    <div key={i} style={{
                      position: "absolute", inset: 0,
                      display: "flex", justifyContent: "center", alignItems: "flex-start",
                      paddingTop: "13%",
                      transform: `rotate(${i * 45}deg)`,
                    }}>
                      <span style={{
                        fontSize: "clamp(15px, 2.6vw, 24px)",
                        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))",
                      }}>{s.icon}</span>
                    </div>
                  ))}
                  {/* Dividers */}
                  {WHEEL_SEGMENTS.map((_, i) => (
                    <div key={`d${i}`} style={{
                      position: "absolute", top: "50%", left: "50%", width: "50%", height: 1.5,
                      background: "rgba(245,239,224,0.7)",
                      transformOrigin: "left center",
                      transform: `rotate(${i * 45 - 22.5}deg)`,
                    }} />
                  ))}
                </div>
                {/* Center hub */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: "24%", height: "24%", transform: "translate(-50%,-50%)",
                  borderRadius: "50%", background: "#f5efe0",
                  border: "3px solid #6b4423",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "clamp(18px,3.5vw,30px)", zIndex: 4,
                  boxShadow: "0 4px 10px rgba(58,36,16,0.3)",
                }}>🌿</div>
              </div>

              {/* Win message */}
              <div style={{
                minHeight: 26, marginTop: 4, fontFamily: "'Caveat', cursive",
                fontSize: 24, fontWeight: 700, color: "#7a9e7e",
                opacity: wheelPhase === "won" ? 1 : 0, transition: "opacity .3s",
              }}>
                {wonSeg != null && (locale === "tr"
                  ? `${WHEEL_SEGMENTS[wonSeg].label} kazandın!`
                  : `You won ${WHEEL_SEGMENTS[wonSeg].label}!`)}
              </div>

              {/* Spin button */}
              <button
                onClick={spinWheel}
                disabled={wheelPhase === "spinning"}
                style={{
                  marginTop: 2, padding: "13px 38px", borderRadius: 999,
                  background: "#c17f5a", color: "#f5efe0",
                  fontFamily: "'Caveat', cursive", fontSize: 25, fontWeight: 700,
                  border: "2px solid #8b5e3c", boxShadow: "3px 3px 0 #8b5e3c",
                  cursor: wheelPhase === "spinning" ? "default" : "pointer",
                  opacity: wheelPhase === "spinning" ? 0.6 : 1,
                }}>
                {wheelPhase === "spinning"
                  ? (locale === "tr" ? "dönüyor…" : "spinning…")
                  : wheelPhase === "won"
                  ? (locale === "tr" ? "Tekrar çevir ✦" : "Spin again ✦")
                  : (locale === "tr" ? "Çevir! ✦" : "Spin! ✦")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Arrows ── */}
      {mode === 1 && (
        <button
          aria-label="bar"
          className="hero-arrow"
          onClick={() => setMode(0)}
          style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
            background: "rgba(58,36,16,0.14)", border: "1.5px solid rgba(58,36,16,0.3)",
            color: "#3a2410", fontSize: 20, zIndex: 20,
          }}
        >‹</button>
      )}
      {mode === 0 && (
        <button
          aria-label="cafe"
          className="hero-arrow"
          onClick={() => setMode(1)}
          style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
            background: "rgba(232,200,118,0.1)", border: "1.5px solid rgba(232,200,118,0.3)",
            color: "#e8c876", fontSize: 20, zIndex: 20,
          }}
        >›</button>
      )}

      {/* ── Bar / Café segmented toggle ── */}
      <div style={{
        position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6, padding: 6, borderRadius: 999, zIndex: 20,
        background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}>
        {[
          { label: "Bar", on: "#e8c876", fg: "#1a0f06" },
          { label: locale === "tr" ? "Kafe" : "Café", on: "#c17f5a", fg: "#f5efe0" },
        ].map((d, i) => (
          <button
            key={i}
            className="hero-dot"
            onClick={() => setMode(i)}
            style={{
              padding: "13px 44px", borderRadius: 999, cursor: "pointer",
              fontSize: 16, fontWeight: 800, border: "none",
              background: mode === i ? d.on : "transparent",
              color: mode === i ? d.fg : "rgba(255,255,255,0.6)",
            }}
          >{d.label}</button>
        ))}
      </div>
    </section>
  );
}
