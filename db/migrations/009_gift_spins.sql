-- 009_gift_spins.sql
-- "Hediye Çark" — venue grants free wheel spins to registered customers
-- without a receipt scan. Two sources:
--   · manual  → venue sends spins to an audience from the dashboard
--   · daily   → one free spin per customer per day (lazily created)

create table if not exists gift_spins (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references venues(id) on delete cascade,
  customer_id   uuid not null references customers(id) on delete cascade,
  source        text not null default 'manual',   -- 'manual' | 'daily'
  status        text not null default 'pending',  -- 'pending' | 'used'
  gift_date     date,                             -- set for source='daily'
  reward_label  text,                             -- filled when spun
  coupon_id     uuid references coupons(id) on delete set null,
  created_at    timestamptz not null default now(),
  used_at       timestamptz,
  expires_at    timestamptz
);

create index if not exists gift_spins_lookup
  on gift_spins(venue_id, customer_id, status);

-- one daily gift per customer per day
create unique index if not exists gift_spins_daily_uniq
  on gift_spins(customer_id, gift_date)
  where source = 'daily';

-- venue-level toggle for the daily gift
alter table venues add column if not exists gift_daily_enabled boolean not null default false;

notify pgrst, 'reload schema';
