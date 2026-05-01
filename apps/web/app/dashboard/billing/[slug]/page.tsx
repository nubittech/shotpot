import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import { BillingClient } from "./BillingClient";

type Props = { params: { slug: string }; searchParams: { success?: string; cancelled?: string } };

export default async function BillingPage({ params, searchParams }: Props) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const svc = getServiceClient();
  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, plan, tier, stripe_customer_id, stripe_subscription_id, subscription_status, plan_expires_at")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/dashboard");

  const v = venue as {
    id: string; name: string; slug: string;
    plan: string; tier: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: string | null;
    plan_expires_at: string | null;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", fontWeight: 600, textDecoration: "none" }}>‹ Dashboard</Link>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ffd84e" }}>Ödeme & Plan</div>
        <div style={{ fontSize: 13, color: "rgba(244,239,230,0.4)" }}>— {v.name}</div>
      </header>

      {/* Success / cancelled banners */}
      {searchParams.success && (
        <div style={{ background: "rgba(74,222,128,0.1)", borderBottom: "1px solid rgba(74,222,128,0.25)", padding: "14px 24px", textAlign: "center", color: "#4ade80", fontSize: 14, fontWeight: 700 }}>
          ✓ Aboneliğin başarıyla aktifleştirildi! Plan değişikliği birkaç saniye içinde yansır.
        </div>
      )}
      {searchParams.cancelled && (
        <div style={{ background: "rgba(248,113,113,0.08)", borderBottom: "1px solid rgba(248,113,113,0.2)", padding: "14px 24px", textAlign: "center", color: "#f87171", fontSize: 13 }}>
          Ödeme iptal edildi. İstediğin zaman tekrar deneyebilirsin.
        </div>
      )}

      <BillingClient
        venueId={v.id}
        venueName={v.name}
        currentPlan={v.plan ?? ""}
        subscriptionStatus={v.subscription_status}
        planExpiresAt={v.plan_expires_at}
        hasStripeCustomer={!!v.stripe_customer_id}
      />
    </div>
  );
}
