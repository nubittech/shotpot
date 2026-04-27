"use client";

import { useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  /** Pre-started MediaStream from user gesture — skips getUserMedia entirely */
  initialStream: MediaStream;
  onCapture: (payload: { previewUrl: string; hash: string; imageData: string }) => void;
  onCancel: () => void;
};

export function CameraCapture({ initialStream, onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = initialStream;
    video.play().then(() => setReady(true)).catch(() => setReady(true));

    return () => {
      initialStream.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;

    const hashBuffer = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const hash = Array.from(new Uint8Array(hashBuffer))
      .slice(0, 12)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const previewUrl = URL.createObjectURL(blob);
    const imageData = await blobToDataUrl(blob);
    initialStream.getTracks().forEach((t) => t.stop());
    onCapture({ previewUrl, hash, imageData });
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{
        width: "100%", maxWidth: 340, aspectRatio: "3/4",
        borderRadius: 18, overflow: "hidden", background: "#111",
        position: "relative",
      }}>
        {/* Corner brackets */}
        {(["tl","tr","bl","br"] as const).map((p) => (
          <div key={p} style={cornerStyle(p)} />
        ))}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {!ready && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#111",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid rgba(255,216,78,0.2)", borderTopColor: "#ffd84e",
              animation: "rr-spin 0.75s linear infinite",
            }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 340 }}>
        <button
          onClick={onCancel}
          type="button"
          style={{
            flex: 1, padding: "14px", borderRadius: 12,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#f4efe6", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          İptal
        </button>
        <button
          onClick={takePhoto}
          disabled={!ready}
          type="button"
          style={{
            flex: 2, padding: "14px", borderRadius: 12,
            background: ready ? "#ffd84e" : "rgba(255,216,78,0.3)",
            border: "none", color: "#111",
            fontSize: 13, fontWeight: 800, cursor: ready ? "pointer" : "default",
            transition: "background 0.2s",
          }}
        >
          {ready ? "Fişi Çek" : "Hazırlanıyor…"}
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style>{`@keyframes rr-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

/** Start camera from a user gesture — call this directly in onClick */
export async function startCameraStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1600 } },
    audio: false,
  });
}

function cornerStyle(pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties {
  const size = 22, thick = 2, off = 14, color = "rgba(255,216,78,0.7)";
  const base: React.CSSProperties = { position: "absolute", width: size, height: size, borderColor: color, borderStyle: "solid", borderWidth: 0, zIndex: 2 };
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
