-- ═══════════════════════════════════════════════════════════════
--  Jackpot SaaS — Business Model Schema
--  Two-tier: Kampanya ($5/mo) + İşletme ($10/mo)
-- ═══════════════════════════════════════════════════════════════

-- Drop old tables if migrating fresh (safe in dev)
-- Comment these out for production
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS spins CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS business_configs CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─── ENUMs ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('kampanya', 'isletme');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE slot_variant AS ENUM ('v1', 'v2', 'v3');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── venues (işletmeler) ──────────────────────────────────────
-- A venue = one bar/cafe/restaurant subscribed to the SaaS
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,                  -- /play/{slug}
  name TEXT NOT NULL,                         -- "MIDNIGHT TAP"
  plan plan_tier NOT NULL DEFAULT 'kampanya',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  active BOOLEAN NOT NULL DEFAULT true,
  token_threshold NUMERIC(10,2) NOT NULL DEFAULT 50, -- TL per token
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venues_owner ON venues(owner_user_id);
CREATE INDEX idx_venues_slug ON venues(slug);

-- ─── symbol_configs (slot machine setup) ──────────────────────
-- One row per venue. Stores variant + win-rate split.
CREATE TABLE symbol_configs (
  venue_id UUID PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
  variant slot_variant NOT NULL DEFAULT 'v1',
  win_rate NUMERIC(5,4) NOT NULL DEFAULT 0.30,        -- 0.30 = 30%
  jackpot_share NUMERIC(5,4) NOT NULL DEFAULT 0.10,   -- portion of wins
  jackpot_reward TEXT NOT NULL DEFAULT 'JACKPOT',
  jackpot_coupon_prefix TEXT NOT NULL DEFAULT 'JACKPOT',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── campaigns (symbol triple → reward) ───────────────────────
-- Max 5 selectable symbols per venue + 1 jackpot. Each = 1 campaign.
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  symbol_id TEXT NOT NULL,             -- 'beer' | 'wine' | 'shot' | ...
  reward_label TEXT NOT NULL,          -- "Bira bizden"
  coupon_prefix TEXT NOT NULL,         -- "BEER"
  share NUMERIC(5,4) NOT NULL DEFAULT 0.20, -- relative weight
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, symbol_id)
);

CREATE INDEX idx_campaigns_venue ON campaigns(venue_id);

-- ─── customers (İşletme tier only) ────────────────────────────
-- Optional registration; links spins+coupons to a real person
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, email)
);

CREATE INDEX idx_customers_venue ON customers(venue_id);

-- ─── receipts ─────────────────────────────────────────────────
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  guest_token TEXT,                    -- anon visitor (Kampanya tier)
  amount NUMERIC(10,2) NOT NULL,
  tokens_awarded INT NOT NULL DEFAULT 0, -- floor(amount / threshold)
  issued_at TIMESTAMPTZ NOT NULL,
  fingerprint TEXT NOT NULL,
  image_url TEXT,
  ocr_status TEXT,
  ocr_summary TEXT,
  valid BOOLEAN NOT NULL DEFAULT true,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, fingerprint)
);

CREATE INDEX idx_receipts_venue ON receipts(venue_id);
CREATE INDEX idx_receipts_customer ON receipts(customer_id);

-- ─── spins ────────────────────────────────────────────────────
CREATE TABLE spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  guest_token TEXT,
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  is_jackpot BOOLEAN NOT NULL DEFAULT false,
  win BOOLEAN NOT NULL,
  outcome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spins_venue ON spins(venue_id);
CREATE INDEX idx_spins_receipt ON spins(receipt_id);

-- ─── coupons ──────────────────────────────────────────────────
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  guest_token TEXT,
  spin_id UUID REFERENCES spins(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  reward_label TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_venue ON coupons(venue_id);
CREATE INDEX idx_coupons_customer ON coupons(customer_id);
CREATE INDEX idx_coupons_code ON coupons(code);

-- ─── audit_logs ───────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbol_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see venue + config + campaigns (it's the play page)
CREATE POLICY "venues are publicly readable"
  ON venues FOR SELECT USING (active = true);

CREATE POLICY "symbol_configs are publicly readable"
  ON symbol_configs FOR SELECT USING (true);

CREATE POLICY "campaigns are publicly readable"
  ON campaigns FOR SELECT USING (active = true);

-- Owner write: venue owners can manage their own venue
CREATE POLICY "owner can update venue"
  ON venues FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE POLICY "owner can manage symbol_config"
  ON symbol_configs FOR ALL USING (
    EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY "owner can manage campaigns"
  ON campaigns FOR ALL USING (
    EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY "owner can read customers"
  ON customers FOR SELECT USING (
    EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY "owner can read receipts"
  ON receipts FOR SELECT USING (
    EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY "owner can read spins"
  ON spins FOR SELECT USING (
    EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY "owner can read coupons"
  ON coupons FOR SELECT USING (
    EXISTS (SELECT 1 FROM venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid())
  );

-- Inserts (receipts, spins, coupons) come through server-side route handlers
-- using the service_role key — they bypass RLS by design.
