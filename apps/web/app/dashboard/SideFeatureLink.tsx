"use client";

import { useState } from "react";
import Link from "next/link";

type Venue = { slug: string; name: string };

/**
 * Sidebar link for a venue-scoped feature (Staff / Gift / Menu).
 * - 0 eligible venues → hidden
 * - 1 venue → direct link
 * - 2+ venues → opens a picker, then routes to the chosen venue's page
 *
 * `hrefTemplate` uses `{slug}` as the placeholder, e.g. "/dashboard/gifts/{slug}".
 */
export function SideFeatureLink({ venues, hrefTemplate, label, icon, pickTitle }: {
  venues: Venue[];
  hrefTemplate: string;
  label: string;
  icon: React.ReactNode;
  pickTitle: string;
}) {
  const [open, setOpen] = useState(false);
  if (venues.length === 0) return null;

  const href = (slug: string) => hrefTemplate.replace("{slug}", slug);
  const external = hrefTemplate.startsWith("/scan");

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 10, textDecoration: "none",
    fontSize: 14, fontWeight: 500, marginBottom: 2,
    color: "#c8b890", background: "transparent",
    borderLeft: "2px solid transparent", width: "100%",
    border: "none", cursor: "pointer", textAlign: "left",
  };

  if (venues.length === 1) {
    return (
      <Link className="side-link" href={href(venues[0].slug)} target={external ? "_blank" : undefined} style={rowStyle}>
        {icon}{label}
      </Link>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="side-link" onClick={() => setOpen((o) => !o)} style={rowStyle}>
        {icon}{label}
        <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{
            position: "relative", zIndex: 50, margin: "2px 0 6px 12px",
            display: "flex", flexDirection: "column", gap: 2,
            borderLeft: "1px solid rgba(232,200,118,0.15)", paddingLeft: 8,
          }}>
            <div style={{ fontSize: 10, color: "#5a4f3a", textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 8px" }}>{pickTitle}</div>
            {venues.map((v) => (
              <Link key={v.slug} href={href(v.slug)} target={external ? "_blank" : undefined}
                onClick={() => setOpen(false)}
                style={{ ...rowStyle, padding: "8px 10px", fontSize: 13 }}>
                {v.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
