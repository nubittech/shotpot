"use client";

import { useState } from "react";
import Link from "next/link";

type Venue = { slug: string; name: string };

/**
 * Prominent dashboard banner that takes the owner to the QR menu management
 * panel (the digital-menu builder). Shown only for venues with the add-on
 * enabled. 1 venue → direct link; 2+ → picker.
 */
export function QrMenuBanner({ venues, title, desc, cta, pickTitle }: {
  venues: Venue[];
  title: string;
  desc: string;
  cta: string;
  pickTitle: string;
}) {
  const [open, setOpen] = useState(false);
  if (venues.length === 0) return null;
  const href = (slug: string) => `/dashboard/digital-menu/${slug}`;
  const single = venues.length === 1;

  return (
    <div className="qrmenu-banner" style={{
      position: "relative",
      display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
      padding: "18px 22px", marginBottom: 28, borderRadius: 16,
      background: "linear-gradient(135deg, rgba(232,200,118,0.14) 0%, rgba(200,154,74,0.06) 60%, rgba(0,0,0,0) 100%)",
      border: "1px solid rgba(232,200,118,0.28)",
      boxShadow: "0 10px 30px -16px rgba(232,200,118,0.4)",
    }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(232,200,118,0.16)", border: "1px solid rgba(232,200,118,0.3)", color: "#e8c876", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6"/><rect x="10.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6"/><rect x="2.5" y="10.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6"/><path d="M10.5 10.5h2v2M15.5 10.5v5M12.5 15.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff8e8" }}>{title}</div>
        <div style={{ fontSize: 13, color: "rgba(244,239,230,0.6)", marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
      </div>

      {single ? (
        <Link href={href(venues[0].slug)} className="qrmenu-banner-cta" style={ctaStyle}>{cta} →</Link>
      ) : (
        <div style={{ position: "relative" }}>
          <button onClick={() => setOpen((o) => !o)} className="qrmenu-banner-cta" style={{ ...ctaStyle, border: "none", cursor: "pointer" }}>{cta} ▾</button>
          {open && (
            <>
              <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, minWidth: 200, background: "#15100a", border: "1px solid rgba(232,200,118,0.25)", borderRadius: 12, padding: 6, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.7)" }}>
                <div style={{ fontSize: 10, color: "#8b7d5e", textTransform: "uppercase", letterSpacing: "0.12em", padding: "6px 10px" }}>{pickTitle}</div>
                {venues.map((v) => (
                  <Link key={v.slug} href={href(v.slug)} onClick={() => setOpen(false)} style={{ display: "block", padding: "9px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#f0e0c0", textDecoration: "none" }}>{v.name}</Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .qrmenu-banner-cta{transition:transform .15s ease, filter .15s ease;}
        .qrmenu-banner-cta:hover{transform:translateX(3px);filter:brightness(1.06);}
      `}</style>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
  padding: "11px 20px", borderRadius: 999, textDecoration: "none",
  background: "linear-gradient(160deg,#f0d690 0%,#c89a4a 50%,#8b6a30 100%)",
  color: "#1a0f06", fontWeight: 800, fontSize: 14,
  boxShadow: "inset 0 1px 0 rgba(255,244,212,0.6), 0 8px 20px -8px rgba(232,200,118,0.5)",
};
