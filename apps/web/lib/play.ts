import { getServiceClient } from "./supabase/server";
import type { Venue, SymbolConfig, Campaign } from "./supabase/types";

export type PlayBundle = {
  venue: Venue;
  config: SymbolConfig;
  campaigns: Campaign[];
};

export async function fetchPlayBundleBySlug(slug: string): Promise<PlayBundle | null> {
  const sb = getServiceClient();
  const { data: venue, error: vErr } = await sb
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (vErr || !venue) return null;

  const v = venue as unknown as Venue;
  const [{ data: cfg }, { data: camps }] = await Promise.all([
    sb.from("symbol_configs").select("*").eq("venue_id", v.id).maybeSingle(),
    sb.from("campaigns").select("*").eq("venue_id", v.id).eq("active", true),
  ]);

  if (!cfg) return null;

  return {
    venue: v,
    config: cfg as unknown as SymbolConfig,
    campaigns: (camps ?? []) as unknown as Campaign[],
  };
}
