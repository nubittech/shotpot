import { NextRequest, NextResponse } from "next/server";
import { createClient as createRscClient } from "../../../../../lib/supabase/server-rsc";
import { getServiceClient } from "../../../../../lib/supabase/server";

type RouteContext = {
  params: { slug: string };
};

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const slug = decodeURIComponent(params.slug ?? "").trim();
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const auth = createRscClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const sb = getServiceClient();
    const { data: venue, error: venueErr } = await sb
      .from("venues")
      .select("id, owner_user_id, slug, name")
      .eq("slug", slug)
      .maybeSingle();

    if (venueErr) {
      return NextResponse.json({ error: venueErr.message }, { status: 500 });
    }
    if (!venue) {
      return NextResponse.json({ error: "venue not found" }, { status: 404 });
    }
    if (venue.owner_user_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { error: deleteErr } = await sb
      .from("venues")
      .delete()
      .eq("id", venue.id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
