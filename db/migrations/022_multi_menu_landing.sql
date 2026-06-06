-- 022_multi_menu_landing.sql
-- Multi-menu + landing page. A venue can have several menus (Breakfast, Drinks,
-- Alcoholic, ...). Guests scanning the QR land on an entry page (logo + bg) with
-- one button per menu (+ an optional campaign/game button), and tapping a button
-- opens that menu's visual design.

create table if not exists digital_menus (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  title       text not null,
  title_en    text,
  icon        text,                                  -- optional emoji/icon
  design      jsonb not null default '{}'::jsonb,    -- MenuDesign (overlay)
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists digital_menus_venue on digital_menus(venue_id, sort_order);

-- Landing/entry page config per venue.
-- { bgUrl, logoUrl, headline, headlineEn, showPlay, playLabel, playLabelEn }
alter table venues
  add column if not exists menu_landing jsonb not null default '{}'::jsonb;

-- Migrate any existing single visual design into a first menu row (no data loss).
insert into digital_menus (venue_id, title, design, sort_order, active)
select id, 'Menü', menu_design, 0, true
from venues
where menu_design ? 'bgUrl'
  and coalesce(menu_design->>'bgUrl','') <> '';

notify pgrst, 'reload schema';
