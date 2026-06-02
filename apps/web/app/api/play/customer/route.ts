import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * POST /api/play/customer
 * Creates or returns the CustomerPro record for the currently logged-in user
 * at a given venue. Called by PlayClient after magic-link auth.
 *
 * Body: { slug: string; full_name?: string; consent_marketing?: boolean; consent_kvkk?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      slug: string;
      full_name?: string;
      birth_date?: string | null;
      consent_marketing?: boolean;
      consent_kvkk?: boolean;
    };
    const { slug } = body;
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    // Validate session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(list) {
            list.forEach(({ name, value, options }) => { cookieStore.set(name, value, options); });
          },
        },
      }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const svc = getServiceClient();

    // Fetch venue
    const { data: venue } = await svc
      .from("venues")
      .select("id, name, tier")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (!venue) return NextResponse.json({ error: "venue not found" }, { status: 404 });
    if ((venue as { tier: string }).tier !== "pro") {
      return NextResponse.json({ error: "venue is not pro tier" }, { status: 400 });
    }

    const venueId = (venue as { id: string }).id;

    // Upsert customer — if exists return it, else create
    const { data: existing } = await svc
      .from("customers")
      .select("*")
      .eq("venue_id", venueId)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Update last_visit_at and optionally name/consent
      const updates: Record<string, unknown> = { last_visit_at: new Date().toISOString() };
      if (body.full_name) updates.full_name = body.full_name;
      if (body.birth_date !== undefined) updates.birth_date = body.birth_date || null;
      if (body.consent_marketing !== undefined) updates.consent_marketing = body.consent_marketing;
      if (body.consent_kvkk !== undefined) updates.consent_kvkk = body.consent_kvkk;

      const { data: updated } = await svc
        .from("customers")
        .update(updates)
        .eq("id", (existing as { id: string }).id)
        .select("*")
        .single();

      return NextResponse.json({ customer: updated ?? existing, isNew: false });
    }

    // Create new customer
    const { data: created, error: insErr } = await svc
      .from("customers")
      .insert({
        venue_id: venueId,
        auth_user_id: user.id,
        email: user.email ?? null,
        full_name: body.full_name ?? null,
        consent_marketing: body.consent_marketing ?? false,
        consent_kvkk: body.consent_kvkk ?? false,
        last_visit_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insErr || !created) {
      return NextResponse.json({ error: insErr?.message ?? "insert failed" }, { status: 500 });
    }

    return NextResponse.json({ customer: created, isNew: true }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
