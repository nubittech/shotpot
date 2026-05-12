import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../lib/supabase/server";
import { BillingClient } from "./BillingClient";
import { PADDLE_CLIENT_TOKEN, PADDLE_ENVIRONMENT, PADDLE_PRICE_IDS, PADDLE_PRICE_IDS_ANNUAL } from "../../../../lib/paddle";
import { getServerCopy } from "../../../../lib/i18n/server";

type Props = {
  params: { slug: string };
  searchParams: {
    success?: string;
    cancelled?: string;
    checkout?: string;
    plan?: string;
    period?: string;
  };
};

export default async function BillingPage({ params, searchParams }: Props) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const copyText = getServerCopy();
  const billing = copyText.billing;

  const svc = getServiceClient();
  const { data: venue } = await svc
    .from("venues")
    .select("id, name, slug, plan, tier, active")
    .eq("slug", params.slug)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/dashboard");

  const v = venue as {
    id: string; name: string; slug: string;
    plan: string | null; tier: string; active: boolean | null;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", fontWeight: 600, textDecoration: "none" }}>{billing.backDashboard}</Link>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ffd84e" }}>{billing.title}</div>
        <div style={{ fontSize: 13, color: "rgba(244,239,230,0.4)" }}>— {v.name}</div>
      </header>

      {searchParams.success && (
        <div style={{ background: "rgba(74,222,128,0.1)", borderBottom: "1px solid rgba(74,222,128,0.25)", padding: "14px 24px", textAlign: "center", color: "#4ade80", fontSize: 14, fontWeight: 700 }}>
          {billing.success}
        </div>
      )}
      {searchParams.cancelled && (
        <div style={{ background: "rgba(248,113,113,0.08)", borderBottom: "1px solid rgba(248,113,113,0.2)", padding: "14px 24px", textAlign: "center", color: "#f87171", fontSize: 13 }}>
          {billing.cancelled}
        </div>
      )}

      <BillingClient
        venueId={v.id}
        venueName={v.name}
        userEmail={user.email ?? ""}
        currentPlan={v.plan ?? ""}
        subscriptionStatus={v.active ? "active" : null}
        planExpiresAt={null}
        hasPaddleCustomer={false}
        paddleSubscriptionId={null}
        paddleClientToken={PADDLE_CLIENT_TOKEN}
        paddleEnvironment={PADDLE_ENVIRONMENT}
        priceKampanya={PADDLE_PRICE_IDS.kampanya}
        pricePro={PADDLE_PRICE_IDS.pro}
        priceKampanyaAnnual={PADDLE_PRICE_IDS_ANNUAL.kampanya}
        priceProAnnual={PADDLE_PRICE_IDS_ANNUAL.pro}
        autoCheckout={searchParams.checkout === "1"}
        initialPlan={searchParams.plan === "pro" ? "pro" : searchParams.plan === "kampanya" ? "kampanya" : null}
        initialPeriod={searchParams.period === "annual" ? "annual" : searchParams.period === "monthly" ? "monthly" : null}
      />
    </div>
  );
}
