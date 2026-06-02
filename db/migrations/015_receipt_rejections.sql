-- Failed receipt-scan attempts. Rejected scans never created a row before,
-- so the venue had zero visibility into why scans fail (blurry photos, expired
-- receipts, duplicate attempts = possible gaming). Kept in its own table so it
-- never pollutes receipt counts / revenue / dedup logic.
-- Migration 015.

create table if not exists receipt_rejections (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid not null references venues(id) on delete cascade,
  customer_id  uuid references customers(id) on delete set null,
  guest_token  text,
  reason       text not null,   -- LOW_CONFIDENCE | NO_AMOUNT | EXPIRED_RECEIPT | DUPLICATE
  amount       numeric(12,2),
  created_at   timestamptz not null default now()
);

create index if not exists receipt_rejections_venue_idx
  on receipt_rejections (venue_id, created_at desc);
