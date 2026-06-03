"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  loyalty_tier: string;
  total_visits: number;
  total_spend: number;
  last_visit_at: string | null;
};

type Filter = "all" | "active" | "risk" | "dormant" | "vip" | "gold";

type Labels = {
  filters: { all: string; active: string; risk: string; dormant: string; vip: string; gold: string };
  table: { fullName: string; email: string; level: string; visits: string; spend: string; lastVisit: string };
  phone: string;
  detail: string;
  empty: string;
  currencySym: string;
  locale: string;
};

const LOYALTY_BADGE: Record<string, string> = { bronze: "🥉", silver: "🥈", gold: "🥇" };

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
}

export function CustomerTable({ slug, customers, labels }: { slug: string; customers: CustomerRow[]; labels: Labels }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c = { all: customers.length, active: 0, risk: 0, dormant: 0, vip: 0, gold: 0 };
    for (const cust of customers) {
      const d = daysSince(cust.last_visit_at);
      if (d !== null && d <= 30) c.active++;
      if (d !== null && d > 30 && d <= 60) c.risk++;
      if (d === null || d > 60) c.dormant++;
      if (cust.loyalty_tier === "silver" || cust.loyalty_tier === "gold") c.vip++;
      if (cust.loyalty_tier === "gold") c.gold++;
    }
    return c;
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((cust) => {
      const d = daysSince(cust.last_visit_at);
      switch (filter) {
        case "active":  return d !== null && d <= 30;
        case "risk":    return d !== null && d > 30 && d <= 60;
        case "dormant": return d === null || d > 60;
        case "vip":     return cust.loyalty_tier === "silver" || cust.loyalty_tier === "gold";
        case "gold":    return cust.loyalty_tier === "gold";
        default:        return true;
      }
    });
  }, [customers, filter]);

  const chips: Array<{ id: Filter; label: string; count: number }> = [
    { id: "all", label: labels.filters.all, count: counts.all },
    { id: "active", label: labels.filters.active, count: counts.active },
    { id: "risk", label: labels.filters.risk, count: counts.risk },
    { id: "dormant", label: labels.filters.dormant, count: counts.dormant },
    { id: "vip", label: labels.filters.vip, count: counts.vip },
    { id: "gold", label: labels.filters.gold, count: counts.gold },
  ];

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {chips.map((ch) => {
          const on = filter === ch.id;
          const danger = ch.id === "risk" || ch.id === "dormant";
          return (
            <button key={ch.id} onClick={() => setFilter(ch.id)} style={{
              padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 700,
              border: `1px solid ${on ? (danger ? "#ff8060" : "#ffd84e") : "rgba(255,255,255,0.1)"}`,
              background: on ? (danger ? "rgba(255,128,96,0.14)" : "rgba(255,216,78,0.14)") : "rgba(255,255,255,0.04)",
              color: on ? (danger ? "#ff8060" : "#ffd84e") : "rgba(244,239,230,0.65)",
            }}>
              {ch.label} <span style={{ opacity: 0.7 }}>{ch.count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "rgba(244,239,230,0.4)", fontSize: 14 }}>
          {labels.empty}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[labels.table.fullName, labels.table.email, labels.phone, labels.table.level, labels.table.visits, labels.table.spend, labels.table.lastVisit, ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(244,239,230,0.4)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const d = daysSince(c.last_visit_at);
                const slipping = d !== null && d > 30;
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={td}>{c.full_name ?? "—"}</td>
                    <td style={{ ...td, color: "rgba(244,239,230,0.55)" }}>{c.email ?? "—"}</td>
                    <td style={{ ...td, color: "rgba(244,239,230,0.55)" }}>{c.phone ?? "—"}</td>
                    <td style={td}>{LOYALTY_BADGE[c.loyalty_tier] ?? "—"}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{c.total_visits}</td>
                    <td style={{ ...td, color: "#ffd84e", fontWeight: 700 }}>
                      {c.total_spend > 0 ? `${labels.currencySym}${c.total_spend.toLocaleString(labels.locale, { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td style={{ ...td, color: slipping ? "#ff8060" : "rgba(244,239,230,0.45)", whiteSpace: "nowrap" }}>
                      {c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString(labels.locale, { day: "numeric", month: "short" }) : "—"}
                    </td>
                    <td style={td}>
                      <Link href={`/dashboard/customers/${slug}/${c.id}`} style={smallLink}>{labels.detail}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const td: React.CSSProperties = { padding: "12px 12px", color: "#f4efe6", verticalAlign: "middle" };
const smallLink: React.CSSProperties = { padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(244,239,230,0.8)", fontSize: 11, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" };
