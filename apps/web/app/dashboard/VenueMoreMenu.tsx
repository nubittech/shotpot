"use client";

import { useState } from "react";

/**
 * Overflow menu for secondary venue actions. Keeps the card's primary actions
 * inline and tucks the rest behind a "•••" toggle to avoid the 10-button
 * clutter on Pro venues.
 */
export function VenueMoreMenu({ children, label }: { children: React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 12px", borderRadius: 999, cursor: "pointer",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,200,118,0.18)",
          color: "#c8b890", fontSize: 13, fontWeight: 600,
        }}
      >
        ••• {label}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
              minWidth: 190, padding: 8, borderRadius: 14,
              background: "#140d08", border: "1px solid rgba(232,200,118,0.2)",
              boxShadow: "0 16px 40px -12px rgba(0,0,0,0.8)",
              display: "flex", flexDirection: "column", gap: 6,
            }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
