"use client";

import { useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  onCapture: (payload: { previewUrl: string; hash: string; imageData: string }) => void;
  autoStart?: boolean;
};

export function CameraCapture({ onCapture, autoStart = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopStream();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setError("");
    setStarting(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
    } catch {
      setError("Kamera acilamadi. Mobil tarayicida kamera izni vermen gerekiyor.");
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

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;

    const hashBuffer = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const hash = Array.from(new Uint8Array(hashBuffer))
      .slice(0, 12)
      .map((item) => item.toString(16).padStart(2, "0"))
      .join("");

    const previewUrl = URL.createObjectURL(blob);
    const imageData = await blobToDataUrl(blob);
    onCapture({ previewUrl, hash, imageData });
    stopStream();
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  return (
    <div className="camera-shell">
      {!stream && !starting && !error && !autoStart && (
        <>
          <button className="btn btn-primary" onClick={startCamera} type="button">
            Fis Icin Kamerayi Ac
          </button>
          <p className="muted">Bu akista galeri secimi yok. Musteri fişi kameradan cekiyor.</p>
        </>
      )}

      {starting && (
        <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>
          Kamera açılıyor…
        </p>
      )}

      {stream && (
        <>
          <div className="camera-frame">
            <video playsInline ref={videoRef} />
          </div>
          <div className="camera-actions">
            <button className="btn btn-primary" onClick={takePhoto} type="button">
              Fişi Çek
            </button>
            <button className="btn btn-secondary" onClick={stopStream} type="button">
              İptal
            </button>
          </div>
        </>
      )}

      {error && <p className="camera-error">{error}</p>}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read blob as data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}
