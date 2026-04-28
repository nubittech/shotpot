import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/** GET /api/profile/coupons?customerId=xxx — returns coupons for a customer */
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

  // Verify session
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

  // Verify this customer belongs to this user
  const { data: customer } = await svc
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: coupons } = await svc
    .from("coupons")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ coupons: coupons ?? [] });
}
