import { NextResponse } from "next/server";
import { createClient as createRscClient } from "../supabase/server-rsc";
import { getServiceClient } from "../supabase/server";

export type AdminContext = {
  email: string;
  authUserId: string;
};

/**
 * Gate for /api/admin/* routes. Returns either an `AdminContext` (authorized)
 * or a `NextResponse` to return immediately (unauthorized / forbidden).
 *
 * Security model:
 *   - Caller must be a logged-in Supabase user.
 *   - Caller's email must exist in the `admins` table.
 *   - The check uses the service-role client so RLS can't accidentally hide
 *     the row from us; the admins table itself is server-only.
 */
export async function requireAdminApi(): Promise<AdminContext | NextResponse> {
  const auth = createRscClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = getServiceClient();
  const { data: row } = await svc
    .from("admins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return { email: user.email.toLowerCase(), authUserId: user.id };
}

/** Same check, but for RSC / server pages — returns null when forbidden so
 *  the page can redirect or render a 404 (preferred over a 403 leak). */
export async function requireAdminPage(): Promise<AdminContext | null> {
  const auth = createRscClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user?.email) return null;
  const svc = getServiceClient();
  const { data: row } = await svc
    .from("admins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (!row) return null;
  return { email: user.email.toLowerCase(), authUserId: user.id };
}

/** Append-only audit writer. Best-effort: failures are logged but never
 *  block the privileged action — losing an audit row is worse than failing
 *  the action, but failing the action because audit write hiccups is worse
 *  for ops. */
export async function writeAudit(args: {
  adminEmail: string;
  action: string;
  venueId?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const svc = getServiceClient();
    await svc.from("admin_audit").insert({
      admin_email: args.adminEmail,
      action: args.action,
      venue_id: args.venueId ?? null,
      target_id: args.targetId ?? null,
      payload: args.payload ?? {},
    });
  } catch (e) {
    console.error("[admin audit] write failed", e);
  }
}
