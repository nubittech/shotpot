-- Migration 003: Currency selection + receipt mode per venue
-- Adds: currency, receipt_mode, timezone columns to venues

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS currency        text    NOT NULL DEFAULT 'TRY'
    CHECK (currency IN ('TRY', 'USD', 'EUR')),
  ADD COLUMN IF NOT EXISTS receipt_mode    text    NOT NULL DEFAULT 'ocr'
    CHECK (receipt_mode IN ('ocr', 'qr', 'both')),
  ADD COLUMN IF NOT EXISTS timezone        text    NOT NULL DEFAULT 'Europe/Istanbul';

-- token_threshold already exists from 002 migration
-- it now represents the amount in the venue's selected currency
-- e.g. TRY: 50, USD: 3, EUR: 2.5 → 1 token per threshold

COMMENT ON COLUMN venues.currency          IS 'ISO 4217 code: TRY | USD | EUR';
COMMENT ON COLUMN venues.receipt_mode      IS 'ocr = photo+AI, qr = QR scan, both = QR first then fallback';
COMMENT ON COLUMN venues.timezone          IS 'IANA timezone for 1-hour receipt window check';
COMMENT ON COLUMN venues.token_threshold   IS 'Amount in venues.currency that equals 1 spin token';
