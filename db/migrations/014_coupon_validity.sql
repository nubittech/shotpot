-- Coupon lifetime. The venue sets how many days a won coupon stays valid;
-- spin/gift routes stamp coupons.expires_at = now + this many days.
-- 0 = never expires. Default 30 days.
-- Migration 014.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS coupon_validity_days integer NOT NULL DEFAULT 30;

COMMENT ON COLUMN venues.coupon_validity_days IS
  'Days a won coupon stays valid; coupons.expires_at = created_at + this. 0 = no expiry.';
