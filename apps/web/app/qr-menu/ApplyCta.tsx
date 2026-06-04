"use client";

import { useState } from "react";
import { getClientCopy } from "../../lib/i18n/client";
import { ApplyForm } from "./ApplyForm";

/** A CTA button that opens the application form in a modal. Used for every
 *  "Başvur / Apply" call-to-action across the QR-menu landing page. */
export function ApplyCta({ label, variant = "gold", block = false }: {
  label?: string;
  variant?: "gold" | "ghost" | "small";
  block?: boolean;
}) {
  const copy = getClientCopy().qrMenuApply;
  const [open, setOpen] = useState(false);
  const text = label ?? copy.ctaApply;

  const style =
    variant === "gold" ? goldBtn :
    variant === "ghost" ? ghostBtn : smallBtn;

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...style, ...(block ? { width: "100%", justifyContent: "center" } : {}) }}>
        {text}{variant === "gold" ? " →" : ""}
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "#141210", border: "1px solid rgba(232,200,118,0.25)", borderRadius: 20, padding: 26, position: "relative" }}>
            <button onClick={() => setOpen(false)} aria-label="Kapat" style={{ position: "absolute", top: 14, right: 16, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#f4efe6", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#fff8e8" }}>{copy.formTitle}</h2>
            <p style={{ fontSize: 13.5, color: "rgba(244,239,230,0.5)", margin: "0 0 4px", lineHeight: 1.5 }}>{copy.formDesc}</p>
            <p style={{ fontSize: 12.5, color: "#e8c876", margin: "0 0 16px" }}>{copy.priceNote}</p>
            <ApplyForm copy={copy} />
          </div>
        </div>
      )}
    </>
  );
}

const goldBtn: React.CSSProperties = {
  background: "linear-gradient(160deg,#ffe9a8 0%,#e8c876 45%,#c89a4a 100%)",
  color: "#1a0f06", padding: "14px 26px", borderRadius: 11, fontSize: 15, fontWeight: 800,
  border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
  boxShadow: "0 8px 22px -8px rgba(232,200,118,0.55)",
};
const ghostBtn: React.CSSProperties = {
  background: "transparent", color: "#c8b890", border: "1px solid rgba(232,200,118,0.28)",
  padding: "14px 24px", borderRadius: 11, fontSize: 15, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const smallBtn: React.CSSProperties = {
  background: "linear-gradient(160deg,#ffe9a8 0%,#e8c876 45%,#c89a4a 100%)",
  color: "#1a0f06", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 800,
  border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
};
