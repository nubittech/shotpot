"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders the table QR code for the public menu (/m/{slug}) and offers
 * PNG / SVG download + copy-link. URL is derived from window.location so it
 * works on any deploy domain without extra env config.
 */
export function MenuQR({ slug, copy }: {
  slug: string;
  copy: {
    qrTitle: string; qrDesc: string; qrDownloadPng: string; qrDownloadSvg: string;
    qrCopyLink: string; qrCopied: string; previewMenu: string;
  };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const u = `${window.location.origin}/m/${slug}`;
    setUrl(u);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, u, { width: 220, margin: 1, color: { dark: "#0a0a0c", light: "#ffffff" } }).catch(() => {});
    }
  }, [slug]);

  const downloadPng = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `menu-qr-${slug}.png`;
    a.click();
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0a0a0c", light: "#ffffff" } });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `menu-qr-${slug}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", padding: "20px 24px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
      <div style={{ background: "#fff", padding: 10, borderRadius: 12, lineHeight: 0 }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>{copy.qrTitle}</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(244,239,230,0.5)", lineHeight: 1.5 }}>{copy.qrDesc}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={downloadPng} style={btnPrimary}>{copy.qrDownloadPng}</button>
          <button onClick={downloadSvg} style={btnGhost}>{copy.qrDownloadSvg}</button>
          <button onClick={copyLink} style={btnGhost}>{copied ? copy.qrCopied : copy.qrCopyLink}</button>
          {url && <a href={url} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>{copy.previewMenu}</a>}
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding: "8px 14px", borderRadius: 9, background: "#ffd84e", color: "#0a0a0c", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", borderRadius: 9, background: "rgba(255,255,255,0.05)", color: "rgba(244,239,230,0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 600, cursor: "pointer" };
