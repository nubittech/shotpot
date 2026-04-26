"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlotMachine } from "../../../components/SlotMachine";
import { CameraCapture } from "../../../components/CameraCapture";
import type { PlayBundle } from "../../../lib/play";

type SpinResponse = {
  outcome: string;
  win: boolean;
  isJackpot: boolean;
  coupon: { id: string; code: string; rewardLabel: string } | null;
  animationHint: "standard" | "win" | "jackpot";
};

type Stage = "intro" | "scan" | "play" | "coupon";

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
      // Wait for slot reveal animation, then drawer pops automatically inside variant
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
    return <IntroScreen venue={venue} onStart={() => setStage("scan")} />;
  }

  if (stage === "scan") {
    return (
      <ScanScreen
        venue={venue}
        guestToken={guestToken}
        onComplete={handleScanComplete}
        onBack={() => setStage("intro")}
      />
    );
  }

  if (stage === "coupon" && result?.coupon) {
    return <CouponScreen
      venue={venue}
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
function IntroScreen({ venue, onStart }: { venue: PlayBundle["venue"]; onStart: () => void }) {
  return (
    <div style={shell}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#ffd84e", textTransform: "uppercase", marginBottom: 14 }}>
          Receipt Reward
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em" }}>{venue.name}</h1>
        <p style={{ margin: "16px 0 32px", fontSize: 14, color: "rgba(244,239,230,0.6)", lineHeight: 1.55 }}>
          Hesabını ödedikten sonra fişini tara, jackpot çark döndürme hakkı kazan.
        </p>
        <button onClick={onStart} style={primaryBtn}>Fişimi Tara</button>
        <p style={{ marginTop: 22, fontSize: 11, color: "rgba(244,239,230,0.35)", letterSpacing: "0.04em" }}>
          /play/{venue.slug}
        </p>
      </div>
    </div>
  );
}

/* ─── Scan screen ─── */
type ScanStage = "idle" | "camera" | "processing" | "error";

function ScanScreen({
  venue, guestToken, onComplete, onBack,
}: {
  venue: PlayBundle["venue"];
  guestToken: string;
  onComplete: (tokens: number, receiptId: string) => void;
  onBack: () => void;
}) {
  const [scanStage, setScanStage] = useState<ScanStage>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCapture(payload: { previewUrl: string; hash: string; imageData: string }) {
    setScanStage("processing");
    setErrorMsg("");
    try {
      const res = await fetch("/api/play/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: payload.imageData,
          hash: payload.hash,
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
      onComplete(data.tokens as number, data.receiptId as string);
    } catch {
      setErrorMsg("Bağlantı hatası. Tekrar dene.");
      setScanStage("error");
    }
  }

  return (
    <div style={{ ...shell, padding: 0, flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch" }}>
      {/* Top bar */}
      <div style={{ width: "100%", padding: "20px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#f4efe6", fontSize: 16, cursor: "pointer",
        }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>Fişini Tara</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 40px" }}>

        {/* IDLE — prompt to open camera */}
        {scanStage === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 48 }}>🧾</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#f4efe6", marginBottom: 8 }}>Fişini fotoğrafla</div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.55 }}>
                Ödeme fişini kamerana hizala. Tutar ve tarih görünür olsun.
                Sadece son 1 saat içindeki fişler kabul edilir.
              </p>
            </div>
            <button
              onClick={() => setScanStage("camera")}
              style={{ ...primaryBtn, width: "100%" }}
              type="button"
            >
              📷 Kamerayı Aç
            </button>
          </div>
        )}

        {/* CAMERA — CameraCapture component */}
        {scanStage === "camera" && (
          <div style={{ width: "100%", maxWidth: 400 }}>
            <CameraCapture onCapture={handleCapture} />
          </div>
        )}

        {/* PROCESSING — spinner */}
        {scanStage === "processing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              border: "4px solid rgba(255,216,78,0.15)",
              borderTopColor: "#ffd84e",
              animation: "rr-spin 0.75s linear infinite",
            }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(244,239,230,0.7)" }}>Fiş okunuyor…</div>
            <div style={{ fontSize: 12, color: "rgba(244,239,230,0.35)" }}>AI fişi analiz ediyor</div>
          </div>
        )}

        {/* ERROR */}
        {scanStage === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ff7e5a", textAlign: "center" }}>{errorMsg}</div>
            <button
              onClick={() => { setErrorMsg(""); setScanStage("camera"); }}
              style={{ ...primaryBtn, width: "100%" }}
              type="button"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rr-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

/* ─── Coupon screen ─── */
function CouponScreen({
  venue, coupon, onBack, onDone,
}: {
  venue: PlayBundle["venue"];
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
    <div style={{ ...shell, flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", padding: 0 }}>
      {/* Top bar */}
      <div style={{ width: "100%", padding: "20px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#f4efe6", fontSize: 16, cursor: "pointer",
        }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Kuponun</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#ffd84e", textTransform: "uppercase", marginBottom: 10 }}>
          🎉 Kazandın
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, textAlign: "center", letterSpacing: "-0.01em" }}>
          {coupon.rewardLabel}
        </h1>
        <p style={{ margin: "12px 0 32px", fontSize: 13, color: "rgba(244,239,230,0.55)", textAlign: "center", maxWidth: 320, lineHeight: 1.5 }}>
          Bu kodu garsona göster. Garson "Kullanıldı" işaretledikten sonra ödülünü alabilirsin.
        </p>

        {/* Coupon ticket */}
        <div style={{
          width: "100%", maxWidth: 360, padding: "26px 22px",
          background: "linear-gradient(135deg, rgba(255,216,78,0.08), rgba(255,216,78,0.02))",
          border: "1.5px dashed rgba(255,216,78,0.45)",
          borderRadius: 18, position: "relative",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,216,78,0.7)", textTransform: "uppercase", textAlign: "center" }}>
            {venue.name}
          </div>
          <div style={{
            marginTop: 14, padding: "16px 12px",
            background: "rgba(0,0,0,0.5)", borderRadius: 10,
            fontFamily: "monospace", fontSize: 22, fontWeight: 800,
            color: "#ffd84e", letterSpacing: "0.16em", textAlign: "center",
            border: "1px solid rgba(255,216,78,0.25)",
          }}>
            {coupon.code}
          </div>
          <button onClick={copy} style={{
            marginTop: 12, width: "100%", padding: "10px",
            background: "transparent", border: "1px solid rgba(255,216,78,0.3)",
            borderRadius: 10, color: "#ffd84e", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            {copied ? "✓ Kopyalandı" : "Kodu Kopyala"}
          </button>
        </div>

        <button onClick={onDone} style={{ ...primaryBtn, marginTop: 28, maxWidth: 360 }}>
          Tamam
        </button>
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const shell: React.CSSProperties = {
  minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6",
  display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px",
  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
};

const primaryBtn: React.CSSProperties = {
  padding: "16px 28px", borderRadius: 14,
  background: "#ffd84e", border: "none", color: "#111",
  fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: "0.02em",
  width: "100%", boxShadow: "0 10px 28px rgba(255,216,78,0.25)",
};

function cornerStyle(pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties {
  const size = 22, thick = 2, off = 14, color = "rgba(255,216,78,0.7)";
  const base: React.CSSProperties = { position: "absolute", width: size, height: size, borderColor: color, borderStyle: "solid", borderWidth: 0 };
  if (pos === "tl") return { ...base, top: off, left: off, borderTopWidth: thick, borderLeftWidth: thick };
  if (pos === "tr") return { ...base, top: off, right: off, borderTopWidth: thick, borderRightWidth: thick };
  if (pos === "bl") return { ...base, bottom: off, left: off, borderBottomWidth: thick, borderLeftWidth: thick };
  return { ...base, bottom: off, right: off, borderBottomWidth: thick, borderRightWidth: thick };
}
