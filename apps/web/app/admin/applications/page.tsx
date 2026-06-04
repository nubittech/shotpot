import { getServiceClient } from "../../../lib/supabase/server";
import type { DigitalMenuApplication } from "../../../lib/supabase/types";
import { ApplicationCard } from "./ApplicationCard";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const svc = getServiceClient();
  const { data } = await svc
    .from("digital_menu_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const apps = (data ?? []) as DigitalMenuApplication[];

  const counts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>QR Menü Başvuruları ({apps.length})</h1>
      <div style={{ color: "#888", fontSize: 13, marginBottom: 18 }}>
        Yeni: {counts.new ?? 0} · İletişimde: {counts.contacted ?? 0} · Tamamlandı: {counts.done ?? 0} · Reddedildi: {counts.rejected ?? 0}
      </div>

      {apps.length === 0 ? (
        <div style={{ color: "#666", fontSize: 14, padding: 24, textAlign: "center", border: "1px solid #1a1a1a", borderRadius: 8 }}>
          Henüz başvuru yok.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {apps.map((a) => <ApplicationCard key={a.id} app={a} />)}
        </div>
      )}
    </div>
  );
}
