-- Migration 006: Fix table naming collision between spin-reward campaigns
-- and marketing campaigns.
--
-- Problem: Migration 005 created `campaigns` table for marketing, but a
-- `campaigns` table already existed (from migration 002) for spin rewards.
-- After the user's DROP CASCADE before re-running 005, the spin-reward
-- campaigns table was lost and replaced by the marketing schema.
--
-- Fix: Rename current `campaigns` to `marketing_campaigns`, restore the
-- original spin-reward `campaigns` table.

-- 1) Rename the marketing campaigns table (if it has the marketing schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'campaigns' AND column_name = 'title')
  THEN
    -- Current campaigns table has marketing schema → rename it
    ALTER TABLE campaigns RENAME TO marketing_campaigns;
    -- Update FK constraint name in campaign_deliveries (idempotent)
    ALTER TABLE campaign_deliveries
      DROP CONSTRAINT IF EXISTS campaign_deliveries_campaign_id_fkey;
    ALTER TABLE campaign_deliveries
      ADD CONSTRAINT campaign_deliveries_campaign_id_fkey
        FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2) Recreate the spin-reward campaigns table (matches migration 002 shape)
CREATE TABLE IF NOT EXISTS campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  symbol_id     text NOT NULL,                       -- 'beer' | 'wine' | etc.
  reward_label  text NOT NULL,                       -- "Bira bizden"
  coupon_prefix text NOT NULL,                       -- "BEER"
  share         numeric(5,4) NOT NULL DEFAULT 0.20,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue_id, symbol_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_venue ON campaigns(venue_id);

COMMENT ON TABLE campaigns           IS 'Spin reward configuration (symbol → coupon mapping)';
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaigns sent to customers (Pro tier)';
