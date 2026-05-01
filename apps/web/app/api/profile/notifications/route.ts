import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/** GET /api/profile/notifications?customerId=xxx — campaign deliveries for this customer */
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

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
  const { data: customer } = await svc
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!customer) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Fetch deliveries with joined campaign + coupon
  const { data: deliveries } = await svc
    .from("campaign_deliveries")
    .select("id, delivered_at, opened_at, redeemed_at, coupon_id, marketing_campaigns(title, body, reward_label, image_url)")
    .eq("customer_id", customerId)
    .order("delivered_at", { ascending: false })
    .limit(30);

  return NextResponse.json({ notifications: deliveries ?? [] });
}

/** POST /api/profile/notifications — mark as opened */
export async function POST(req: NextRequest) {
  const body = await req.json() as { deliveryId: string };
  if (!body.deliveryId) return NextResponse.json({ error: "deliveryId required" }, { status: 400 });

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

  // Verify ownership through customer
  const { data: delivery } = await svc
    .from("campaign_deliveries")
    .select("id, customer_id, opened_at")
    .eq("id", body.deliveryId)
    .maybeSingle();
  if (!delivery) return NextResponse.json({ error: "not found" }, { status: 404 });

  const d = delivery as { id: string; customer_id: string; opened_at: string | null };

  const { data: customer } = await svc
    .from("customers")
    .select("id")
    .eq("id", d.customer_id)
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!customer) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (!d.opened_at) {
    await svc
      .from("campaign_deliveries")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", body.deliveryId);
    // Note: opened_count on campaign is updated separately by an admin job;
    // skipped here since it would require RPC or a SQL function.
  }

  return NextResponse.json({ ok: true });
}
