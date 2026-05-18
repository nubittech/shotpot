import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { CustomerMenu, CustomerMenuItem } from "../../../../lib/supabase/types";

/**
 * POST /api/play/menus  { slug }
 *
 * Returns the personalized campaign menus visible to the logged-in customer
 * at this venue — filtered by the customer's segment and the menu's validity
 * window.
 *
 * Response: { menus: Array<{ ...menu, items: [...] }> }
 */
export async function POST(req: NextRequest) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

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
    if (!user) return NextResponse.json({ menus: [] });

    const svc = getServiceClient();

    const { data: venue } = await svc
      .from("venues")
      .select("id, tier")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    const v = venue as { id: string; tier: string } | null;
    if (!v || v.tier !== "pro") return NextResponse.json({ menus: [] });

    const { data: customer } = await svc
      .from("customers")
      .select("last_visit_at, loyalty_tier, consent_marketing")
      .eq("venue_id", v.id)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const c = customer as {
      last_visit_at: string | null;
      loyalty_tier: string | null;
      consent_marketing: boolean | null;
    } | null;
    if (!c) return NextResponse.json({ menus: [] });

    // Which audience buckets does this customer belong to?
    const eligible = new Set<string>(["all"]);
    const d30 = Date.now() - 30 * 86400_000;
    const lastVisit = c.last_visit_at ? new Date(c.last_visit_at).getTime() : 0;
    if (lastVisit >= d30) eligible.add("active30");
    else eligible.add("dormant30");
    // Higher tiers inherit lower-tier audiences: gold sees silver-targeted menus too.
    if (c.loyalty_tier === "gold") { eligible.add("loyalty_gold"); eligible.add("loyalty_silver"); }
    if (c.loyalty_tier === "silver") eligible.add("loyalty_silver");
    if (c.consent_marketing) eligible.add("consented");

    // Active, in-date menus for this venue
    const today = new Date().toISOString().slice(0, 10);
    const { data: menusRaw } = await svc
      .from("customer_menus")
      .select("*")
      .eq("venue_id", v.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    const menus = ((menusRaw ?? []) as CustomerMenu[]).filter((m) => {
      if (!eligible.has(m.audience)) return false;
      if (m.valid_from && m.valid_from > today) return false;
      if (m.valid_to && m.valid_to < today) return false;
      return true;
    });

    if (menus.length === 0) return NextResponse.json({ menus: [] });

    const { data: itemsRaw } = await svc
      .from("customer_menu_items")
      .select("*")
      .in("menu_id", menus.map((m) => m.id))
      .order("sort_order", { ascending: true });
    const items = (itemsRaw ?? []) as CustomerMenuItem[];

    const result = menus.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      validTo: m.valid_to,
      items: items
        .filter((it) => it.menu_id === m.id)
        .map((it) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          oldPrice: it.old_price,
          newPrice: it.new_price,
        })),
    }));

    return NextResponse.json({ menus: result });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e), menus: [] }, { status: 500 });
  }
}
