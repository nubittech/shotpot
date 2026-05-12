-- Migration 008: Per-venue customer interface language
-- Stores the language used on public play, receipt scan, jackpot, coupon,
-- and staff redemption screens for each venue.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS interface_language text NOT NULL DEFAULT 'tr'
    CHECK (interface_language IN ('tr', 'en'));

COMMENT ON COLUMN venues.interface_language IS 'Customer-facing UI language: tr | en';
