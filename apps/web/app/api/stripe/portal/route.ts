import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getServiceClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.json() as { venueId: string };
  const { venueId } = body;
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });

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
  const { data: venue } = await svc
    .from("venues")
    .select("id, slug, stripe_customer_id")
    .eq("id", venueId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!venue?.stripe_customer_id) {
    return NextResponse.json({ error: "no billing account" }, { status: 404 });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://shotpot-web.vercel.app";

  const session = await stripe.billingPortal.sessions.create({
    customer: venue.stripe_customer_id,
    return_url: `${origin}/dashboard/billing/${venue.slug}`,
  });

  return NextResponse.json({ url: session.url });
}
