-- Migration 017: independent Gift Wheel configuration
--
-- The gift wheel (dashboard/gifts) used to reuse the studio main wheel's
-- prize pool (campaigns) and the venue's wheel_variant. These two columns
-- make it fully independent: the venue picks its own gift wheel TYPE and a
-- per-segment reward + probability weight, stored separately from the
-- studio wheel.

ALTER TABLE venues ADD COLUMN IF NOT EXISTS gift_wheel_variant text NOT NULL DEFAULT 'boho';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS gift_wheel_cfg jsonb NOT NULL DEFAULT '{}'::jsonb;

-- gift_wheel_cfg shape:
--   { [segmentId]: { reward: text, coupon: text, share: number } }
-- Only prize/jackpot segments are stored; lose segments are excluded.
-- `share` is the probability weight (relative). If gift_wheel_cfg is empty,
-- the gift-spin API falls back to the legacy campaigns pool.
COMMENT ON COLUMN venues.gift_wheel_cfg IS
  'Gift wheel per-segment config: { [segmentId]: { reward, coupon, share } } for prize/jackpot segments only (lose excluded). Empty {} = fall back to campaigns pool.';
