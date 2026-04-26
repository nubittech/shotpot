"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (payload: { previewUrl: string; hash: string; imageData: string }) => void;
  onBack: () => void;
  venueName?: string;
};

function Corner({ pos }: { pos: "tl" | "tr" | "br" | "bl" }) {
  const s = 36;
  const t = 3;
  const c = "#e8c876";
  const base: React.CSSProperties = { position: "absolute", width: s, height: s };
  const sides: React.CSSProperties =
    pos === "tl" ? { top: 0, left: 0, borderTop: `${t}px solid ${c}`, borderLeft: `${t}px solid ${c}`, borderRadius: "4px 0 0 0" }
    : pos === "tr" ? { top: 0, right: 0, borderTop: `${t}px solid ${c}`, borderRight: `${t}px solid ${c}`, borderRadius: "0 4px 0 0" }
    : pos === "br" ? { bottom: 0, right: 0, borderBottom: `${t}px solid ${c}`, borderRight: `${t}px solid ${c}`, borderRadius: "0 0 4px 0" }
    : { bottom: 0, left: 0, borderBottom: `${t}px solid ${c}`, borderLeft: `${t}px solid ${c}`, borderRadius: "0 0 0 4px" };
  return <div style={{ ...base, ...sides }} />;
}

function MockReceipt({ venueName }: { venueName?: string }) {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return (
    <div style={{
      background: "#f9f5ec",
      borderRadius: 4,
      padding: "28px 24px 40px",
      width: "76%",
      maxHeight: "86%",
      transform: "rotate(-3deg)",
      boxShadow: "0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
      fontFamily: "'Courier New', Courier, monospace",
      color: "#1a1208",
      overflow: "hidden",
    }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.06em" }}>{venueName?.toUpperCase() ?? "MIDNIGHT TAP"}</div>
        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>Karaköy · Istanbul</div>
        <div style={{ fontSize: 10, opacity: 0.6 }}>{dateStr}</div>
      </div>
      <div style={{ borderTop: "1px dashed rgba(26,18,8,0.35)", margin: "10px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
        <span>1× Old Fashioned</span><span>180</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
        <span>1× Negroni</span><span>160</span>
      </div>
      <div style={{ borderTop: "1px dashed rgba(26,18,8,0.35)", margin: "10px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
        <span>TOTAL</span><span>₺ 340.00</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 9, opacity: 0.45 }}>Thank you · #4821</div>
    </div>
  );
}

export function ReceiptScanner({ onCapture, onBack, venueName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [captured, setCaptured] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => stopStream(), []);

  async function startCamera() {
    setError("");
    setStarting(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
    } catch {
      setError("Kamera açılamadı. Tarayıcı iznini kontrol et.");
    } finally {
      setStarting(false);
    }
  }

  async function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    if (!blob) return;
    const buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const hash = Array.from(new Uint8Array(buf)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
    const pUrl = URL.createObjectURL(blob);
    const imageData = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => (typeof r.result === "string" ? res(r.result) : rej());
      r.onerror = () => rej(r.error);
      r.readAsDataURL(blob);
    });
    stopStream();
    setPreviewUrl(pUrl);
    setCaptured(true);
    onCapture({ previewUrl: pUrl, hash, imageData });
  }

  function stopStream() {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); setStream(null); }
  }

  function retake() {
    setPreviewUrl("");
    setCaptured(false);
    startCamera();
  }

  const showMock = !stream && !captured && !starting;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      background: "#0c0a10",
      display: "flex", flexDirection: "column",
    }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 300, background: "radial-gradient(60% 100% at 50% 100%, rgba(100,60,180,0.18) 0%, transparent 100%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 18px 0", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <button
          onClick={onBack}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
          type="button"
        >‹</button>
        <span style={{ fontWeight: 600, fontSize: 17, color: "#fff", letterSpacing: "-0.01em" }}>Scan your receipt</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Subtitle */}
      <p style={{ textAlign: "center", padding: "10px 48px 0", margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 13.5, fontWeight: 400, lineHeight: 1.55, flexShrink: 0, position: "relative", zIndex: 2 }}>
        Align your bar receipt inside the frame. Hold steady.
      </p>

      {/* Scanner frame */}
      <div style={{ flex: 1, position: "relative", margin: "16px 44px 0", maxHeight: 480, zIndex: 2 }}>
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="br" /><Corner pos="bl" />

        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {stream && !captured && (
            <video playsInline ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.88 }} />
          )}
          {showMock && <MockReceipt venueName={venueName} />}
          {captured && previewUrl && (
            <img
              alt="Fiş önizleme"
              src={previewUrl}
              style={{ maxWidth: "80%", maxHeight: "88%", objectFit: "contain", transform: "rotate(-3deg)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)", borderRadius: 4 }}
            />
          )}
          {starting && (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Kamera başlatılıyor...</div>
          )}
          {error && (
            <div style={{ color: "#ff7e5a", fontSize: 13, textAlign: "center", padding: "0 24px" }}>{error}</div>
          )}
        </div>
      </div>

      {/* Bottom action */}
      <div style={{ height: 144, display: "flex", alignItems: "center", justifyContent: "center", gap: 28, flexShrink: 0, position: "relative", zIndex: 2 }}>
        {!captured && (
          <button
            disabled={starting}
            onClick={stream ? takePhoto : startCamera}
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "radial-gradient(circle at 38% 36%, #f5d27a 0%, #e8c876 55%, #c8a84a 100%)",
              border: "4px solid rgba(255,255,255,0.45)",
              boxShadow: "0 0 0 2px #e8c876, 0 8px 28px rgba(232,200,118,0.5)",
              cursor: starting ? "default" : "pointer",
              opacity: starting ? 0.5 : 1,
            }}
            type="button"
          />
        )}
        {captured && (
          <>
            <button onClick={retake} style={{ padding: "12px 22px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer" }} type="button">
              Tekrar Çek
            </button>
            <button onClick={onBack} style={{ padding: "12px 28px", borderRadius: 999, background: "#e8c876", border: "none", color: "#1a1208", fontSize: 13, fontWeight: 700, cursor: "pointer" }} type="button">
              Kullan
            </button>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
