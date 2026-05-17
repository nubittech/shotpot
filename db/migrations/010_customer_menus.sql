-- 010_customer_menus.sql
-- "Sana Özel Menü" — venues publish personalized campaign menus that only a
-- targeted customer segment sees. Customers check in to view the day's deals
-- before deciding to visit.

create table if not exists customer_menus (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  title       text not null,
  description text,
  audience    text not null default 'all',   -- all | active30 | dormant30 | loyalty_gold | consented
  active      boolean not null default true,
  valid_from  date,
  valid_to    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists customer_menu_items (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid not null references customer_menus(id) on delete cascade,
  name        text not null,
  description text,
  old_price   numeric,
  new_price   numeric,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists customer_menus_venue on customer_menus(venue_id, active);
create index if not exists customer_menu_items_menu on customer_menu_items(menu_id, sort_order);

notify pgrst, 'reload schema';
