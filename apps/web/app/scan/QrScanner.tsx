"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/**
 * Live camera QR scanner. Uses getUserMedia + a canvas frame loop fed into jsQR
 * (works on iOS Safari, unlike the native BarcodeDetector API). Calls onResult
 * once with the decoded text, then stops the camera.
 */
export function QrScanner({ onResult, onClose, labels }: {
  onResult: (text: string) => void;
  onClose: () => void;
  labels: { hint: string; cameraError: string; close: string };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const streamRef = useRef<MediaStream | null>(null);
  const doneRef = useRef(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let active = true;

    const cleanup = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const tick = () => {
      const v = videoRef.current, c = canvasRef.current;
      if (!v || !c || doneRef.current) return;
      if (v.readyState === v.HAVE_ENOUGH_DATA) {
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          c.width = v.videoWidth; c.height = v.videoHeight;
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const img = ctx.getImageData(0, 0, c.width, c.height);
          const found = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (found && found.data) {
            doneRef.current = true;
            cleanup();
            onResult(found.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = s;
        v.setAttribute("playsinline", "true");
        v.muted = true;
        await v.play();
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (active) setErr(true);
      }
    })();

    return () => { active = false; cleanup(); };
  }, [onResult]);

  return (
    <div style={{ marginTop: 14, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", background: "#000", position: "relative" }}>
      {err ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#ff9d80", fontSize: 13 }}>⚠ {labels.cameraError}</div>
      ) : (
        <>
          <video ref={videoRef} style={{ width: "100%", display: "block", aspectRatio: "1 / 1", objectFit: "cover" }} />
          {/* targeting frame */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "62%", aspectRatio: "1 / 1", border: "3px solid rgba(255,216,78,0.9)", borderRadius: 16, boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }} />
          </div>
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, textShadow: "0 1px 4px #000", pointerEvents: "none" }}>{labels.hint}</div>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label={labels.close}>×</button>
    </div>
  );
}
