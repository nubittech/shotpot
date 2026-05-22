import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, writeAudit } from "../../../../../lib/auth/admin";
import { getServiceClient } from "../../../../../lib/supabase/server";
import { randomUUID, createHash } from "node:crypto";

type Body = {
  slug: string;
  /** Either provide customerId (preferred) or a guestToken to attach the
   *  synthetic receipt to a player session. */
  customerId?: string;
  guestToken?: string;
  tokens: number;          // how many tokens to grant
  amount?: number;         // optional cosmetic amount (defaults to 0)
  note?: string;
};

/**
 * POST /api/admin/venues/grant-tokens
 *
 * Creates a synthetic receipt row to credit the player with `tokens` spins
 * without an OCR scan. Marked `is_synthetic = true` so it stays out of real
 * analytics. Audited.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const body = (await req.json()) as Body;
  if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  if (!body.customerId && !body.guestToken) {
    return NextResponse.json({ error: "customerId or guestToken required" }, { status: 400 });
  }
  if (!Number.isFinite(body.tokens) || body.tokens <= 0 || body.tokens > 1000) {
    return NextResponse.json({ error: "tokens must be 1..1000" }, { status: 400 });
  }

  const svc = getServiceClient();
  const { data: venue } = await svc
    .from("venues")
    .select("id")
    .eq("slug", body.slug)
    .maybeSingle();
  if (!venue) return NextResponse.json({ error: "venue not found" }, { status: 404 });
  const venueId = (venue as { id: string }).id;

  // Synthetic receipt — unique fingerprint to keep dedupe constraint happy.
  const fingerprint = createHash("sha256")
    .update(`admin:${randomUUID()}:${Date.now()}`)
    .digest("hex");

  const { data: receipt, error: recErr } = await svc
    .from("receipts")
    .insert({
      venue_id: venueId,
      customer_id: body.customerId ?? null,
      guest_token: body.guestToken ?? null,
      amount: body.amount ?? 0,
      tokens_awarded: Math.floor(body.tokens),
      issued_at: new Date().toISOString(),
      fingerprint,
      ocr_status: "admin_grant",
      ocr_summary: body.note ?? "Admin token grant",
      valid: true,
      is_synthetic: true,
      granted_by_admin: gate.email,
    })
    .select("id")
    .single();

  if (recErr || !receipt) {
    return NextResponse.json({ error: recErr?.message ?? "insert failed" }, { status: 500 });
  }

  await writeAudit({
    adminEmail: gate.email,
    action: "grant_tokens",
    venueId,
    targetId: (receipt as { id: string }).id,
    payload: {
      tokens: Math.floor(body.tokens),
      customerId: body.customerId ?? null,
      guestToken: body.guestToken ?? null,
      note: body.note ?? null,
    },
  });

  return NextResponse.json({ ok: true, receiptId: (receipt as { id: string }).id });
}
