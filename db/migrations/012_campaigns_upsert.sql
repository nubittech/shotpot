-- 012_campaigns_upsert.sql
-- Campaign rows must be stable so historical spins/coupons keep their
-- attribution (per-campaign analytics). The studio now upserts campaigns by
-- (venue_id, symbol_id) instead of delete+insert — which needs a unique
-- constraint on that pair.

-- Safety: drop any duplicate (venue_id, symbol_id) rows, keeping the newest.
delete from campaigns a
  using campaigns b
  where a.venue_id = b.venue_id
    and a.symbol_id = b.symbol_id
    and a.ctid < b.ctid;

-- Unique constraint enables ON CONFLICT upsert.
alter table campaigns
  add constraint campaigns_venue_symbol_unique unique (venue_id, symbol_id);

notify pgrst, 'reload schema';
