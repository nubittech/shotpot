-- 011_loyalty_tier_config.sql
-- Per-venue thresholds for the automatic VIP tier system.
-- A customer reaches a tier when EITHER their visit count OR their total
-- spend crosses the threshold (whichever comes first).

alter table venues add column if not exists tier_silver_visits int     not null default 5;
alter table venues add column if not exists tier_silver_spend  numeric not null default 1000;
alter table venues add column if not exists tier_gold_visits   int     not null default 20;
alter table venues add column if not exists tier_gold_spend    numeric not null default 3000;

notify pgrst, 'reload schema';
