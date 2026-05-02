"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlotMachine } from "../../../components/SlotMachine";
import { createClient } from "../../../lib/supabase/browser";
import type { PlayBundle } from "../../../lib/play";
import type { SlotVariantDB } from "../../../lib/supabase/types";

type SpinResponse = {
  outcome: string;
  win: boolean;
  isJackpot: boolean;
  coupon: { id: string; code: string; rewardLabel: string } | null;
  animationHint: "standard" | "win" | "jackpot";
};

type Stage = "home" | "auth" | "scan" | "play" | "coupon";

/* ─── Theme palettes ─── */
type Theme = {
  bg: string;
  accent: string;
  accent2: string;
  text: string;
  muted: string;
  border: string;
  font: string;
  btnBg: string;
  btnText: string;
  glow: string;
  receiptTint: string;
  cardBg: string;
  navBg: string;
  themeLabel: string;
};

const THEMES: Record<SlotVariantDB, Theme> = {
  v1: {
    bg: "radial-gradient(120% 80% at 50% 0%,#2c1908 0%,#150803 70%,#08030a 100%)",
    accent: "#e8c876", accent2: "#c81e35",
    text: "#fff8e0", muted: "rgba(232,200,118,0.55)",
    border: "rgba(232,200,118,0.25)",
    font: "'Playfair Display', Georgia, serif",
    btnBg: "#e8c876", btnText: "#2c1908",
    glow: "rgba(232,200,118,0.4)",
    receiptTint: "linear-gradient(180deg, rgba(232,200,118,0.08), rgba(200,30,53,0.04))",
    cardBg: "rgba(255,255,255,0.05)",
    navBg: "rgba(15,8,2,0.95)",
    themeLabel: "BRASS & WALNUT",
  },
  v2: {
    bg: "linear-gradient(160deg,#1a0228 0%,#0a0014 100%)",
    accent: "#ff2d8a", accent2: "#00e8ff",
    text: "#fbeaff", muted: "rgba(0,232,255,0.65)",
    border: "rgba(255,45,138,0.35)",
    font: "'Bebas Neue', 'Impact', sans-serif",
    btnBg: "#ff2d8a", btnText: "#fff",
    glow: "rgba(255,45,138,0.55)",
    receiptTint: "linear-gradient(180deg, rgba(255,45,138,0.08), rgba(0,232,255,0.04))",
    cardBg: "rgba(255,255,255,0.04)",
    navBg: "rgba(8,0,16,0.97)",
    themeLabel: "NEON ROOM",
  },
  v3: {
    bg: "radial-gradient(80% 60% at 50% 30%,#1a1408 0%,#0a0805 70%,#050402 100%)",
    accent: "#caa14a", accent2: "#f5d27a",
    text: "#f5d27a", muted: "rgba(202,161,74,0.6)",
    border: "rgba(202,161,74,0.3)",
    font: "'Cinzel', Georgia, serif",
    btnBg: "#caa14a", btnText: "#1a1408",
    glow: "rgba(202,161,74,0.4)",
    receiptTint: "linear-gradient(180deg, rgba(202,161,74,0.06), rgba(245,210,122,0.03))",
    cardBg: "rgba(255,255,255,0.04)",
    navBg: "rgba(4,3,1,0.97)",
    themeLabel: "MEMBERS FLOOR",
  },
};

function getOrCreateGuestToken() {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem("rr_guest_token");
  if (!t) { t = crypto.randomUUID(); localStorage.setItem("rr_guest_token", t); }
  return t;
}

type RecentCoupon = { id: string; rewardLabel: string; code: string };
type ScannedInfo  = { amount: number; currency: string; time: string } | null;

export function PlayClient({ bundle }: { bundle: PlayBundle }) {
  const { venue, config } = bundle;
  const router = useRouter();
  const variant = (config.variant ?? "v1") as SlotVariantDB;
  const theme   = THEMES[variant] ?? THEMES.v1;
  const isPro   = (venue as unknown as { tier?: string }).tier === "pro";

  const [stage, setStage]           = useState<Stage>("home");
  const [tokens, setTokens]         = useState(0);
  const [spinning, setSpinning]     = useState(false);
  const [result, setResult]         = useState<SpinResponse | null>(null);
  const [guestToken, setGuestToken] = useState("");
  const [receiptId, setReceiptId]   = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [recentCoupons, setRecentCoupons] = useState<RecentCoupon[]>([]);
  const [scannedInfo, setScannedInfo]     = useState<ScannedInfo>(null);

  useEffect(() => { setGuestToken(getOrCreateGuestToken()); }, []);

  // Pro: check existing login + fetch recent coupons
  useEffect(() => {
    if (!isPro) return;
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const res = await fetch("/api/play/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: venue.slug }),
      });
      if (res.ok) {
        const data = await res.json() as { customer: { id: string } };
        setCustomerId(data.customer.id);
        // Fetch last 3 coupons for "Last Week" section
        const r2 = await fetch(`/api/profile/coupons?customerId=${data.customer.id}`);
        if (r2.ok) {
          const d2 = await r2.json() as { coupons: Array<{ id: string; reward_label: string; code: string }> };
          setRecentCoupons((d2.coupons ?? []).slice(0, 3).map((c) => ({
            id: c.id, rewardLabel: c.reward_label, code: c.code,
          })));
        }
      }
    });
  }, [isPro, venue.slug]);

  async function pullLever() {
    if (spinning || tokens < 1) return;
    setSpinning(true);
    setResult(null);
    try {
      const res = await fetch("/api/play/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: venue.slug, guestToken, receiptId, customerId: customerId ?? undefined }),
      });
      await new Promise((r) => setTimeout(r, 1600));
      if (!res.ok) { setSpinning(false); return; }
      const data = (await res.json()) as SpinResponse;
      setResult(data);
      setTokens((t) => Math.max(0, t - 1));
    } catch { /* silent */ }
    finally { setSpinning(false); }
  }

  function handleScanComplete(earnedTokens: number, newReceiptId: string, info: ScannedInfo) {
    setTokens(earnedTokens);
    setReceiptId(newReceiptId);
    setScannedInfo(info);
    setStage("play");
  }

  function handleJackpotPress() {
    if (tokens > 0) { setStage("play"); return; }
    if (isPro && !customerId) { setStage("auth"); return; }
    setStage("scan");
  }

  /* ─── Stage routing ─── */
  if (stage === "auth") {
    return (
      <CustomerAuthScreen
        venue={venue} theme={theme}
        onBack={() => setStage("home")}
        onSuccess={(cid) => { setCustomerId(cid); setStage("scan"); }}
      />
    );
  }

  if (stage === "scan") {
    return (
      <ScanScreen
        venue={venue} theme={theme}
        guestToken={guestToken} customerId={customerId}
        onComplete={handleScanComplete}
        onBack={() => setStage("home")}
      />
    );
  }

  if (stage === "coupon" && result?.coupon) {
    return (
      <CouponScreen
        venue={venue} theme={theme} coupon={result.coupon}
        onBack={() => { setResult(null); setStage("play"); }}
        onDone={() => { setResult(null); setStage("home"); }}
      />
    );
  }

  if (stage === "play") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000" }}>
        <SlotMachine
          tokens={tokens} outcome={result?.outcome ?? null}
          animationHint={result?.animationHint ?? null}
          logoSymbol={venue.name.slice(0, 2).toUpperCase()}
          spinning={spinning} canSpin={tokens > 0 && !spinning}
          onSpin={pullLever} variant={config.variant} venueName={venue.name}
          onBack={() => setStage("home")} onReset={() => setResult(null)}
          onShowCoupon={() => result?.coupon && setStage("coupon")}
          onExit={() => { setResult(null); setStage("home"); }}
        />
      </div>
    );
  }

  // stage === "home"
  return (
    <HomeScreen
      venue={venue} theme={theme} isPro={isPro}
      customerId={customerId} tokens={tokens}
      scannedInfo={scannedInfo} recentCoupons={recentCoupons}
      onJackpot={handleJackpotPress}
      onProfile={() => router.push(`/profile/${venue.slug}`)}
    />
  );
}

/* ═══════════════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════════════ */
function HomeScreen({ venue, theme, isPro, customerId, tokens, scannedInfo, recentCoupons, onJackpot, onProfile }: {
  venue: PlayBundle["venue"]; theme: Theme;
  isPro: boolean; customerId: string | null;
  tokens: number; scannedInfo: ScannedInfo;
  recentCoupons: RecentCoupon[];
  onJackpot: () => void;
  onProfile: () => void;
}) {
  const hasEarned = scannedInfo !== null;
  const currSym = scannedInfo?.currency === "USD" ? "$" : scannedInfo?.currency === "EUR" ? "€" : "₺";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: theme.bg, color: theme.text,
      fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "48px 20px 100px" }}>

        {/* ── Venue header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
            color: theme.accent, textTransform: "uppercase",
            fontFamily: theme.font, marginBottom: 6,
          }}>
            {theme.themeLabel}
          </div>
          <h1 style={{
            margin: 0, fontFamily: theme.font,
            fontSize: "clamp(30px, 10vw, 44px)", fontWeight: 900,
            letterSpacing: "-0.01em", color: theme.text, lineHeight: 1,
            textTransform: "uppercase",
          }}>
            {venue.name}
          </h1>
        </div>

        {/* ── Spin earned card (only after scan) ── */}
        {hasEarned && (
          <div style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 16, padding: "16px 18px", marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>
              You earned
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: theme.text, letterSpacing: "-0.01em" }}>
              {tokens} spin · tonight
            </div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
              {currSym}{scannedInfo!.amount.toFixed(0)} · verified {scannedInfo!.time}
            </div>
          </div>
        )}

        {/* ── Pull the lever CTA card ── */}
        <button
          onClick={onJackpot}
          style={{
            width: "100%", textAlign: "left", cursor: "pointer",
            background: tokens > 0
              ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`
              : theme.cardBg,
            border: tokens > 0 ? "none" : `1px solid ${theme.border}`,
            borderRadius: 16, padding: "20px 20px", marginBottom: 24,
            boxShadow: tokens > 0 ? `0 8px 32px ${theme.glow}` : "none",
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.2em",
            color: tokens > 0 ? (theme.btnText + "bb") : theme.muted,
            textTransform: "uppercase", marginBottom: 8,
          }}>
            {tokens > 0 ? "YOUR SPIN IS WAITING" : "JACKPOT"}
          </div>
          <div style={{
            fontSize: "clamp(22px, 7vw, 30px)", fontWeight: 900,
            fontFamily: theme.font,
            color: tokens > 0 ? theme.btnText : theme.text,
            letterSpacing: "0.01em", lineHeight: 1.1, marginBottom: 6,
          }}>
            {tokens > 0 ? "Pull the lever." : "Fiş Tara →"}
          </div>
          <div style={{
            fontSize: 13,
            color: tokens > 0 ? (theme.btnText + "99") : theme.muted,
            lineHeight: 1.45,
          }}>
            {tokens > 0
              ? "Three drinks in a row wins the round →"
              : "Hesabını ödedikten sonra fişini tarat, jackpot kazan."}
          </div>
        </button>

        {/* ── Last week ── */}
        {recentCoupons.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.2em",
              color: theme.muted, textTransform: "uppercase", marginBottom: 12,
            }}>
              LAST WEEK
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {recentCoupons.map((c) => (
                <div key={c.id} style={{
                  padding: "8px 14px", borderRadius: 999,
                  background: theme.cardBg, border: `1px solid ${theme.border}`,
                  fontSize: 13, fontWeight: 700, color: theme.text,
                }}>
                  {c.rewardLabel}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Navigation ── */}
      <BottomNav
        theme={theme}
        hasTokens={tokens > 0}
        isPro={isPro}
        customerId={customerId}
        onJackpot={onJackpot}
        onProfile={onProfile}
      />

      <style>{`
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BOTTOM NAV  —  Home · JACKPOT · Me
═══════════════════════════════════════════════ */
function BottomNav({ theme, hasTokens, isPro, customerId, onJackpot, onProfile }: {
  theme: Theme;
  hasTokens: boolean;
  isPro: boolean;
  customerId: string | null;
  onJackpot: () => void;
  onProfile: () => void;
}) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      height: 80,
      background: theme.navBg,
      borderTop: `1px solid ${theme.border}`,
      backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "0 28px 8px",
      zIndex: 50,
    }}>
      {/* Home */}
      <NavBtn label="Home" active>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </NavBtn>

      {/* JACKPOT — center large circle */}
      <button
        onClick={onJackpot}
        style={{
          width: 62, height: 62, borderRadius: "50%",
          background: hasTokens
            ? `radial-gradient(circle at 35% 35%, ${theme.accent}, ${theme.accent2})`
            : `radial-gradient(circle at 35% 35%, ${theme.accent}, ${theme.btnBg})`,
          border: `3px solid ${theme.glow}`,
          boxShadow: `0 0 28px ${theme.glow}, 0 0 8px ${theme.glow}`,
          cursor: "pointer",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 1,
          flexShrink: 0,
          marginBottom: 8,
          animation: hasTokens ? "pulse-glow 2s ease-in-out infinite" : "none",
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>🎰</span>
        <span style={{ fontSize: 8, fontWeight: 900, color: theme.btnText, letterSpacing: "0.1em" }}>
          JACKPOT
        </span>
      </button>

      {/* Me / Profile */}
      <button
        onClick={isPro ? onProfile : undefined}
        style={{
          background: "none", border: "none", cursor: isPro ? "pointer" : "default",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          color: isPro && customerId ? theme.accent : theme.muted,
          opacity: isPro ? 1 : 0.35,
          padding: "4px 8px",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700 }}>Me</span>
      </button>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 28px ${theme.glow}, 0 0 8px ${theme.glow}; }
          50%       { box-shadow: 0 0 44px ${theme.glow}, 0 0 18px ${theme.glow}; }
        }
      `}</style>
    </div>
  );
}

function NavBtn({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      color: active ? "#fff" : "rgba(255,255,255,0.35)",
      padding: "4px 8px", cursor: "default",
    }}>
      {children}
      <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCAN SCREEN
═══════════════════════════════════════════════ */
type ScanStage = "idle" | "captured" | "processing" | "verified" | "error";
type CapturedPayload = { previewUrl: string; hash: string; imageData: string };
type OcrResult = { tokens: number; receiptId: string; amount: number; currency: string };

function ScanScreen({ venue, theme, guestToken, customerId, onComplete, onBack }: {
  venue: PlayBundle["venue"]; theme: Theme;
  guestToken: string; customerId: string | null;
  onComplete: (tokens: number, receiptId: string, info: ScannedInfo) => void;
  onBack: () => void;
}) {
  const [scanStage, setScanStage]   = useState<ScanStage>("idle");
  const [errorMsg, setErrorMsg]     = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captured, setCaptured]     = useState<CapturedPayload | null>(null);
  const [ocrResult, setOcrResult]   = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openNativeCamera() { setErrorMsg(""); fileInputRef.current?.click(); }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const arrayBuf = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuf);
      const hash = Array.from(new Uint8Array(hashBuffer)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
      const blob = new Blob([arrayBuf], { type: file.type || "image/jpeg" });
      const url = URL.createObjectURL(blob);
      const imageData = await blobToDataUrl(blob);
      setPreviewUrl(url);
      setCaptured({ previewUrl: url, hash, imageData });
      setScanStage("captured");
    } catch {
      setErrorMsg("Fotoğraf işlenemedi. Tekrar dene.");
      setScanStage("error");
    }
  }

  async function startScan() {
    if (!captured) return;
    setScanStage("processing");
    try {
      const res = await fetch("/api/play/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: captured.imageData, hash: captured.hash, slug: venue.slug, guestToken, customerId: customerId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Fiş doğrulanamadı."); setScanStage("error"); return; }
      const nowTime = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      setOcrResult({ tokens: data.tokens, receiptId: data.receiptId, amount: data.amount, currency: data.currency ?? "TRY" });
      setScanStage("verified");
      setTimeout(() => onComplete(data.tokens, data.receiptId, { amount: data.amount, currency: data.currency ?? "TRY", time: nowTime }), 2200);
    } catch {
      setErrorMsg("Bağlantı hatası. Tekrar dene.");
      setScanStage("error");
    }
  }

  function retakePhoto() {
    setCaptured(null); setPreviewUrl(null); setErrorMsg(""); setScanStage("idle");
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  const currSym = ocrResult?.currency === "USD" ? "$" : ocrResult?.currency === "EUR" ? "€" : "₺";

  const photoBox: React.CSSProperties = {
    position: "relative", width: "min(82vw, 320px)", height: "min(54vh, 420px)",
    borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: theme.bg, color: theme.text, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />

      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: theme.font }}>
          {scanStage === "idle" ? "Fişini Tara" : scanStage === "captured" ? "Fişin Hazır" : scanStage === "processing" ? "Analiz Ediliyor" : scanStage === "verified" ? "Doğrulandı" : "Hata"}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flexShrink: 0, padding: "0 24px 10px", minHeight: 18 }}>
        {scanStage === "idle" && <p style={{ margin: 0, fontSize: 13, color: theme.muted, textAlign: "center" }}>Sarı düğmeye bas · Kamera açılır · Fiş son 1 saat geçerli</p>}
        {scanStage === "captured" && <p style={{ margin: 0, fontSize: 13, color: theme.muted, textAlign: "center" }}>Fotoğraf net mi? Yeniden çek veya taramaya başla.</p>}
        {scanStage === "processing" && <p style={{ margin: 0, fontSize: 13, color: theme.muted, textAlign: "center" }}>AI fişini analiz ediyor…</p>}
        {scanStage === "verified" && <p style={{ margin: 0, fontSize: 13, color: "#4ade80", textAlign: "center", fontWeight: 700 }}>Doğrulandı · {ocrResult?.tokens ?? 1} çevirme hakkı kazandın</p>}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 24px 24px", gap: 20, minHeight: 0 }}>

        {scanStage === "idle" && (
          <>
            <div style={{ ...photoBox, background: "linear-gradient(180deg,rgba(20,16,8,0.6),rgba(8,6,3,0.9))", border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {(["tl","tr","bl","br"] as const).map((p) => <div key={p} style={cornerStyle(p, theme.accent)} />)}
              <div style={{ width: "65%", padding: "12px 14px", background: "linear-gradient(180deg,#f4ede0,#e9dfca)", color: "#3a2c14", fontFamily: "monospace", fontSize: 9, lineHeight: 1.6, boxShadow: "0 18px 40px rgba(0,0,0,0.5)", borderRadius: 4, transform: "rotate(-2deg)" }}>
                <div style={{ textAlign: "center", fontWeight: 800, fontSize: 10, letterSpacing: "0.12em" }}>{venue.name.toUpperCase()}</div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "6px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Old Fashioned</span><span>180</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Negroni</span><span>160</span></div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "6px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>TOPLAM</span><span>₺ 340.00</span></div>
              </div>
            </div>
            <button onClick={openNativeCamera} type="button" style={{ width: 72, height: 72, borderRadius: "50%", background: theme.btnBg, border: `5px solid ${theme.glow}`, cursor: "pointer", boxShadow: `0 0 32px ${theme.glow}`, flexShrink: 0 }} aria-label="Kamerayı aç" />
          </>
        )}

        {scanStage === "captured" && previewUrl && (
          <>
            <div style={photoBox}>
              {(["tl","tr","bl","br"] as const).map((p) => <div key={p} style={cornerStyle(p, theme.accent)} />)}
              <img src={previewUrl} alt="çekilen fiş" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", gap: 12, width: "min(82vw,320px)", flexShrink: 0 }}>
              <button onClick={retakePhoto} type="button" style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.text, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>↺ Yeniden Çek</button>
              <button onClick={startScan} type="button" style={{ flex: 2, padding: "16px", borderRadius: 12, background: theme.btnBg, border: "none", color: theme.btnText, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 10px 28px ${theme.glow}` }}>Taramayı Başlat</button>
            </div>
          </>
        )}

        {scanStage === "processing" && previewUrl && (
          <div style={photoBox}>
            {(["tl","tr","bl","br"] as const).map((p) => <div key={p} style={cornerStyle(p, theme.accent)} />)}
            <img src={previewUrl} alt="fiş" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: theme.receiptTint, pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${theme.accent},transparent)`, boxShadow: `0 0 24px 6px ${theme.glow}`, animation: "scan-line 1.6s ease-in-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 12, right: 12, padding: "6px 12px", borderRadius: 999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 8, border: `1px solid ${theme.border}` }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: theme.accent, animation: "rr-spin 0.75s linear infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, letterSpacing: "0.08em" }}>TARANIYOR</span>
            </div>
          </div>
        )}

        {scanStage === "verified" && previewUrl && (
          <>
            <div style={{ ...photoBox, height: "min(46vh,360px)" }}>
              <img src={previewUrl} alt="fiş" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,#22c55e,#16a34a)", boxShadow: "0 0 40px rgba(34,197,94,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#fff", animation: "pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>✓</div>
              </div>
            </div>
            <div style={{ width: "min(82vw,320px)", padding: "12px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, display: "grid", gap: 6, flexShrink: 0 }}>
              {[
                { label: "VENUE", value: venue.name },
                { label: "TOTAL", value: `${currSym} ${ocrResult?.amount?.toFixed(2) ?? "—"}`, accent: true },
                { label: "AUTH",  value: "PASSED", green: true },
              ].map(({ label, value, accent, green }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: theme.muted }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: green ? "#4ade80" : accent ? theme.accent : theme.text }}>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {scanStage === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "min(82vw,360px)" }}>
            <div style={{ fontSize: 38 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ff7e5a", textAlign: "center", lineHeight: 1.55 }}>{errorMsg}</div>
            <button onClick={() => { setErrorMsg(""); setCaptured(null); setPreviewUrl(null); setScanStage("idle"); }} style={{ ...primaryBtn(theme), width: "100%" }} type="button">Tekrar Dene</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rr-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes scan-line { 0% { top: 8%; opacity: 1; } 50% { top: 88%; opacity: 1; } 100% { top: 8%; opacity: 0.3; } }
        @keyframes pop-in { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COUPON SCREEN
═══════════════════════════════════════════════ */
function CouponScreen({ venue, theme, coupon, onBack, onDone }: {
  venue: PlayBundle["venue"]; theme: Theme;
  coupon: { id: string; code: string; rewardLabel: string };
  onBack: () => void; onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(coupon.code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: theme.bg, color: theme.text, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: theme.font }}>Kuponun</div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", gap: 18, minHeight: 0 }}>
        <div style={{ fontFamily: theme.font, fontSize: "clamp(44px,12vw,72px)", fontWeight: 900, color: theme.accent, textAlign: "center", lineHeight: 1, textShadow: `0 0 32px ${theme.glow}`, animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>🎉 KAZANDIN</div>
        <h1 style={{ margin: 0, fontSize: "clamp(22px,6vw,30px)", fontWeight: 800, textAlign: "center", color: theme.text, lineHeight: 1.15 }}>{coupon.rewardLabel}</h1>
        <p style={{ margin: 0, fontSize: 14, color: theme.muted, textAlign: "center", maxWidth: 340, lineHeight: 1.55 }}>Bu kodu garsona göster. Garson "Kullanıldı" işaretledikten sonra ödülünü alabilirsin.</p>
        <div style={{ width: "100%", maxWidth: 360, padding: "22px 20px", background: `linear-gradient(135deg,${theme.glow},transparent)`, border: `1.5px dashed ${theme.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: theme.muted, textTransform: "uppercase", textAlign: "center", fontFamily: theme.font }}>{venue.name}</div>
          <div style={{ marginTop: 14, padding: "18px 12px", background: "rgba(0,0,0,0.5)", borderRadius: 10, fontFamily: "monospace", fontSize: 26, fontWeight: 800, color: theme.accent, letterSpacing: "0.16em", textAlign: "center", border: `1px solid ${theme.border}` }}>{coupon.code}</div>
          <button onClick={copy} style={{ marginTop: 14, width: "100%", padding: "12px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{copied ? "✓ Kopyalandı" : "Kodu Kopyala"}</button>
        </div>
        <button onClick={onDone} style={{ ...primaryBtn(theme), maxWidth: 360 }}>Tamam</button>
      </div>
      <style>{`@keyframes pop-in { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CUSTOMER AUTH SCREEN
═══════════════════════════════════════════════ */
function CustomerAuthScreen({ venue, theme, onBack, onSuccess }: {
  venue: PlayBundle["venue"]; theme: Theme;
  onBack: () => void; onSuccess: (customerId: string) => void;
}) {
  const [email, setEmail]       = useState("");
  const [fullName, setFullName] = useState("");
  const [consent, setConsent]   = useState(false);
  const [authStage, setAuthStage] = useState<"form" | "sent" | "busy">("form");
  const [err, setErr]           = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setErr("Devam edebilmek için KVKK onayı gereklidir."); return; }
    setErr(""); setAuthStage("busy");
    const sb = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } });
    if (error) { setErr(error.message); setAuthStage("form"); return; }
    if (fullName) sessionStorage.setItem("rr_pending_name", fullName);
    sessionStorage.setItem("rr_pending_consent", "1");
    setAuthStage("sent");
  }

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const pendingName = sessionStorage.getItem("rr_pending_name") ?? undefined;
      const pendingConsent = sessionStorage.getItem("rr_pending_consent") === "1";
      sessionStorage.removeItem("rr_pending_name");
      sessionStorage.removeItem("rr_pending_consent");
      const res = await fetch("/api/play/customer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: venue.slug, full_name: pendingName, consent_marketing: pendingConsent, consent_kvkk: pendingConsent }) });
      if (res.ok) { const data = await res.json() as { customer: { id: string } }; onSuccess(data.customer.id); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: theme.bg, color: theme.text, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: theme.font }}>{venue.name}</div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
        {authStage === "sent" ? (
          <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: theme.text }}>E-posta Gönderildi</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: theme.muted, lineHeight: 1.6 }}><strong style={{ color: theme.accent }}>{email}</strong> adresine giriş linki gönderdik.</p>
            <button onClick={() => setAuthStage("form")} style={{ ...secondaryBtn(theme), width: "100%" }}>E-posta değiştir</button>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: theme.accent, textTransform: "uppercase", marginBottom: 10, fontFamily: theme.font }}>Üye Girişi</div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: theme.text }}>Hesabına Giriş Yap</h2>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: theme.muted }}>E-postana sihirli link gönderiyoruz.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: theme.muted, textTransform: "uppercase" }}>Ad Soyad</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ahmet Yılmaz" style={inputStyle(theme)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: theme.muted, textTransform: "uppercase" }}>E-posta *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" style={inputStyle(theme)} />
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: theme.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: theme.muted, lineHeight: 1.5 }}><strong style={{ color: theme.accent }}>{venue.name}</strong> tarafından kampanya bilgilendirmesi ve KVKK kapsamında veri işlenmesini kabul ediyorum.</span>
            </label>
            {err && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,100,80,0.1)", border: "1px solid rgba(255,100,80,0.3)", color: "#ff8060", fontSize: 13 }}>{err}</div>}
            <button type="submit" disabled={authStage === "busy" || !email} style={{ ...primaryBtn(theme), opacity: authStage === "busy" || !email ? 0.6 : 1 }}>
              {authStage === "busy" ? "Gönderiliyor…" : "Giriş Linki Gönder"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Style helpers ─── */
function primaryBtn(theme: Theme): React.CSSProperties {
  return { padding: "17px 28px", borderRadius: 14, background: theme.btnBg, border: "none", color: theme.btnText, fontSize: 16, fontWeight: 800, cursor: "pointer", width: "100%", boxShadow: `0 10px 28px ${theme.glow}` };
}
function secondaryBtn(theme: Theme): React.CSSProperties {
  return { padding: "13px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.text, fontSize: 14, fontWeight: 700, cursor: "pointer" };
}
function inputStyle(theme: Theme): React.CSSProperties {
  return { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px 14px", color: theme.text, fontSize: 14, outline: "none" };
}
function cornerStyle(pos: "tl"|"tr"|"bl"|"br", color: string): React.CSSProperties {
  const size = 22, thick = 2, off = 12;
  const c = `${color}b3`;
  const base: React.CSSProperties = { position: "absolute", width: size, height: size, borderColor: c, borderStyle: "solid", borderWidth: 0, zIndex: 2 };
  if (pos === "tl") return { ...base, top: off, left: off, borderTopWidth: thick, borderLeftWidth: thick };
  if (pos === "tr") return { ...base, top: off, right: off, borderTopWidth: thick, borderRightWidth: thick };
  if (pos === "bl") return { ...base, bottom: off, left: off, borderBottomWidth: thick, borderLeftWidth: thick };
  return { ...base, bottom: off, right: off, borderBottomWidth: thick, borderRightWidth: thick };
}
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => { if (typeof reader.result === "string") { resolve(reader.result); return; } reject(new Error("Failed")); };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
