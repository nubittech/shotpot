-- Migration 004: Stronger receipt deduplication
-- Problem: SHA-256 hash changes when same receipt is photographed from different angles.
-- Solution: Add a composite semantic key (venue_id + receipt_date + amount_cents)
--           so the same physical receipt is rejected even with a different photo.

-- Add amount_cents and receipt_date for semantic dedup
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS receipt_date   date,
  ADD COLUMN IF NOT EXISTS amount_cents   integer;  -- amount * 100, integer for exact comparison

-- Populate from existing rows (best effort)
UPDATE receipts
  SET amount_cents = ROUND(amount * 100)::integer
  WHERE amount IS NOT NULL AND amount_cents IS NULL;

UPDATE receipts
  SET receipt_date = (issued_at AT TIME ZONE 'UTC')::date
  WHERE issued_at IS NOT NULL AND receipt_date IS NULL;

-- Unique index: same venue + same calendar date + same amount in cents = same receipt
-- Partial index: only applies when both fields are present (AI successfully parsed them)
CREATE UNIQUE INDEX IF NOT EXISTS receipts_semantic_dedup_idx
  ON receipts (venue_id, receipt_date, amount_cents)
  WHERE receipt_date IS NOT NULL AND amount_cents IS NOT NULL;

COMMENT ON COLUMN receipts.receipt_date  IS 'Calendar date extracted from receipt (for semantic dedup)';
COMMENT ON COLUMN receipts.amount_cents  IS 'Total amount × 100 as integer (for exact semantic dedup)';
