"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser client with cookie-based session sync. Use inside "use client" components. */
export function createClient() {
  return createBrowserClient(url, anonKey);
}
