"use client";

import { useState } from "react";

type Cust = {
  id: string; venue_id: string;
  full_name: string | null; phone: string | null; email: string | null;
  loyalty_tier: string; total_visits: number; total_spend: number;
  last_visit_at: string | null; created_at: string;
  // Joined venue info so the admin can see scope at a glance.
  venue: { slug: string; name: string } | null;
};

export default function CustomerSearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Cust[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(q.trim())}`);
      const d = await r.json();
      setResults(d.customers ?? []);
      setSearched(true);
    } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Müşteri Arama</h1>
      <p style={{ color: "#888", fontSize: 12, marginBottom: 14 }}>
        Müşteriler venue başına ayrı tutulur — aynı email birden fazla işletmede ayrı satır olarak görünür.
      </p>
      <form onSubmit={search} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="ad, telefon veya email"
          style={{
            padding: "10px 14px", background: "#0f0f0f", border: "1px solid #2a2a2a",
            borderRadius: 6, color: "#fff", fontSize: 14, width: 360,
          }}/>
        <button type="submit" disabled={busy || q.trim().length < 2} style={{
          padding: "10px 18px", background: "#3a5b9e", border: "none",
          borderRadius: 6, color: "#fff", fontWeight: 600, cursor: "pointer",
        }}>{busy ? "..." : "Ara"}</button>
      </form>

      {searched && results.length === 0 && (
        <div style={{ color: "#888", fontSize: 13 }}>Sonuç yok.</div>
      )}

      {results.length > 0 && (
        <div style={{ border: "1px solid #1f1f1f", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#141414", color: "#888", textAlign: "left" }}>
              <tr>
                <Th>İşletme</Th>
                <Th>Ad</Th><Th>Telefon</Th><Th>Email</Th><Th>Tier</Th>
                <Th>Ziyaret</Th><Th>Harcama</Th><Th>Son ziyaret</Th>
              </tr>
            </thead>
            <tbody>
              {results.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid #1a1a1a" }}>
                  <Td>
                    {c.venue ? (
                      <a href={`/admin/venues/${c.venue.slug}`} style={{ color: "#7bb3ff", textDecoration: "none" }}>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{c.venue.name}</div>
                        <div style={{ fontSize: 11, color: "#7bb3ff" }}>{c.venue.slug}</div>
                      </a>
                    ) : <span style={{ color: "#666" }}>—</span>}
                  </Td>
                  <Td>{c.full_name ?? "—"}</Td>
                  <Td>{c.phone ?? "—"}</Td>
                  <Td>{c.email ?? "—"}</Td>
                  <Td>{c.loyalty_tier}</Td>
                  <Td>{c.total_visits}</Td>
                  <Td>{c.total_spend}</Td>
                  <Td style={{ color: "#888", fontSize: 11 }}>
                    {c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString("tr-TR") : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "8px 12px", fontWeight: 600, fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase" }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "8px 12px", ...style }}>{children}</td>;
}
