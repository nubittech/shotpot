-- Migration 007: Add Stripe billing columns to venues
-- Run in Supabase SQL Editor

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status   TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS plan_expires_at        TIMESTAMPTZ;

-- Unique index so we can look up venue by Stripe customer id
CREATE UNIQUE INDEX IF NOT EXISTS venues_stripe_customer_id_idx
  ON venues (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
