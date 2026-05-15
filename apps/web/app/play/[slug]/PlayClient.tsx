"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SlotMachine } from "../../../components/SlotMachine";
import { getCopy, type Locale } from "../../../lib/i18n";
import { createClient } from "../../../lib/supabase/browser";
import type { PlayBundle } from "../../../lib/play";
import type { SlotVariantDB, WheelVariantDB } from "../../../lib/supabase/types";

const SpinWheel = dynamic(() => import("../../../components/wheel/SpinWheel"), { ssr: false });

type SpinResponse = {
  outcome: string; win: boolean; isJackpot: boolean;
  coupon: { id: string; code: string; rewardLabel: string } | null;
  animationHint: "standard" | "win" | "jackpot";
};
type Stage = "home" | "auth" | "scan" | "play" | "coupon";
type RecentCoupon = { id: string; rewardLabel: string; code: string };
type ScannedInfo  = { amount: number; currency: string; time: string } | null;

/* ═══════════════════════════════════════════════
   THEME SYSTEM
═══════════════════════════════════════════════ */
type Theme = {
  /* backgrounds */
  bg: string;
  cardBg: string;
  ctaCardBg: string;        // "pull lever" card when spin waiting
  ctaCardBgIdle: string;    // "pull lever" card when no spin
  navBg: string;
  /* text */
  text: string;
  muted: string;
  ctaText: string;          // text on cta card when spin waiting
  ctaMuted: string;
  /* accents */
  accent: string;
  accent2: string;
  border: string;
  ctaBorder: string;
  glow: string;
  jackpotGlow: string;
  jackpotHi: string;
  jackpotLo: string;
  jackpotRim: string;
  /* button */
  btnBg: string;
  btnText: string;
  /* typography */
  fontDisplay: string;      // venue name font
  fontLabel: string;        // small caps label font
  nameTransform: string;    // uppercase / capitalize
  nameSize: string;
  labelText: string;        // "TONIGHT AT" / "NEON ROOM" / "MEMBERS FLOOR"
  /* receipt */
  receiptTint: string;
  /* jackpot button */
  jackpotBg: string;
};

const THEMES: Record<SlotVariantDB, Theme> = {

  /* ── A · Brass & Walnut ── */
  v1: {
    bg:              "radial-gradient(140% 100% at 50% 0%, #2a1a0d 0%, #14090a 60%, #0a0608 100%)",
    cardBg:          "rgba(255,220,140,0.05)",
    ctaCardBg:       "linear-gradient(135deg, #a05a18 0%, #f0b94a 100%)",
    ctaCardBgIdle:   "rgba(255,220,140,0.04)",
    navBg:           "rgba(10,10,14,0.95)",
    text:            "#f5e6c8",
    muted:           "rgba(220,185,110,0.55)",
    ctaText:         "#1a0802",
    ctaMuted:        "rgba(0,0,0,0.55)",
    accent:          "#e8c876",
    accent2:         "#c81e35",
    border:          "rgba(232,200,118,0.18)",
    ctaBorder:       "#5a2a08",
    glow:            "rgba(240,185,74,0.28)",
    jackpotGlow:     "rgba(240,185,74,0.55)",
    jackpotHi:       "#f0b94a",
    jackpotLo:       "#a05a18",
    jackpotRim:      "#5a2a08",
    btnBg:           "#e8c876",
    btnText:         "#1a0802",
    fontDisplay:     "'Playfair Display', Georgia, serif",
    fontLabel:       "'Playfair Display', Georgia, serif",
    nameTransform:   "capitalize",
    nameSize:        "clamp(32px, 9vw, 48px)",
    labelText:       "TONIGHT AT",
    receiptTint:     "linear-gradient(180deg,rgba(240,185,74,0.07),rgba(200,30,53,0.03))",
    jackpotBg:       "radial-gradient(circle at 35% 30%, #f0b94a 0%, #a05a18 100%)",
  },

  /* ── B · Neon Noir ── */
  v2: {
    bg:              "radial-gradient(140% 100% at 50% 0%, #1a0228 0%, #0a0014 60%, #050008 100%)",
    cardBg:          "rgba(255,45,138,0.06)",
    ctaCardBg:       "linear-gradient(135deg, #7e1cf5 0%, #ff2d8a 100%)",
    ctaCardBgIdle:   "rgba(255,45,138,0.05)",
    navBg:           "rgba(10,10,14,0.95)",
    text:            "#fce8ff",
    muted:           "rgba(0,232,255,0.6)",
    ctaText:         "#ffffff",
    ctaMuted:        "rgba(255,255,255,0.65)",
    accent:          "#ff2d8a",
    accent2:         "#00e8ff",
    border:          "rgba(255,45,138,0.3)",
    ctaBorder:       "#22002e",
    glow:            "rgba(255,45,138,0.45)",
    jackpotGlow:     "rgba(255,45,138,0.7)",
    jackpotHi:       "#ff2d8a",
    jackpotLo:       "#7e1cf5",
    jackpotRim:      "#22002e",
    btnBg:           "#ff2d8a",
    btnText:         "#ffffff",
    fontDisplay:     "'Bebas Neue', 'Impact', sans-serif",
    fontLabel:       "'Bebas Neue', 'Impact', sans-serif",
    nameTransform:   "uppercase",
    nameSize:        "clamp(36px, 11vw, 56px)",
    labelText:       "NEON ROOM",
    receiptTint:     "linear-gradient(180deg,rgba(255,45,138,0.1),rgba(0,232,255,0.05))",
    jackpotBg:       "radial-gradient(circle at 35% 30%, #ff2d8a 0%, #7e1cf5 100%)",
  },

  /* ── C · Speakeasy Deco ── */
  v3: {
    bg:              "radial-gradient(140% 100% at 50% 0%, #1a1408 0%, #0a0805 60%, #050402 100%)",
    cardBg:          "rgba(202,161,74,0.06)",
    ctaCardBg:       "linear-gradient(135deg, #8a6e2a 0%, #f5d27a 100%)",
    ctaCardBgIdle:   "rgba(202,161,74,0.04)",
    navBg:           "rgba(10,10,14,0.95)",
    text:            "#f0e8b8",
    muted:           "rgba(202,161,74,0.5)",
    ctaText:         "#1a1403",
    ctaMuted:        "rgba(0,0,0,0.55)",
    accent:          "#caa14a",
    accent2:         "#f5d27a",
    border:          "rgba(202,161,74,0.28)",
    ctaBorder:       "#1a1408",
    glow:            "rgba(202,161,74,0.25)",
    jackpotGlow:     "rgba(202,161,74,0.55)",
    jackpotHi:       "#f5d27a",
    jackpotLo:       "#8a6e2a",
    jackpotRim:      "#1a1408",
    btnBg:           "#caa14a",
    btnText:         "#1a1403",
    fontDisplay:     "'Cinzel', 'Trajan Pro', Georgia, serif",
    fontLabel:       "'Cinzel', Georgia, serif",
    nameTransform:   "uppercase",
    nameSize:        "clamp(28px, 8vw, 44px)",
    labelText:       "MEMBERS FLOOR",
    receiptTint:     "linear-gradient(180deg,rgba(202,161,74,0.07),rgba(245,210,122,0.03))",
    jackpotBg:       "radial-gradient(circle at 35% 30%, #f5d27a 0%, #8a6e2a 100%)",
  },
};

function getOrCreateGuestToken() {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem("rr_guest_token");
  if (!t) { t = crypto.randomUUID(); localStorage.setItem("rr_guest_token", t); }
  return t;
}

export function PlayClient({ bundle }: { bundle: PlayBundle }) {
  const { venue, config } = bundle;
  const interfaceLanguage = ((venue as unknown as { interface_language?: string }).interface_language === "en" ? "en" : "tr") as Locale;
  const copyText = getCopy(interfaceLanguage);
  const playCopy = copyText.play;
  const router  = useRouter();
  const variant = (config.variant ?? "v1") as SlotVariantDB;
  const theme   = THEMES[variant] ?? THEMES.v1;
  const isPro   = (venue as unknown as { tier?: string }).tier === "pro";

  const [stage, setStage]               = useState<Stage>("home");
  const [tokens, setTokens]             = useState(0);
  const [spinning, setSpinning]         = useState(false);
  const [result, setResult]             = useState<SpinResponse | null>(null);
  const [guestToken, setGuestToken]     = useState("");
  const [receiptId, setReceiptId]       = useState<string | null>(null);
  const [customerId, setCustomerId]     = useState<string | null>(null);
  const [recentCoupons, setRecentCoupons] = useState<RecentCoupon[]>([]);
  const [scannedInfo, setScannedInfo]   = useState<ScannedInfo>(null);

  useEffect(() => { setGuestToken(getOrCreateGuestToken()); }, []);

  useEffect(() => {
    if (!isPro) return;
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const res = await fetch("/api/play/customer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: venue.slug }) });
      if (!res.ok) return;
      const { customer } = await res.json() as { customer: { id: string } };
      setCustomerId(customer.id);
      const r2 = await fetch(`/api/profile/coupons?customerId=${customer.id}`);
      if (r2.ok) {
        const d2 = await r2.json() as { coupons: Array<{ id: string; reward_label: string; code: string }> };
        setRecentCoupons((d2.coupons ?? []).slice(0, 3).map((c) => ({ id: c.id, rewardLabel: c.reward_label, code: c.code })));
      }
    });
  }, [isPro, venue.slug]);

  async function pullLever() {
    if (spinning || tokens < 1) return;
    setSpinning(true); setResult(null);
    try {
      const res = await fetch("/api/play/spin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: venue.slug, guestToken, receiptId, customerId: customerId ?? undefined }) });
      await new Promise((r) => setTimeout(r, 1600));
      if (!res.ok) return;
      const data = (await res.json()) as SpinResponse;
      setResult(data); setTokens((t) => Math.max(0, t - 1));
    } catch { /* silent */ }
    finally { setSpinning(false); }
  }

  function handleScanComplete(earnedTokens: number, newReceiptId: string, info: ScannedInfo) {
    setTokens(earnedTokens); setReceiptId(newReceiptId); setScannedInfo(info); setStage("play");
  }

  function handleJackpotPress() {
    if (tokens > 0) { setStage("play"); return; }
    if (isPro && !customerId) { setStage("auth"); return; }
    setStage("scan");
  }

  if (stage === "auth") return <CustomerAuthScreen venue={venue} theme={theme} copy={playCopy} onBack={() => setStage("home")} onSuccess={(cid) => { setCustomerId(cid); setStage("scan"); }} />;
  if (stage === "scan") return <ScanScreen venue={venue} theme={theme} copy={playCopy} locale={copyText.meta.locale} guestToken={guestToken} customerId={customerId} onComplete={handleScanComplete} onBack={() => setStage("home")} />;
  if (stage === "coupon" && result?.coupon) return <CouponScreen venue={venue} theme={theme} copy={playCopy} coupon={result.coupon} onBack={() => { setResult(null); setStage("play"); }} onDone={() => { setResult(null); setStage("home"); }} />;
  if (stage === "play") {
    const gameType = (venue as unknown as { game_type?: string }).game_type ?? "slot";
    const wheelVariant = (venue as unknown as { wheel_variant?: WheelVariantDB }).wheel_variant ?? "boho";
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000" }}>
        {gameType === "wheel" ? (
          <SpinWheel
            variant={wheelVariant}
            venueName={venue.name}
            canSpin={tokens > 0 && !spinning}
            spinning={spinning}
            tokens={tokens}
            result={result ? {
              win: result.win,
              isJackpot: result.isJackpot,
              rewardLabel: result.coupon?.rewardLabel ?? (result.win ? "Kazandın!" : ""),
              couponCode: result.coupon?.code ?? "",
            } : null}
            onSpin={pullLever}
            onShowCoupon={() => result?.coupon && setStage("coupon")}
            onBack={() => setStage("home")}
            onReset={() => setResult(null)}
          />
        ) : (
          <SlotMachine tokens={tokens} outcome={result?.outcome ?? null} animationHint={result?.animationHint ?? null} logoSymbol={venue.name.slice(0, 2).toUpperCase()} spinning={spinning} canSpin={tokens > 0 && !spinning} onSpin={pullLever} variant={config.variant} venueName={venue.name} labels={playCopy.slot} onBack={() => setStage("home")} onReset={() => setResult(null)} onShowCoupon={() => result?.coupon && setStage("coupon")} onExit={() => { setResult(null); setStage("home"); }} />
        )}
      </div>
    );
  }

  return <HomeScreen venue={venue} theme={theme} copy={playCopy} isPro={isPro} customerId={customerId} tokens={tokens} scannedInfo={scannedInfo} recentCoupons={recentCoupons} onJackpot={handleJackpotPress} onProfile={() => router.push(`/profile/${venue.slug}`)} />;
}

/* ═══════════════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════════════ */
function HomeScreen({ venue, theme, copy, isPro, customerId, tokens, scannedInfo, recentCoupons, onJackpot, onProfile }: {
  venue: PlayBundle["venue"]; theme: Theme; copy: ReturnType<typeof getCopy>["play"]; isPro: boolean; customerId: string | null;
  tokens: number; scannedInfo: ScannedInfo; recentCoupons: RecentCoupon[];
  onJackpot: () => void; onProfile: () => void;
}) {
  const hasEarned = scannedInfo !== null;
  const currSym   = scannedInfo?.currency === "USD" ? "$" : scannedInfo?.currency === "EUR" ? "€" : "₺";

  return (
    <div style={{ position: "fixed", inset: 0, background: theme.bg, color: theme.text, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ flex: 1, overflowY: "auto", padding: "52px 22px 104px" }}>

        {/* ── Venue header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
            color: theme.muted, textTransform: "uppercase",
            fontFamily: theme.fontLabel, marginBottom: 4,
          }}>
            {theme.labelText}
          </div>
          <h1 style={{
            margin: 0, fontFamily: theme.fontDisplay,
            fontSize: theme.nameSize, fontWeight: 900, lineHeight: 1.0,
            color: theme.text, letterSpacing: theme.nameTransform === "uppercase" ? "0.02em" : "-0.01em",
            textTransform: theme.nameTransform as React.CSSProperties["textTransform"],
            textShadow: tokens > 0 ? `0 0 40px ${theme.glow}` : "none",
          }}>
            {venue.name}
          </h1>
        </div>

        {/* ── Earned spin card ── */}
        {hasEarned && (
          <div style={{
            background: theme.cardBg, border: `1px solid ${theme.border}`,
            borderRadius: 16, padding: "16px 18px", marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em" }}>You earned</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: theme.text, fontFamily: theme.fontDisplay, letterSpacing: "0.01em" }}>
              {copy.spinTonight.replace("{tokens}", String(tokens))}
            </div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 4, letterSpacing: "0.02em" }}>
              {copy.verifiedAt.replace("{amount}", `${currSym}${scannedInfo!.amount.toFixed(0)}`).replace("{time}", scannedInfo!.time)}
            </div>
          </div>
        )}

        {/* ── CTA card ── */}
        <button onClick={onJackpot} style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          border: tokens > 0 ? `1.5px solid ${theme.jackpotRim}` : `1px solid ${theme.border}`,
          background: tokens > 0 ? theme.ctaCardBg : theme.ctaCardBgIdle,
          borderRadius: 18, padding: "22px 22px 20px", marginBottom: 26,
          boxShadow: tokens > 0
            ? `0 0 28px 2px ${theme.jackpotGlow}, 0 10px 30px rgba(0,0,0,0.4)`
            : "none",
          position: "relative", overflow: "hidden",
        }}>

          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.24em",
            color: tokens > 0 ? theme.ctaMuted : theme.muted,
            textTransform: "uppercase", marginBottom: 10,
            fontFamily: theme.fontLabel,
          }}>
            {tokens > 0 ? copy.spinWaiting : copy.jackpot}
          </div>

          <div style={{
            fontSize: "clamp(24px, 8vw, 34px)", fontWeight: 900,
            fontFamily: theme.fontDisplay,
            color: tokens > 0 ? theme.ctaText : theme.text,
            letterSpacing: tokens > 0 && theme.nameTransform === "uppercase" ? "0.04em" : "0.01em",
            textTransform: tokens > 0 && theme.nameTransform === "uppercase" ? "uppercase" : "none" as React.CSSProperties["textTransform"],
            lineHeight: 1.1, marginBottom: 8,
          }}>
            {tokens > 0 ? copy.pullLever : copy.scanReceipt}
          </div>

          <div style={{
            fontSize: 13,
            color: tokens > 0 ? theme.ctaMuted : theme.muted,
            lineHeight: 1.5,
          }}>
            {tokens > 0
              ? copy.winHint
              : copy.receiptReason}
          </div>
        </button>

        {/* ── Last week ── */}
        {recentCoupons.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", color: theme.muted, textTransform: "uppercase", marginBottom: 12, fontFamily: theme.fontLabel }}>
              {copy.lastWeek}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {recentCoupons.map((c) => (
                <div key={c.id} style={{ padding: "8px 16px", borderRadius: 999, background: theme.cardBg, border: `1px solid ${theme.border}`, fontSize: 13, fontWeight: 700, color: theme.text, letterSpacing: "0.02em" }}>
                  {c.rewardLabel}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Navigation ── */}
      <BottomNav theme={theme} copy={copy} hasTokens={tokens > 0} isPro={isPro} customerId={customerId} onJackpot={onJackpot} onProfile={onProfile} />

      <style>{`
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 24px 4px ${theme.jackpotGlow}, 0 6px 14px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -3px 4px rgba(0,0,0,0.4); }
          50%      { box-shadow: 0 0 44px 8px ${theme.jackpotGlow}, 0 6px 14px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -3px 4px rgba(0,0,0,0.4); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   JACKPOT ICON — slot machine with 7-7-7
═══════════════════════════════════════════════ */
function JackpotIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="6" width="22" height="16" rx="2" fill="#1a1208" stroke="#fff" strokeWidth="0.8" opacity="0.9"/>
      <rect x="5.5" y="9" width="4.5" height="10" rx="0.6" fill="#fff8e0"/>
      <rect x="11.75" y="9" width="4.5" height="10" rx="0.6" fill="#fff8e0"/>
      <rect x="18" y="9" width="4.5" height="10" rx="0.6" fill="#fff8e0"/>
      <text x="7.75" y="17" textAnchor="middle" fontFamily="'Bowlby One SC',sans-serif" fontSize="9" fill="#c81e35" fontWeight="900">7</text>
      <text x="14" y="17" textAnchor="middle" fontFamily="'Bowlby One SC',sans-serif" fontSize="9" fill="#c81e35" fontWeight="900">7</text>
      <text x="20.25" y="17" textAnchor="middle" fontFamily="'Bowlby One SC',sans-serif" fontSize="9" fill="#c81e35" fontWeight="900">7</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   BOTTOM NAV
═══════════════════════════════════════════════ */
function BottomNav({ theme, copy, hasTokens, isPro, customerId, onJackpot, onProfile }: {
  theme: Theme; copy: ReturnType<typeof getCopy>["play"]; hasTokens: boolean; isPro: boolean; customerId: string | null;
  onJackpot: () => void; onProfile: () => void;
}) {
  const showProfile = isPro && !!customerId;

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "linear-gradient(180deg, rgba(10,10,14,0) 0%, rgba(10,10,14,0.95) 30%)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      display: "flex", alignItems: "flex-end", justifyContent: "space-around",
      padding: "10px 8px 28px", zIndex: 50,
    }}>
      {/* Home */}
      <NavIcon label={copy.home} color={theme.text} active>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      </NavIcon>

      {/* JACKPOT — center raised */}
      <button onClick={onJackpot} style={{
        appearance: "none", border: "none", background: "transparent",
        padding: 0, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: "translateY(-18px)",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${theme.jackpotHi} 0%, ${theme.jackpotLo} 100%)`,
          border: `2px solid ${theme.jackpotRim}`,
          boxShadow: `0 0 24px 4px ${theme.jackpotGlow}, 0 6px 14px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -3px 4px rgba(0,0,0,0.4)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "pulse-glow 2.4s ease-in-out infinite",
        }}>
          <JackpotIcon />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          color: theme.jackpotHi, marginTop: 6, textTransform: "uppercase",
          textShadow: `0 0 8px ${theme.jackpotGlow}`,
        }}>{copy.jackpot}</span>
      </button>

      {/* Me */}
      <button onClick={showProfile ? onProfile : undefined} style={{
        background: "none", border: "none",
        cursor: showProfile ? "pointer" : "default",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        color: showProfile ? theme.accent : "#7d7869",
        padding: "4px 10px",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>{copy.me}</span>
      </button>
    </div>
  );
}

function NavIcon({ label, color, active, children }: { label: string; color: string; active?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? color : `${color}55`, padding: "4px 0" }}>
      {children}
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCAN SCREEN
═══════════════════════════════════════════════ */
type ScanStage = "idle" | "captured" | "processing" | "verified" | "error";
type CapturedPayload = { previewUrl: string; hash: string; imageData: string };
type OcrResult = { tokens: number; receiptId: string; amount: number; currency: string };

function ScanScreen({ venue, theme, copy, locale, guestToken, customerId, onComplete, onBack }: {
  venue: PlayBundle["venue"]; theme: Theme; copy: ReturnType<typeof getCopy>["play"]; locale: string; guestToken: string; customerId: string | null;
  onComplete: (tokens: number, receiptId: string, info: ScannedInfo) => void; onBack: () => void;
}) {
  const [scanStage, setScanStage]   = useState<ScanStage>("idle");
  const [errorMsg, setErrorMsg]     = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captured, setCaptured]     = useState<CapturedPayload | null>(null);
  const [ocrResult, setOcrResult]   = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openNativeCamera() { setErrorMsg(""); fileInputRef.current?.click(); }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      const arrayBuf = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuf);
      const hash = Array.from(new Uint8Array(hashBuffer)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
      const blob = new Blob([arrayBuf], { type: file.type || "image/jpeg" });
      setPreviewUrl(URL.createObjectURL(blob));
      setCaptured({ previewUrl: URL.createObjectURL(blob), hash, imageData: await blobToDataUrl(blob) });
      setScanStage("captured");
    } catch { setErrorMsg(copy.photoError); setScanStage("error"); }
  }

  async function startScan() {
    if (!captured) return;
    setScanStage("processing");
    try {
      const res = await fetch("/api/play/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData: captured.imageData, hash: captured.hash, slug: venue.slug, guestToken, customerId: customerId ?? undefined }) });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? copy.receiptVerifyError); setScanStage("error"); return; }
      const nowTime = new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      setOcrResult({ tokens: data.tokens, receiptId: data.receiptId, amount: data.amount, currency: data.currency ?? "TRY" });
      setScanStage("verified");
      setTimeout(() => onComplete(data.tokens, data.receiptId, { amount: data.amount, currency: data.currency ?? "TRY", time: nowTime }), 2200);
    } catch { setErrorMsg(copy.connectionError); setScanStage("error"); }
  }

  function retakePhoto() { setCaptured(null); setPreviewUrl(null); setErrorMsg(""); setScanStage("idle"); setTimeout(() => fileInputRef.current?.click(), 50); }

  const currSym = ocrResult?.currency === "USD" ? "$" : ocrResult?.currency === "EUR" ? "€" : "₺";
  const photoBox: React.CSSProperties = { position: "relative", width: "min(82vw,320px)", height: "min(54vh,420px)", borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: theme.bg, color: theme.text, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: theme.fontDisplay, textTransform: theme.nameTransform as React.CSSProperties["textTransform"] }}>
          {scanStage === "idle" ? copy.scanTitle : scanStage === "captured" ? copy.receiptReadyTitle : scanStage === "processing" ? copy.analyzingTitle : scanStage === "verified" ? copy.verifiedTitle : copy.error}
        </div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ flexShrink: 0, padding: "0 24px 10px", minHeight: 18, textAlign: "center" }}>
        {scanStage === "idle" && <p style={{ margin: 0, fontSize: 13, color: theme.muted }}>{copy.scanIdleHelp}</p>}
        {scanStage === "captured" && <p style={{ margin: 0, fontSize: 13, color: theme.muted }}>{copy.scanCapturedHelp}</p>}
        {scanStage === "processing" && <p style={{ margin: 0, fontSize: 13, color: theme.muted }}>{copy.scanProcessingHelp}</p>}
        {scanStage === "verified" && <p style={{ margin: 0, fontSize: 13, color: "#4ade80", fontWeight: 700 }}>{copy.scanVerifiedHelp.replace("{tokens}", String(ocrResult?.tokens ?? 1))}</p>}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 24px 24px", gap: 20, minHeight: 0 }}>
        {scanStage === "idle" && (
          <>
            <div style={{ ...photoBox, background: "rgba(10,6,2,0.8)", border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {(["tl","tr","bl","br"] as const).map((p) => <div key={p} style={cornerStyle(p, theme.accent)} />)}
              <div style={{ width: "65%", padding: "12px 14px", background: "linear-gradient(180deg,#f4ede0,#e9dfca)", color: "#3a2c14", fontFamily: "monospace", fontSize: 9, lineHeight: 1.6, boxShadow: "0 18px 40px rgba(0,0,0,0.5)", borderRadius: 4, transform: "rotate(-2deg)" }}>
                <div style={{ textAlign: "center", fontWeight: 800, fontSize: 10, letterSpacing: "0.12em" }}>{venue.name.toUpperCase()}</div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "6px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Old Fashioned</span><span>180</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Negroni</span><span>160</span></div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "6px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>TOPLAM</span><span>₺340.00</span></div>
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
              <button onClick={retakePhoto} type="button" style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.text, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{copy.retake}</button>
              <button onClick={startScan} type="button" style={{ flex: 2, padding: "16px", borderRadius: 12, background: theme.btnBg, border: "none", color: theme.btnText, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 10px 28px ${theme.glow}` }}>{copy.startScan}</button>
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
              <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, letterSpacing: "0.08em" }}>{copy.scanning}</span>
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
            <div style={{ width: "min(82vw,320px)", padding: "12px 16px", borderRadius: 14, background: theme.cardBg, border: `1px solid ${theme.border}`, display: "grid", gap: 6, flexShrink: 0 }}>
              {[{ label: copy.venueLabel, value: venue.name }, { label: copy.totalLabel, value: `${currSym} ${ocrResult?.amount?.toFixed(2) ?? "—"}`, accent: true }, { label: copy.authLabel, value: copy.passed, green: true }].map(({ label, value, accent, green }) => (
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
            <button onClick={() => { setErrorMsg(""); setCaptured(null); setPreviewUrl(null); setScanStage("idle"); }} style={{ ...primaryBtn(theme), width: "100%" }} type="button">{copy.tryAgain}</button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes rr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scan-line { 0%{top:8%;opacity:1} 50%{top:88%;opacity:1} 100%{top:8%;opacity:.3} }
        @keyframes pop-in { from{transform:scale(.4);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COUPON SCREEN
═══════════════════════════════════════════════ */
function CouponScreen({ venue, theme, copy: playCopy, coupon, onBack, onDone }: {
  venue: PlayBundle["venue"]; theme: Theme; copy: ReturnType<typeof getCopy>["play"];
  coupon: { id: string; code: string; rewardLabel: string };
  onBack: () => void; onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(coupon.code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} }
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: theme.bg, color: theme.text, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: theme.fontDisplay }}>{playCopy.couponTitle}</div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", gap: 18, minHeight: 0 }}>
        <div style={{ fontFamily: theme.fontDisplay, fontSize: "clamp(44px,12vw,72px)", fontWeight: 900, color: theme.accent, textAlign: "center", lineHeight: 1, textShadow: `0 0 32px ${theme.glow}`, animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>{playCopy.won}</div>
        <h1 style={{ margin: 0, fontSize: "clamp(22px,6vw,30px)", fontWeight: 800, textAlign: "center", color: theme.text, lineHeight: 1.15 }}>{coupon.rewardLabel}</h1>
        <p style={{ margin: 0, fontSize: 14, color: theme.muted, textAlign: "center", maxWidth: 340, lineHeight: 1.55 }}>{playCopy.couponHelp}</p>
        <div style={{ width: "100%", maxWidth: 360, padding: "22px 20px", background: theme.ctaCardBgIdle, border: `1.5px dashed ${theme.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: theme.muted, textTransform: "uppercase", textAlign: "center", fontFamily: theme.fontLabel }}>{venue.name}</div>
          <div style={{ marginTop: 14, padding: "18px 12px", background: "rgba(0,0,0,0.4)", borderRadius: 10, fontFamily: "monospace", fontSize: 26, fontWeight: 800, color: theme.accent, letterSpacing: "0.16em", textAlign: "center", border: `1px solid ${theme.border}` }}>{coupon.code}</div>
          <button onClick={copy} style={{ marginTop: 14, width: "100%", padding: "12px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{copied ? playCopy.copied : playCopy.copyCode}</button>
        </div>
        <button onClick={onDone} style={{ ...primaryBtn(theme), maxWidth: 360 }}>{playCopy.done}</button>
      </div>
      <style>{`@keyframes pop-in{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CUSTOMER AUTH SCREEN
═══════════════════════════════════════════════ */
function CustomerAuthScreen({ venue, theme, copy, onBack, onSuccess }: {
  venue: PlayBundle["venue"]; theme: Theme; copy: ReturnType<typeof getCopy>["play"];
  onBack: () => void; onSuccess: (customerId: string) => void;
}) {
  const [email, setEmail] = useState(""); const [fullName, setFullName] = useState("");
  const [consent, setConsent] = useState(false);
  const [authStage, setAuthStage] = useState<"form"|"sent"|"busy">("form");
  const [err, setErr] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setErr(copy.consentRequired); return; }
    setErr(""); setAuthStage("busy");
    const sb = createClient();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`, shouldCreateUser: true } });
    if (error) { setErr(error.message); setAuthStage("form"); return; }
    if (fullName) sessionStorage.setItem("rr_pending_name", fullName);
    sessionStorage.setItem("rr_pending_consent", "1");
    setAuthStage("sent");
  }

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const pendingName = sessionStorage.getItem("rr_pending_name") ?? undefined;
      const pendingConsent = sessionStorage.getItem("rr_pending_consent") === "1";
      sessionStorage.removeItem("rr_pending_name"); sessionStorage.removeItem("rr_pending_consent");
      const res = await fetch("/api/play/customer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: venue.slug, full_name: pendingName, consent_marketing: pendingConsent, consent_kvkk: pendingConsent }) });
      if (res.ok) { const data = await res.json() as { customer: { id: string } }; onSuccess(data.customer.id); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: theme.bg, color: theme.text, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`, color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: theme.fontDisplay, textTransform: theme.nameTransform as React.CSSProperties["textTransform"] }}>{venue.name}</div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
        {authStage === "sent" ? (
          <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: theme.text }}>{copy.emailSent}</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: theme.muted, lineHeight: 1.6 }}>{copy.emailSentHelp.replace("{email}", email)}</p>
            <button onClick={() => setAuthStage("form")} style={{ ...secondaryBtn(theme), width: "100%" }}>{copy.changeEmail}</button>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: theme.muted, textTransform: "uppercase", marginBottom: 10, fontFamily: theme.fontLabel }}>{copy.memberLogin}</div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: theme.text, fontFamily: theme.fontDisplay }}>{copy.authTitle}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: theme.muted }}>{copy.authSubtitle}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: theme.muted, textTransform: "uppercase" }}>{copy.fullName}</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={copy.fullNamePlaceholder} style={inputStyle(theme)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: theme.muted, textTransform: "uppercase" }}>{copy.authTitle.includes("Log") ? "Email *" : "E-posta *"}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={copy.emailPlaceholder} style={inputStyle(theme)} />
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: theme.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: theme.muted, lineHeight: 1.5 }}>{copy.consentText.replace("{venue}", venue.name)}</span>
            </label>
            {err && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,100,80,0.1)", border: "1px solid rgba(255,100,80,0.3)", color: "#ff8060", fontSize: 13 }}>{err}</div>}
            <button type="submit" disabled={authStage === "busy" || !email} style={{ ...primaryBtn(theme), opacity: authStage === "busy" || !email ? 0.6 : 1 }}>{authStage === "busy" ? copy.sending : copy.sendLoginLink}</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Style helpers ─── */
function primaryBtn(t: Theme): React.CSSProperties {
  return { padding: "17px 28px", borderRadius: 14, background: t.btnBg, border: "none", color: t.btnText, fontSize: 16, fontWeight: 800, cursor: "pointer", width: "100%", boxShadow: `0 10px 28px ${t.glow}`, fontFamily: t.fontDisplay };
}
function secondaryBtn(t: Theme): React.CSSProperties {
  return { padding: "13px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontWeight: 700, cursor: "pointer" };
}
function inputStyle(t: Theme): React.CSSProperties {
  return { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", color: t.text, fontSize: 14, outline: "none" };
}
function cornerStyle(pos: "tl"|"tr"|"bl"|"br", color: string): React.CSSProperties {
  const size=22,thick=2,off=12,c=`${color}b3`;
  const base: React.CSSProperties = { position:"absolute",width:size,height:size,borderColor:c,borderStyle:"solid",borderWidth:0,zIndex:2 };
  if(pos==="tl") return{...base,top:off,left:off,borderTopWidth:thick,borderLeftWidth:thick};
  if(pos==="tr") return{...base,top:off,right:off,borderTopWidth:thick,borderRightWidth:thick};
  if(pos==="bl") return{...base,bottom:off,left:off,borderBottomWidth:thick,borderLeftWidth:thick};
  return{...base,bottom:off,right:off,borderBottomWidth:thick,borderRightWidth:thick};
}
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onloadend=()=>{if(typeof r.result==="string"){resolve(r.result);return;}reject(new Error("Failed"));};r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});
}
