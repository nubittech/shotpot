import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, writeAudit } from "../../../../../lib/auth/admin";
import { getServiceClient } from "../../../../../lib/supabase/server";

/**
 * PATCH /api/admin/qr-menu/applications
 *   { id, status?, adminNote? }
 * Admin-only: update a QR menu application's status / note.
 */
export async function PATCH(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;

  const body = (await req.json()) as { id?: string; status?: string; adminNote?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const allowed = ["new", "contacted", "done", "rejected"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) {
    if (!allowed.includes(body.status)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
    update.status = body.status;
  }
  if (body.adminNote !== undefined) update.admin_note = body.adminNote || null;

  const svc = getServiceClient();
  const { error } = await svc.from("digital_menu_applications").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit({
    adminEmail: gate.email,
    action: "qr_menu_application_update",
    venueId: null,
    payload: { applicationId: body.id, ...update },
  });

  return NextResponse.json({ ok: true });
}
