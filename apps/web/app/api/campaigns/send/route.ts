import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

type SendBody = {
  slug: string;
  title: string;
  body: string;
  reward_label?: string | null;
  audience: "all" | "active30" | "dormant30" | "loyalty_silver" | "loyalty_gold" | "consented";
};

/**
 * POST /api/campaigns/send
 * Creates a marketing_campaigns row + per-customer campaign_deliveries
 * for the audience filter. Optionally generates a free coupon per customer
 * (when reward_label is provided).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SendBody;
    if (!body.slug || !body.title || !body.body) {
      return NextResponse.json({ error: "slug, title, body required" }, { status: 400 });
    }

    // Auth
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(list) { list.forEach(({ name, value, options }) => { cookieStore.set(name, value, options); }); },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const svc = getServiceClient();

    // Verify ownership
    const { data: venue } = await svc
      .from("venues")
      .select("id, name, tier")
      .eq("slug", body.slug)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!venue) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const v = venue as { id: string; name: string; tier: string };
    if (v.tier !== "pro") {
      return NextResponse.json({ error: "Pro tier gereklidir" }, { status: 400 });
    }

    // Build audience query
    let q = svc.from("customers").select("id, email").eq("venue_id", v.id).is("deleted_at", null);
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();

    switch (body.audience) {
      case "active30":      q = q.gte("last_visit_at", d30); break;
      case "dormant30":     q = q.lt("last_visit_at", d30); break;
      case "loyalty_silver": q = q.in("loyalty_tier", ["silver", "gold"]); break;
      case "loyalty_gold":  q = q.eq("loyalty_tier", "gold"); break;
      case "consented":     q = q.eq("consent_marketing", true); break;
      // "all" → no extra filter
    }

    const { data: targets } = await q;
    const targetList = (targets ?? []) as Array<{ id: string; email: string | null }>;

    if (targetList.length === 0) {
      return NextResponse.json({ error: "Bu kitlede müşteri yok" }, { status: 400 });
    }

    // Create campaign
    const { data: camp, error: cErr } = await svc.from("marketing_campaigns").insert({
      venue_id: v.id,
      title: body.title,
      body: body.body,
      reward_label: body.reward_label ?? null,
      audience_filter: { type: body.audience },
      sent_at: new Date().toISOString(),
      sent_count: targetList.length,
      created_by: user.id,
    }).select("id").single();

    if (cErr || !camp) {
      return NextResponse.json({ error: cErr?.message ?? "campaign insert failed" }, { status: 500 });
    }

    const campaignId = (camp as { id: string }).id;

    // For each target: create delivery row + optional gift coupon
    const deliveries: Array<{ campaign_id: string; customer_id: string; coupon_id?: string }> = [];
    const gifts: Array<{ venue_id: string; customer_id: string; reward_label: string; code: string; spin_id: null }> = [];

    for (const t of targetList) {
      let couponId: string | undefined;

      if (body.reward_label) {
        const code = `GIFT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const { data: cp } = await svc.from("coupons").insert({
          venue_id: v.id,
          customer_id: t.id,
          reward_label: body.reward_label,
          code,
          spin_id: null,
        }).select("id").single();
        if (cp) couponId = (cp as { id: string }).id;
      }

      deliveries.push({ campaign_id: campaignId, customer_id: t.id, ...(couponId ? { coupon_id: couponId } : {}) });
    }

    // Bulk insert deliveries
    if (deliveries.length > 0) {
      await svc.from("campaign_deliveries").insert(deliveries);
    }

    return NextResponse.json({
      ok: true,
      campaignId,
      sentCount: targetList.length,
      withCoupons: !!body.reward_label,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
