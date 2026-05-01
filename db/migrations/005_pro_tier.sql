-- Migration 005: Pro Tier (customer accounts, coupons, campaigns)
-- Adds the schema needed for Business Pro venues:
--   * Customer accounts (linked to Supabase auth.users)
--   * Per-customer coupon history
--   * Campaign sending + delivery tracking
--   * Venue tier flag (standard | pro)

-- ─── 1) Venue tier ──────────────────────────────────────────────
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'standard'
    CHECK (tier IN ('standard', 'pro'));

COMMENT ON COLUMN venues.tier IS 'standard = anonymous play; pro = customer accounts required';

-- ─── 2) Customers ───────────────────────────────────────────────
-- One row per customer per venue. A person may have accounts at multiple venues.
-- Linked to Supabase auth.users via auth_user_id (uuid).
CREATE TABLE IF NOT EXISTS customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Ensure all columns exist (idempotent — handles partial previous runs)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS auth_user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone             text,
  ADD COLUMN IF NOT EXISTS email             text,
  ADD COLUMN IF NOT EXISTS full_name         text,
  ADD COLUMN IF NOT EXISTS birth_date        date,
  ADD COLUMN IF NOT EXISTS consent_marketing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_kvkk      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_tier      text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS total_visits      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spend       numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_at     timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at        timestamptz;

-- Loyalty tier check (add only if not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'customers' AND constraint_name = 'customers_loyalty_tier_check'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_loyalty_tier_check
      CHECK (loyalty_tier IN ('bronze', 'silver', 'gold'));
  END IF;
END $$;

-- Unique constraints (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_phone_per_venue') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_phone_per_venue UNIQUE (venue_id, phone);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_email_per_venue') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_email_per_venue UNIQUE (venue_id, email);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_auth_per_venue') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_auth_per_venue UNIQUE (venue_id, auth_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS customers_venue_idx       ON customers (venue_id);
CREATE INDEX IF NOT EXISTS customers_last_visit_idx  ON customers (venue_id, last_visit_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS customers_auth_idx        ON customers (auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ─── 3) Link receipts and coupons to customers ──────────────────
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS receipts_customer_idx ON receipts (customer_id) WHERE customer_id IS NOT NULL;

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS coupons_customer_idx ON coupons (customer_id) WHERE customer_id IS NOT NULL;

-- ─── 4) Campaigns ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title           text NOT NULL,
  body            text NOT NULL,
  image_url       text,
  reward_label    text,                             -- optional: attach a free coupon
  audience_filter jsonb NOT NULL DEFAULT '{}',     -- e.g. {"segment":"dormant","days":30}
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  sent_count      integer NOT NULL DEFAULT 0,
  opened_count    integer NOT NULL DEFAULT 0,
  redeemed_count  integer NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketing_campaigns_venue_idx ON marketing_campaigns (venue_id, created_at DESC);

-- ─── 5) Campaign deliveries (per-customer tracking) ─────────────
CREATE TABLE IF NOT EXISTS campaign_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  delivered_at    timestamptz NOT NULL DEFAULT now(),
  opened_at       timestamptz,
  redeemed_at     timestamptz,
  coupon_id       uuid REFERENCES coupons(id) ON DELETE SET NULL,
  CONSTRAINT cd_unique_per_customer UNIQUE (campaign_id, customer_id)
);
CREATE INDEX IF NOT EXISTS cd_customer_idx ON campaign_deliveries (customer_id);
CREATE INDEX IF NOT EXISTS cd_campaign_idx ON campaign_deliveries (campaign_id);

-- ─── 6) RLS: customers can only see their own data ──────────────
ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_deliveries    ENABLE ROW LEVEL SECURITY;

-- Customer reads its own row
DROP POLICY IF EXISTS customers_self_read ON customers;
CREATE POLICY customers_self_read ON customers
  FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS customers_self_update ON customers;
CREATE POLICY customers_self_update ON customers
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Customer reads its own deliveries
DROP POLICY IF EXISTS cd_self_read ON campaign_deliveries;
CREATE POLICY cd_self_read ON campaign_deliveries
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

-- Service role bypasses RLS automatically; admin reads happen through service client.

-- ─── 7) Bootstrap Komün Bar to Pro tier ─────────────────────────
-- (Run separately if Komün Bar slug differs)
-- UPDATE venues SET tier = 'pro' WHERE slug = 'komun-bar';

COMMENT ON TABLE customers           IS 'Pro tier customer accounts; one per (venue, person)';
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaigns sent by venue to customers';
COMMENT ON TABLE campaign_deliveries IS 'Per-customer campaign delivery + engagement tracking';
