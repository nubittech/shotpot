"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlotMachine } from "../../../components/SlotMachine";
import { CameraCapture, startCameraStream } from "../../../components/CameraCapture";
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
type ScanStage = "idle" | "camera" | "processing" | "verified" | "error";

type OcrResult = {
  tokens: number;
  receiptId: string;
  amount: number;
  currency: string;
};

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  async function openCamera() {
    try {
      // Must be called directly from user gesture — iOS/Chrome enforce this
      const stream = await startCameraStream();
      setCameraStream(stream);
      setScanStage("camera");
    } catch {
      setErrorMsg("Kamera açılamadı. Tarayıcı kamera iznini kontrol edin.");
      setScanStage("error");
    }
  }

  function handleCameraCancel() {
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setScanStage("idle");
  }

  async function handleCapture(payload: { previewUrl: string; hash: string; imageData: string }) {
    setPreviewUrl(payload.previewUrl);
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
      setOcrResult({ tokens: data.tokens, receiptId: data.receiptId, amount: data.amount, currency: data.currency ?? "TRY" });
      setScanStage("verified");
      // Auto-advance to slot after 2.2s
      setTimeout(() => onComplete(data.tokens, data.receiptId), 2200);
    } catch {
      setErrorMsg("Bağlantı hatası. Tekrar dene.");
      setScanStage("error");
    }
  }

  const currencySymbol = ocrResult?.currency === "USD" ? "$" : ocrResult?.currency === "EUR" ? "€" : "₺";
  const nowStr = new Date().toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ ...shell, padding: 0, flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", background: "#0a0a0c" }}>
      {/* Top bar */}
      <div style={{ width: "100%", padding: "20px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#f4efe6", fontSize: 16, cursor: "pointer",
        }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {scanStage === "idle" ? "Fişini Tara" : scanStage === "camera" ? "Fişi Çerçevele" : scanStage === "processing" ? "Analiz Ediliyor" : scanStage === "verified" ? "Doğrulandı" : "Hata"}
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Info text */}
      {(scanStage === "idle" || scanStage === "camera") && (
        <p style={{ margin: "0 24px 16px", fontSize: 12, color: "rgba(244,239,230,0.45)", textAlign: "center", lineHeight: 1.5 }}>
          Fişi çerçevenin içine hizala · Tutar ve tarih görünür olsun · Son 1 saat geçerli
        </p>
      )}
      {scanStage === "verified" && (
        <p style={{ margin: "0 24px 10px", fontSize: 12, color: "#4ade80", textAlign: "center", fontWeight: 600 }}>
          Doğrulandı · {ocrResult?.tokens ?? 1} çevirme hakkı kazandın
        </p>
      )}
      {scanStage === "processing" && (
        <p style={{ margin: "0 24px 10px", fontSize: 12, color: "rgba(244,239,230,0.45)", textAlign: "center" }}>
          AI fişini analiz ediyor…
        </p>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "0 24px 36px" }}>

        {/* IDLE — camera frame with mock receipt */}
        {scanStage === "idle" && (
          <>
            {/* Camera frame */}
            <div style={{
              position: "relative", width: "100%", maxWidth: 340, aspectRatio: "3 / 4",
              borderRadius: 18, overflow: "hidden",
              background: "linear-gradient(180deg, #1a1810 0%, #0a0a0c 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Corner brackets */}
              {(["tl","tr","bl","br"] as const).map((p) => (
                <div key={p} style={cornerStyle(p)} />
              ))}
              {/* Mock receipt */}
              <div style={{
                width: "62%", padding: "14px 16px",
                background: "linear-gradient(180deg, #f4ede0, #e9dfca)",
                color: "#3a2c14", fontFamily: "monospace", fontSize: 9, lineHeight: 1.6,
                boxShadow: "0 18px 40px rgba(0,0,0,0.5)", borderRadius: 4,
                transform: "rotate(-2deg)",
              }}>
                <div style={{ textAlign: "center", fontWeight: 800, fontSize: 10, letterSpacing: "0.12em" }}>{venue.name.toUpperCase()}</div>
                <div style={{ textAlign: "center", fontSize: 8, opacity: 0.6 }}>Karaköy · İstanbul</div>
                <div style={{ textAlign: "center", fontSize: 8, opacity: 0.5 }}>{new Date().toLocaleDateString("tr-TR")} {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "7px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Old Fashioned</span><span>180</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1× Negroni</span><span>160</span></div>
                <div style={{ borderTop: "1px dashed #3a2c14", margin: "7px 0", opacity: 0.4 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>TOPLAM</span><span>₺ 340.00</span></div>
                <div style={{ textAlign: "center", marginTop: 7, fontSize: 7, opacity: 0.5 }}>#4821 · teşekkürler</div>
              </div>
            </div>

            {/* Capture button */}
            <button
              onClick={openCamera}
              type="button"
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#ffd84e",
                border: "5px solid rgba(255,216,78,0.2)",
                cursor: "pointer",
                boxShadow: "0 0 32px rgba(255,216,78,0.4)",
                marginTop: 28,
              }}
              aria-label="Kamerayı aç"
            />
          </>
        )}

        {/* CAMERA — stream already open from user gesture */}
        {scanStage === "camera" && cameraStream && (
          <div style={{ width: "100%", maxWidth: 400, flex: 1, display: "flex", alignItems: "flex-start", paddingTop: 8 }}>
            <CameraCapture
              initialStream={cameraStream}
              onCapture={handleCapture}
              onCancel={handleCameraCancel}
            />
          </div>
        )}

        {/* PROCESSING — receipt image + scan line animation */}
        {scanStage === "processing" && previewUrl && (
          <div style={{ position: "relative", width: "100%", maxWidth: 340, aspectRatio: "3 / 4", borderRadius: 18, overflow: "hidden" }}>
            {/* Corner brackets */}
            {(["tl","tr","bl","br"] as const).map((p) => (
              <div key={p} style={cornerStyle(p)} />
            ))}
            {/* Receipt photo blurred */}
            <img src={previewUrl} alt="fiş" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(1.5px) brightness(0.7)" }} />
            {/* Scan line */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, transparent, #ffd84e, transparent)",
              boxShadow: "0 0 18px 4px rgba(255,216,78,0.6)",
              animation: "scan-line 1.6s ease-in-out infinite",
            }} />
            {/* Spinner overlay */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "4px solid rgba(255,216,78,0.15)",
                borderTopColor: "#ffd84e",
                animation: "rr-spin 0.75s linear infinite",
              }} />
            </div>
          </div>
        )}

        {/* VERIFIED — receipt + green check + summary card */}
        {scanStage === "verified" && previewUrl && (
          <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Receipt with green check */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4", borderRadius: 18, overflow: "hidden" }}>
              <img src={previewUrl} alt="fiş" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
              {/* Green check circle */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "radial-gradient(circle, #22c55e 0%, #16a34a 100%)",
                  boxShadow: "0 0 40px rgba(34,197,94,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, animation: "pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}>✓</div>
              </div>
            </div>
            {/* Summary card */}
            <div style={{
              padding: "16px 20px", borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "grid", gap: 10,
            }}>
              {[
                { label: "VENUE", value: venue.name },
                { label: "DATE",  value: nowStr },
                { label: "TOTAL", value: `${currencySymbol} ${ocrResult?.amount?.toFixed(2) ?? "—"}`, accent: true },
                { label: "AUTH",  value: "PASSED", green: true },
              ].map(({ label, value, accent, green }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(244,239,230,0.35)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: green ? "#4ade80" : accent ? "#ffd84e" : "#f4efe6" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {scanStage === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ff7e5a", textAlign: "center" }}>{errorMsg}</div>
            <button
              onClick={() => { setErrorMsg(""); setCameraStream(null); setScanStage("idle"); }}
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
        @keyframes scan-line {
          0%   { top: 10%; opacity: 1; }
          50%  { top: 85%; opacity: 1; }
          100% { top: 10%; opacity: 0.3; }
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
