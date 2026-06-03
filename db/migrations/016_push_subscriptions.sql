-- Web push subscriptions. One row per (customer, device/browser) — a customer
-- may subscribe from multiple devices. Endpoint is unique per subscription.
-- Migration 016.

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  venue_id    uuid references venues(id) on delete set null,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_customer_idx on push_subscriptions (customer_id);
create index if not exists push_subscriptions_venue_idx    on push_subscriptions (venue_id);
