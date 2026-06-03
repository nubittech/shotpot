import webpush from "web-push";
import type { getServiceClient } from "./supabase/server";

/**
 * Web push sender. Gracefully no-ops if VAPID env vars aren't configured, so
 * the app never breaks before keys are set in the environment.
 *
 * Env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (also read client-side to subscribe)
 *   VAPID_PRIVATE_KEY             (server only)
 *   VAPID_SUBJECT                 (mailto: or https URL; optional)
 */
let configured: boolean | null = null;
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) { configured = false; return false; }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@nubit.tech", pub, priv);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
};

type Svc = ReturnType<typeof getServiceClient>;

/** Send a push to every subscription belonging to the given customers.
 *  Expired subscriptions (404/410) are pruned. Best-effort; never throws. */
export async function sendPushToCustomers(
  svc: Svc,
  customerIds: string[],
  payload: PushPayload,
): Promise<{ sent: number }> {
  if (!ensureConfigured() || customerIds.length === 0) return { sent: 0 };

  const { data: subs } = await svc
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("customer_id", customerIds);

  const rows = (subs ?? []) as Array<{ id: string; endpoint: string; p256dh: string; auth: string }>;
  let sent = 0;
  await Promise.all(rows.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (e: unknown) {
      const code = (e as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) {
        // Subscription is dead — remove it.
        await svc.from("push_subscriptions").delete().eq("id", s.id);
      }
    }
  }));
  return { sent };
}
