import Link from "next/link";
import { getServiceClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type VenueRow = {
  id: string; slug: string; name: string; plan: string; tier: string;
  billing_cycle: string; active: boolean | null; stripe_subscription_id: string | null;
  created_at: string;
};

async function loadVenues(): Promise<VenueRow[]> {
  const svc = getServiceClient();
  const { data } = await svc
    .from("venues")
    .select("id, slug, name, plan, tier, billing_cycle, active, stripe_subscription_id, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as VenueRow[];
}

export default async function AdminVenuesPage() {
  const venues = await loadVenues();
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>İşletmeler ({venues.length})</h1>
      <div style={{ overflowX: "auto", border: "1px solid #1f1f1f", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#141414", color: "#888", textAlign: "left" }}>
            <tr>
              <Th>Slug</Th><Th>Ad</Th><Th>Plan</Th><Th>Tier</Th><Th>Cycle</Th>
              <Th>Aktif</Th><Th>Paddle</Th><Th>Oluşturma</Th><Th>{" "}</Th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id} style={{ borderTop: "1px solid #1a1a1a" }}>
                <Td><code style={{ color: "#9ca" }}>{v.slug}</code></Td>
                <Td>{v.name}</Td>
                <Td>{v.plan}</Td>
                <Td>{v.tier}</Td>
                <Td>{v.billing_cycle}</Td>
                <Td>{v.active ? <span style={{ color: "#5eb95e" }}>●</span> : <span style={{ color: "#666" }}>○</span>}</Td>
                <Td style={{ color: v.stripe_subscription_id ? "#5eb95e" : "#666" }}>
                  {v.stripe_subscription_id ? "✓" : "—"}
                </Td>
                <Td style={{ color: "#666", fontSize: 11 }}>
                  {new Date(v.created_at).toLocaleDateString("tr-TR")}
                </Td>
                <Td>
                  <Link href={`/admin/venues/${v.slug}`} style={{ color: "#7bb3ff", textDecoration: "none" }}>
                    Detay →
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = { padding: "10px 12px" };
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ ...cellStyle, fontWeight: 600, fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase" }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ ...cellStyle, ...style }}>{children}</td>;
}
