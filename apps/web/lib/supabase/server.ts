import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-only Supabase client. Bypasses RLS via service_role key.
 * NEVER import this from a "use client" file.
 *
 * Untyped: we manually type the rows in lib/supabase/types.ts and
 * cast at the call site when needed. supabase-js v2 generic typing
 * is overly strict for our needs.
 */
export function getServiceClient() {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in env");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
