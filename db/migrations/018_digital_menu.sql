-- 018_digital_menu.sql
-- Standalone QR Digital Menu add-on.
--
-- This is INDEPENDENT from `customer_menus` (migration 010), which are
-- segmented campaign/deal menus. A digital menu is the venue's full à la carte
-- menu (categories -> items) shown to walk-in guests at /m/{slug} via a table
-- QR code. It has no audience targeting and no game coupling (a bridge to the
-- loyalty game is planned for later).
--
-- Gated by venues.digital_menu_enabled (an add-on flag toggled by an admin),
-- NOT by the pro tier.

alter table venues
  add column if not exists digital_menu_enabled boolean not null default false;

comment on column venues.digital_menu_enabled is
  'QR Digital Menu add-on flag. When true, /m/{slug} serves the venue full menu. Toggled per-venue by an admin (separate paid module).';

create table if not exists digital_menu_categories (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  name        text not null,            -- primary language (venue interface_language)
  name_en     text,                     -- optional English label
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists digital_menu_items (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references venues(id) on delete cascade,
  category_id    uuid references digital_menu_categories(id) on delete cascade,
  name           text not null,
  name_en        text,
  description    text,
  description_en text,
  price          numeric,               -- in venue currency; null = price-on-request
  image_url      text,                  -- public URL in the menu-images bucket
  tags           jsonb not null default '[]'::jsonb,  -- e.g. ["vegan","spicy","glutenfree"]
  is_available   boolean not null default true,       -- "86 / out of stock" quick toggle
  sort_order     int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists digital_menu_categories_venue on digital_menu_categories(venue_id, sort_order);
create index if not exists digital_menu_items_venue on digital_menu_items(venue_id, category_id, sort_order);

-- Public storage bucket for menu item images. Reads are public (menus are
-- public); writes go through the service-role key (RLS bypassed), so no
-- per-user storage policies are required.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
