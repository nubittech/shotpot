import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getServiceClient } from "../../../../lib/supabase/server";
import { stripe, PRICE_IDS, PlanKey } from "../../../../lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.json() as { venueId: string; plan: PlanKey };
  const { venueId, plan } = body;

  if (!venueId || !plan || !(plan in PRICE_IDS)) {
    return NextResponse.json({ error: "venueId and plan required" }, { status: 400 });
  }

  // Auth check
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
    .select("id, name, slug, stripe_customer_id")
    .eq("id", venueId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!venue) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Get or create Stripe customer
  let stripeCustomerId: string = venue.stripe_customer_id ?? "";
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: venue.name,
      metadata: { venue_id: venueId, user_id: user.id },
    });
    stripeCustomerId = customer.id;
    await svc.from("venues").update({ stripe_customer_id: stripeCustomerId }).eq("id", venueId);
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://shotpot-web.vercel.app";

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    subscription_data: {
      metadata: { venue_id: venueId, plan },
    },
    success_url: `${origin}/dashboard/billing/${venue.slug}?success=1`,
    cancel_url:  `${origin}/dashboard/billing/${venue.slug}?cancelled=1`,
    allow_promotion_codes: true,
    locale: "tr",
  });

  return NextResponse.json({ url: session.url });
}
