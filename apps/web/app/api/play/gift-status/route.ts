import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * POST /api/play/gift-status  { slug }
 *
 * Returns how many gift-wheel spins the logged-in customer can use at this
 * venue. Lazily creates the day's "daily gift" row when the venue has the
 * daily gift enabled — no cron required.
 *
 * Response: { pending: number }
 */

/** YYYY-MM-DD in the given IANA timezone */
function todayInTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

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
    if (!user) return NextResponse.json({ pending: 0 });

    const svc = getServiceClient();

    const { data: venue } = await svc
      .from("venues")
      .select("id, timezone, gift_daily_enabled, tier")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    const v = venue as { id: string; timezone: string | null; gift_daily_enabled: boolean | null; tier: string } | null;
    if (!v || v.tier !== "pro") return NextResponse.json({ pending: 0 });

    const { data: customer } = await svc
      .from("customers")
      .select("id")
      .eq("venue_id", v.id)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const c = customer as { id: string } | null;
    if (!c) return NextResponse.json({ pending: 0 });

    // Lazily create the daily gift row
    if (v.gift_daily_enabled) {
      const giftDate = todayInTz(v.timezone ?? "Europe/Istanbul");
      const { data: existingDaily } = await svc
        .from("gift_spins")
        .select("id")
        .eq("customer_id", c.id)
        .eq("source", "daily")
        .eq("gift_date", giftDate)
        .maybeSingle();
      if (!existingDaily) {
        // unique index makes a concurrent double-insert harmless
        await svc.from("gift_spins").insert({
          venue_id: v.id,
          customer_id: c.id,
          source: "daily",
          status: "pending",
          gift_date: giftDate,
        });
      }
    }

    const { count } = await svc
      .from("gift_spins")
      .select("*", { count: "exact", head: true })
      .eq("venue_id", v.id)
      .eq("customer_id", c.id)
      .eq("status", "pending");

    return NextResponse.json({ pending: count ?? 0 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e), pending: 0 }, { status: 500 });
  }
}
