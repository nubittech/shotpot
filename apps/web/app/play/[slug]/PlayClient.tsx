"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlotMachine } from "../../../components/SlotMachine";
import type { PlayBundle } from "../../../lib/play";
import type { SlotVariantDB } from "../../../lib/supabase/types";

type SpinResponse = {
  outcome: string;
  win: boolean;
  isJackpot: boolean;
  coupon: { id: string; code: string; rewardLabel: string } | null;
  animationHint: "standard" | "win" | "jackpot";
};

type Stage = "intro" | "scan" | "play" | "coupon";

/* ─── Theme palettes per slot variant ─── */
type Theme = {
  bg: string;
  accent: string;       // primary accent (gold / magenta / champagne)
  accent2: string;      // secondary accent (red / cyan / light gold)
  text: string;
  muted: string;
  border: string;
  font: string;
  btnBg: string;
  btnText: string;
  glow: string;
  receiptTint: string;  // tint for the captured-photo overlay
};

const THEMES: Record<SlotVariantDB, Theme> = {
  v1: {
    bg: "radial-gradient(120% 80% at 50% 0%,#2c1908 0%,#150803 70%,#08030a 100%)",
    accent: "#e8c876",
    accent2: "#c81e35",
    text: "#fff8e0",
    muted: "rgba(232,200,118,0.55)",
    border: "rgba(232,200,118,0.3)",
    font: "'Playfair Display', Georgia, serif",
    btnBg: "#e8c876",
    btnText: "#2c1908",
    glow: "rgba(232,200,118,0.35)",
    receiptTint: "linear-gradient(180deg, rgba(232,200,118,0.08), rgba(200,30,53,0.04))",
  },
  v2: {
    bg: "linear-gradient(160deg,#1a0228 0%,#0a0014 100%)",
    accent: "#ff2d8a",
    accent2: "#00e8ff",
    text: "#fbeaff",
    muted: "rgba(0,232,255,0.65)",
    border: "rgba(255,45,138,0.45)",
    font: "'Bebas Neue', 'Impact', sans-serif",
    btnBg: "#ff2d8a",
    btnText: "#fff",
    glow: "rgba(255,45,138,0.5)",
    receiptTint: "linear-gradient(180deg, rgba(255,45,138,0.08), rgba(0,232,255,0.04))",
  },
  v3: {
    bg: "radial-gradient(80% 60% at 50% 30%,#1a1408 0%,#0a0805 70%,#050402 100%)",
    accent: "#caa14a",
    accent2: "#f5d27a",
    text: "#f5d27a",
    muted: "rgba(202,161,74,0.6)",
    border: "rgba(202,161,74,0.45)",
    font: "'Cinzel', Georgia, serif",
    btnBg: "#caa14a",
    btnText: "#1a1408",
    glow: "rgba(202,161,74,0.35)",
    receiptTint: "linear-gradient(180deg, rgba(202,161,74,0.06), rgba(245,210,122,0.03))",
  },
};

function getOrCreateGuestToken() {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem("rr_guest_token");
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem("rr_guest_token", t);
  }
  return t;
}

export function PlayClient({ bundle }: { bundle: PlayBundle }) {
  const { venue, config } = bundle;
  const router = useRouter();
  const variant = (config.variant ?? "v1") as SlotVariantDB;
  const theme = THEMES[variant] ?? THEMES.v1;

  const [stage, setStage] = useState<Stage>("intro");
  const [tokens, setTokens] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResponse | null>(null);
  const [guestToken, setGuestToken] = useState("");
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    setGuestToken(getOrCreateGuestToken());
  }, []);

  async function pullLever() {
    if (spinning || tokens < 1) return;
    setSpinning(true);
    setResult(null);

    try {
      const res = await fetch("/api/play/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: venue.slug, guestToken, receiptId }),
      });
      await new Promise((r) => setTimeout(r, 1600));

      if (!res.ok) {
        setSpinning(false);
        return;
      }
      const data = (await res.json()) as SpinResponse;
      setResult(data);
      setTokens((t) => Math.max(0, t - 1));
    } catch {
      // network down — silent
    } finally {
      setSpinning(false);
    }
  }

  function handleScanComplete(earnedTokens: number, newReceiptId: string) {
    setTokens(earnedTokens);
    setReceiptId(newReceiptId);
    setStage("play");
  }

  /* ─── Stages ─── */
  if (stage === "intro") {
    return <IntroScreen venue={venue} theme={theme} onStart={() => setStage("scan")} />;
  }

  if (stage === "scan") {
    return (
      <ScanScreen
        venue={venue}
        theme={theme}
        guestToken={guestToken}
        onComplete={handleScanComplete}
        onBack={() => setStage("intro")}
      />
    );
  }

  if (stage === "coupon" && result?.coupon) {
    return <CouponScreen
      venue={venue}
      theme={theme}
      coupon={result.coupon}
      onBack={() => { setResult(null); setStage("play"); }}
      onDone={() => { setResult(null); setStage("intro"); }}
    />;
  }

  // stage === "play"
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <SlotMachine
        tokens={tokens}
        outcome={result?.outcome ?? null}
        animationHint={result?.animationHint ?? null}
        logoSymbol={venue.name.slice(0, 2).toUpperCase()}
        spinning={spinning}
        canSpin={tokens > 0 && !spinning}
        onSpin={pullLever}
        variant={config.variant}
        venueName={venue.name}
        onBack={() => setStage("intro")}
        onReset={() => setResult(null)}
        onShowCoupon={() => result?.coupon && setStage("coupon")}
        onExit={() => { setResult(null); setStage("intro"); }}
      />
    </div>
  );
}

/* ─── Intro screen ─── */
function IntroScreen({ venue, theme, onStart }: { venue: PlayBundle["venue"]; theme: Theme; onStart: () => void }) {
  return (
    <div style={shell(theme)}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: theme.accent, textTransform: "uppercase", marginBottom: 16, fontFamily: theme.font }}>
          Receipt Reward
        </div>
        <h1 style={{ margin: 0, fontSize: "clamp(32px, 9vw, 42px)", fontWeight: 900, letterSpacing: "-0.02em", color: theme.text, fontFamily: theme.font, lineHeight: 1.05 }}>{venue.name}</h1>
        <p style={{ margin: "18px 0 36px", fontSize: 15, color: theme.muted, lineHeight: 1.55 }}>
          Hesabını ödedikten sonra fişini tara, jackpot çark döndürme hakkı kazan.
        </p>
        <button onClick={onStart} style={primaryBtn(theme)}>Fişimi Tara</button>
        <p style={{ marginTop: 24, fontSize: 12, color: theme.muted, letterSpacing: "0.04em", opacity: 0.55 }}>
          /play/{venue.slug}
        </p>
      </div>
    </div>
  );
}

/* ─── Scan screen ─── */
type ScanStage = "idle" | "captured" | "processing" | "verified" | "error";

type CapturedPayload = { previewUrl: string; hash: string; imageData: string };

type OcrResult = {
  tokens: number;
  receiptId: string;
  amount: number;
  currency: string;
};

function ScanScreen({
  venue, theme, guestToken, onComplete, onBack,
}: {
  venue: PlayBundle["venue"];
  theme: Theme;
  guestToken: string;
  onComplete: (tokens: number, receiptId: string) => void;
  onBack: () => void;
}) {
  const [scanStage, setScanStage] = useState<ScanStage>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captured, setCaptured] = useState<CapturedPayload | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openNativeCamera() {
    setErrorMsg("");
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const arrayBuf = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuf);
      const hash = Array.from(new Uint8Array(hashBuffer))
        .slice(0, 12)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const blob = new Blob([arrayBuf], { type: file.type || "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      const imageData = await blobToDataUrl(blob);

      const payload: CapturedPayload = { previewUrl, hash, imageData };
      setPreviewUrl(previewUrl);
      setCaptured(payload);
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
        body: JSON.stringify({
          imageData: captured.imageData,
          hash: captured.hash,
          slug: venue.slug,
          guestToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Fiş doğrulanamadı.");
        setScanStage("error");
        return;
      }
      setOcrResult({ tokens: data.tokens, receiptId: data.receiptId, amount: data.amount, currency: data.currency ?? "TRY" });
      setScanStage("verified");
      setTimeout(() => onComplete(data.tokens, data.receiptId), 2200);
    } catch {
      setErrorMsg("Bağlantı hatası. Tekrar dene.");
      setScanStage("error");
    }
  }

  function retakePhoto() {
    setCaptured(null);
    setPreviewUrl(null);
    setErrorMsg("");
    setScanStage("idle");
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  const currencySymbol = ocrResult?.currency === "USD" ? "$" : ocrResult?.currency === "EUR" ? "€" : "₺";
  const nowStr = new Date().toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  /* Photo container — fixed sizing relative to viewport so screen never scrolls */
  const photoBox: React.CSSProperties = {
    position: "relative",
    width: "min(82vw, 320px)",
    height: "min(54vh, 420px)",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: `0 12px 32px rgba(0,0,0,0.5)`,
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      background: theme.bg, color: theme.text,
      fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Top bar */}
      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `rgba(255,255,255,0.04)`, border: `1px solid ${theme.border}`,
          color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1,
        }}>‹</button>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: theme.text, fontFamily: theme.font }}>
          {scanStage === "idle" ? "Fişini Tara"
            : scanStage === "captured" ? "Fişin Hazır"
            : scanStage === "processing" ? "Analiz Ediliyor"
            : scanStage === "verified" ? "Doğrulandı"
            : "Hata"}
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Info text — single line so layout stays compact */}
      <div style={{ flexShrink: 0, padding: "0 24px 10px", minHeight: 18 }}>
        {scanStage === "idle" && (
          <p style={{ margin: 0, fontSize: 13, color: theme.muted, textAlign: "center", lineHeight: 1.4 }}>
            Sarı düğmeye bas · Kamera açılır · Fiş son 1 saat geçerli
          </p>
        )}
        {scanStage === "captured" && (
          <p style={{ margin: 0, fontSize: 13, color: theme.muted, textAlign: "center", lineHeight: 1.4 }}>
            Fotoğraf net mi? Yeniden çek veya taramaya başla.
          </p>
        )}
        {scanStage === "processing" && (
          <p style={{ margin: 0, fontSize: 13, color: theme.muted, textAlign: "center" }}>
            AI fişini analiz ediyor…
          </p>
        )}
        {scanStage === "verified" && (
          <p style={{ margin: 0, fontSize: 13, color: "#4ade80", textAlign: "center", fontWeight: 700 }}>
            Doğrulandı · {ocrResult?.tokens ?? 1} çevirme hakkı kazandın
          </p>
        )}
      </div>

      {/* Main viewport area — flex, no scroll */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "8px 24px 24px", gap: 20, minHeight: 0,
      }}>

        {/* IDLE — frame with mock receipt */}
        {scanStage === "idle" && (
          <>
            <div style={{
              ...photoBox,
              background: "linear-gradient(180deg, rgba(20,16,8,0.6) 0%, rgba(8,6,3,0.9) 100%)",
              border: `1px solid ${theme.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {(["tl","tr","bl","br"] as const).map((p) => (
                <div key={p} style={cornerStyle(p, theme.accent)} />
              ))}
              {/* Mock receipt */}
              <div style={{
                width: "65%", padding: "12px 14px",
                background: "linear-gradient(180deg, #f4ede0, #e9dfca)",
                color: "#3a2c14", fontFamily: "monospace", fontSize: 9, lineHeight: 1.6,
                boxShadow: "0 18px 40px rgba(0,0,0,0.5)", borderRadius: 4,
                transform: "rotate(-2deg)",
              }}>
                <div style={{ textAlign: "center", fontWeight: 800, fontSize: 10, letterSpacing: "0.12em" }}>{venue.name.toUpperCase()}</div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "6px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Old Fashioned</span><span>180</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Negroni</span><span>160</span></div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "6px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>TOPLAM</span><span>₺ 340.00</span></div>
              </div>
            </div>

            <button
              onClick={openNativeCamera}
              type="button"
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: theme.btnBg,
                border: `5px solid ${theme.glow}`,
                cursor: "pointer",
                boxShadow: `0 0 32px ${theme.glow}`,
                flexShrink: 0,
              }}
              aria-label="Kamerayı aç"
            />
          </>
        )}

        {/* CAPTURED — clear photo + actions */}
        {scanStage === "captured" && previewUrl && (
          <>
            <div style={photoBox}>
              {(["tl","tr","bl","br"] as const).map((p) => (
                <div key={p} style={cornerStyle(p, theme.accent)} />
              ))}
              <img src={previewUrl} alt="çekilen fiş" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>

            <div style={{ display: "flex", gap: 12, width: "min(82vw, 320px)", flexShrink: 0 }}>
              <button
                onClick={retakePhoto}
                type="button"
                style={{
                  flex: 1, padding: "16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`,
                  color: theme.text, fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}
              >
                ↺ Yeniden Çek
              </button>
              <button
                onClick={startScan}
                type="button"
                style={{
                  flex: 2, padding: "16px", borderRadius: 12,
                  background: theme.btnBg, border: "none", color: theme.btnText,
                  fontSize: 15, fontWeight: 800, cursor: "pointer",
                  boxShadow: `0 10px 28px ${theme.glow}`,
                }}
              >
                Taramayı Başlat
              </button>
            </div>
          </>
        )}

        {/* PROCESSING — clear photo + scan animation */}
        {scanStage === "processing" && previewUrl && (
          <div style={photoBox}>
            {(["tl","tr","bl","br"] as const).map((p) => (
              <div key={p} style={cornerStyle(p, theme.accent)} />
            ))}
            <img src={previewUrl} alt="fiş" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: theme.receiptTint,
              pointerEvents: "none",
            }} />
            {/* Scan line */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
              boxShadow: `0 0 24px 6px ${theme.glow}`,
              animation: "scan-line 1.6s ease-in-out infinite",
              pointerEvents: "none",
            }} />
            {/* Spinner badge */}
            <div style={{
              position: "absolute", bottom: 12, right: 12,
              padding: "6px 12px", borderRadius: 999,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", gap: 8,
              border: `1px solid ${theme.border}`,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: `2px solid rgba(255,255,255,0.15)`,
                borderTopColor: theme.accent,
                animation: "rr-spin 0.75s linear infinite",
              }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, letterSpacing: "0.08em" }}>TARANIYOR</span>
            </div>
          </div>
        )}

        {/* VERIFIED — receipt with green check + small summary */}
        {scanStage === "verified" && previewUrl && (
          <>
            <div style={{ ...photoBox, height: "min(46vh, 360px)" }}>
              <img src={previewUrl} alt="fiş" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "radial-gradient(circle, #22c55e 0%, #16a34a 100%)",
                  boxShadow: "0 0 40px rgba(34,197,94,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, color: "#fff",
                  animation: "pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}>✓</div>
              </div>
            </div>
            <div style={{
              width: "min(82vw, 320px)", padding: "12px 16px", borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${theme.border}`,
              display: "grid", gap: 6, flexShrink: 0,
            }}>
              {[
                { label: "VENUE", value: venue.name },
                { label: "DATE",  value: nowStr },
                { label: "TOTAL", value: `${currencySymbol} ${ocrResult?.amount?.toFixed(2) ?? "—"}`, accent: true },
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

        {/* ERROR */}
        {scanStage === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "min(82vw, 360px)" }}>
            <div style={{ fontSize: 38 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ff7e5a", textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.55 }}>{errorMsg}</div>
            <button
              onClick={() => { setErrorMsg(""); setCaptured(null); setPreviewUrl(null); setScanStage("idle"); }}
              style={{ ...primaryBtn(theme), width: "100%" }}
              type="button"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rr-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes scan-line {
          0%   { top: 8%; opacity: 1; }
          50%  { top: 88%; opacity: 1; }
          100% { top: 8%; opacity: 0.3; }
        }
        @keyframes pop-in {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Coupon screen ─── */
function CouponScreen({
  venue, theme, coupon, onBack, onDone,
}: {
  venue: PlayBundle["venue"];
  theme: Theme;
  coupon: { id: string; code: string; rewardLabel: string };
  onBack: () => void;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      background: theme.bg, color: theme.text,
      fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.border}`,
          color: theme.accent, fontSize: 18, cursor: "pointer", lineHeight: 1,
        }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: theme.font, letterSpacing: "0.02em" }}>Kuponun</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 24px",
        gap: 18, minHeight: 0,
      }}>
        {/* HUGE "Kazandın" headline */}
        <div style={{
          fontFamily: theme.font,
          fontSize: "clamp(44px, 12vw, 72px)",
          fontWeight: 900,
          letterSpacing: "0.02em",
          color: theme.accent,
          textAlign: "center",
          lineHeight: 1,
          textShadow: `0 0 32px ${theme.glow}`,
          animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          🎉 KAZANDIN
        </div>

        <h1 style={{
          margin: 0, fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 800,
          textAlign: "center", letterSpacing: "-0.01em", color: theme.text,
          lineHeight: 1.15,
        }}>
          {coupon.rewardLabel}
        </h1>

        <p style={{ margin: 0, fontSize: 14, color: theme.muted, textAlign: "center", maxWidth: 340, lineHeight: 1.55 }}>
          Bu kodu garsona göster. Garson "Kullanıldı" işaretledikten sonra ödülünü alabilirsin.
        </p>

        {/* Coupon ticket */}
        <div style={{
          width: "100%", maxWidth: 360, padding: "22px 20px",
          background: `linear-gradient(135deg, ${theme.glow}, transparent)`,
          border: `1.5px dashed ${theme.border}`,
          borderRadius: 18, position: "relative",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: theme.muted, textTransform: "uppercase", textAlign: "center", fontFamily: theme.font }}>
            {venue.name}
          </div>
          <div style={{
            marginTop: 14, padding: "18px 12px",
            background: "rgba(0,0,0,0.5)", borderRadius: 10,
            fontFamily: "monospace", fontSize: 26, fontWeight: 800,
            color: theme.accent, letterSpacing: "0.16em", textAlign: "center",
            border: `1px solid ${theme.border}`,
          }}>
            {coupon.code}
          </div>
          <button onClick={copy} style={{
            marginTop: 14, width: "100%", padding: "12px",
            background: "transparent", border: `1px solid ${theme.border}`,
            borderRadius: 10, color: theme.accent, fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            {copied ? "✓ Kopyalandı" : "Kodu Kopyala"}
          </button>
        </div>

        <button onClick={onDone} style={{ ...primaryBtn(theme), maxWidth: 360 }}>
          Tamam
        </button>
      </div>

      <style>{`
        @keyframes pop-in {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Themed style helpers ─── */
function shell(theme: Theme): React.CSSProperties {
  return {
    minHeight: "100vh", background: theme.bg, color: theme.text,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px",
    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
  };
}

function primaryBtn(theme: Theme): React.CSSProperties {
  return {
    padding: "17px 28px", borderRadius: 14,
    background: theme.btnBg, border: "none", color: theme.btnText,
    fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: "0.02em",
    width: "100%", boxShadow: `0 10px 28px ${theme.glow}`,
  };
}

function cornerStyle(pos: "tl" | "tr" | "bl" | "br", color: string): React.CSSProperties {
  const size = 22, thick = 2, off = 12;
  const c = `${color}b3`; // ~70% alpha hex append
  const base: React.CSSProperties = { position: "absolute", width: size, height: size, borderColor: c, borderStyle: "solid", borderWidth: 0, zIndex: 2 };
  if (pos === "tl") return { ...base, top: off, left: off, borderTopWidth: thick, borderLeftWidth: thick };
  if (pos === "tr") return { ...base, top: off, right: off, borderTopWidth: thick, borderRightWidth: thick };
  if (pos === "bl") return { ...base, bottom: off, left: off, borderBottomWidth: thick, borderLeftWidth: thick };
  return { ...base, bottom: off, right: off, borderBottomWidth: thick, borderRightWidth: thick };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") { resolve(reader.result); return; }
      reject(new Error("Failed to read blob as data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}
