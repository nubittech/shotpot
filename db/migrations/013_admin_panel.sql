-- Admin panel: allowlist, audit trail, synthetic receipts for demo grants.
-- Migration 013.

-- 1) Admins allowlist. Keep it small; this is the only gate to /admin/* and
--    /api/admin/*. Adding/removing an admin is a DB-level operation on purpose.
create table if not exists admins (
  email text primary key,
  note text,
  created_at timestamptz not null default now(),
  created_by text
);

-- Seed the founder. Replace below or run a follow-up insert manually if the
-- email differs in production.
insert into admins (email, note, created_by)
values ('walkrie365@gmail.com', 'founder', 'bootstrap')
on conflict (email) do nothing;

-- 2) Audit trail for every privileged action. Used as the source of truth in
--    /admin/audit and for after-the-fact incident review.
create table if not exists admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  venue_id uuid references venues(id) on delete set null,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_venue_idx on admin_audit (venue_id, created_at desc);
create index if not exists admin_audit_admin_idx on admin_audit (admin_email, created_at desc);

-- 3) Synthetic receipt flag. Demo / admin-granted tokens should never be
--    counted in real analytics. Existing rows default to false.
alter table receipts
  add column if not exists is_synthetic boolean not null default false,
  add column if not exists granted_by_admin text;
create index if not exists receipts_synthetic_idx on receipts (venue_id) where is_synthetic = false;
