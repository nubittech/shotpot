// Automatic VIP tier calculation.
//
// A customer reaches a tier when EITHER their visit count OR their total
// spend crosses the venue-configured threshold — whichever happens first.

export type LoyaltyTier = "bronze" | "silver" | "gold";

export interface TierThresholds {
  silverVisits: number;
  silverSpend: number;
  goldVisits: number;
  goldSpend: number;
}

export const DEFAULT_TIER_THRESHOLDS: TierThresholds = {
  silverVisits: 5,
  silverSpend: 1000,
  goldVisits: 20,
  goldSpend: 3000,
};

/** Read thresholds off a venue row, falling back to defaults for any missing column. */
export function tierThresholdsFromVenue(v: {
  tier_silver_visits?: number | null;
  tier_silver_spend?: number | null;
  tier_gold_visits?: number | null;
  tier_gold_spend?: number | null;
}): TierThresholds {
  return {
    silverVisits: v.tier_silver_visits ?? DEFAULT_TIER_THRESHOLDS.silverVisits,
    silverSpend: v.tier_silver_spend ?? DEFAULT_TIER_THRESHOLDS.silverSpend,
    goldVisits: v.tier_gold_visits ?? DEFAULT_TIER_THRESHOLDS.goldVisits,
    goldSpend: v.tier_gold_spend ?? DEFAULT_TIER_THRESHOLDS.goldSpend,
  };
}

/** Compute the tier a customer should hold given their visits, spend and the venue thresholds. */
export function computeTier(visits: number, spend: number, t: TierThresholds): LoyaltyTier {
  if (visits >= t.goldVisits || spend >= t.goldSpend) return "gold";
  if (visits >= t.silverVisits || spend >= t.silverSpend) return "silver";
  return "bronze";
}
