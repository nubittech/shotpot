import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../../lib/supabase/server";

/**
 * POST /api/play/balance  { slug, guestToken?, customerId? }
 *
 * Returns the customer's / guest's CURRENT available spin tokens, computed from
 * the database (source of truth) — not from client state. This lets the play UI
 * re-hydrate the token balance after a page reload, language change, or any
 * remount, instead of showing 0 and "losing" earned tokens.
 *
 * tokens   = sum over recent valid receipts of (tokens_awarded - spins used)
 * receiptId = the most recent receipt that still has remaining spins (the one
 *             the next pull should consume), or null.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string; guestToken?: string; customerId?: string };
    if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const sb = getServiceClient();

    const { data: venue } = await sb
      .from("venues").select("id").eq("slug", body.slug).eq("active", true).maybeSingle();
    const v = venue as { id: string } | null;
    if (!v) return NextResponse.json({ tokens: 0, receiptId: null });

    const customerId = body.customerId ?? null;
    const guestToken = body.guestToken ?? null;
    if (!customerId && !guestToken) return NextResponse.json({ tokens: 0, receiptId: null });

    let q = sb
      .from("receipts")
      .select("id, tokens_awarded, created_at")
      .eq("venue_id", v.id)
      .eq("valid", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (customerId) q = q.eq("customer_id", customerId);
    else q = q.eq("guest_token", guestToken);

    const { data: receipts } = await q;
    const list = (receipts ?? []) as Array<{ id: string; tokens_awarded: number; created_at: string }>;

    let total = 0;
    let activeReceiptId: string | null = null;
    for (const r of list) {
      const { count } = await sb
        .from("spins").select("*", { count: "exact", head: true }).eq("receipt_id", r.id);
      const remaining = Math.max(0, Number(r.tokens_awarded || 0) - (count ?? 0));
      if (remaining > 0) {
        total += remaining;
        // list is newest-first, so the first one with remaining is the active receipt
        if (!activeReceiptId) activeReceiptId = r.id;
      }
    }

    return NextResponse.json({ tokens: total, receiptId: activeReceiptId });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
