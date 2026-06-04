-- 019_menu_applications.sql
-- QR Digital Menu intake. The service is NOT self-service: a business applies
-- via the public /qr-menu page, uploads photos of its existing menu, and we
-- (admins) build the digital menu manually using those photos. This table is
-- the application inbox; admins review it in /admin/applications.

create table if not exists digital_menu_applications (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name  text,
  phone         text,
  email         text,
  city          text,
  message       text,
  photo_urls    jsonb not null default '[]'::jsonb,   -- uploaded menu photo URLs
  status        text not null default 'new',          -- new | contacted | done | rejected
  venue_id      uuid references venues(id) on delete set null,  -- linked once set up
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists digital_menu_applications_status on digital_menu_applications(status, created_at desc);

-- Public bucket for application photo uploads (menu photos are not sensitive).
-- Uploads happen via the service-role key (RLS bypassed); reads are public.
insert into storage.buckets (id, name, public)
values ('menu-applications', 'menu-applications', true)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
