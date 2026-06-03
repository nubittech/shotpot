import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * POST /api/push/subscribe
 * Body: { slug, subscription: PushSubscriptionJSON }
 *
 * Stores the browser's push subscription for the logged-in customer at this
 * venue. Idempotent by endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      slug?: string;
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    };
    const sub = body.subscription;
    if (!body.slug || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
    }

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
    const { data: venue } = await svc.from("venues").select("id").eq("slug", body.slug).maybeSingle();
    const venueId = (venue as { id: string } | null)?.id ?? null;

    const { data: customer } = await svc
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("venue_id", venueId)
      .maybeSingle();
    const customerId = (customer as { id: string } | null)?.id;
    if (!customerId) return NextResponse.json({ error: "customer not found" }, { status: 403 });

    // Upsert by endpoint (unique). Re-point to this customer if the same
    // browser was previously another member.
    const { error } = await svc.from("push_subscriptions").upsert({
      customer_id: customerId,
      venue_id: venueId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    }, { onConflict: "endpoint" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
