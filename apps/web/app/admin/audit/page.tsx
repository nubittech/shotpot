import { getServiceClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string; admin_email: string; action: string;
  venue_id: string | null; target_id: string | null;
  payload: Record<string, unknown>; created_at: string;
};

async function loadAudit(): Promise<Row[]> {
  const svc = getServiceClient();
  const { data } = await svc
    .from("admin_audit")
    .select("id, admin_email, action, venue_id, target_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as Row[];
}

export default async function AuditPage() {
  const rows = await loadAudit();
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Admin Audit ({rows.length})</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 18 }}>Son 200 yetki eylemi.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r) => (
          <details key={r.id} style={{
            padding: "10px 14px", background: "#0f0f0f", border: "1px solid #1a1a1a",
            borderRadius: 6, fontSize: 12,
          }}>
            <summary style={{ cursor: "pointer", color: "#bbb" }}>
              <span style={{ color: "#fff", fontWeight: 600 }}>{r.action}</span>
              <span style={{ color: "#888" }}> · {r.admin_email}</span>
              <span style={{ color: "#666" }}> · {new Date(r.created_at).toLocaleString("tr-TR")}</span>
              {r.venue_id && <span style={{ color: "#7bb3ff" }}> · venue {r.venue_id.slice(0, 8)}</span>}
            </summary>
            <pre style={{ color: "#888", margin: "8px 0 0", fontSize: 11, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(r.payload, null, 2)}
            </pre>
          </details>
        ))}
        {rows.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>Henüz audit kaydı yok.</div>}
      </div>
    </div>
  );
}
