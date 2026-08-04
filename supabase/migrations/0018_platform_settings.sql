-- Single-row table for platform-wide operational settings that today are
-- hardcoded constants (e.g. LOW_BALANCE_THRESHOLD in the cron sweep) —
-- moving them here lets an operator tune them from /admin/settings without
-- a code change + deploy.
create table public.platform_settings (
  id boolean primary key default true,
  low_balance_threshold numeric not null default 10,
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint platform_settings_singleton check (id)
);

insert into public.platform_settings (id) values (true);

alter table public.platform_settings enable row level security;
-- No policies: only the service-role (admin) client reads/writes this table,
-- same posture as admin_audit_log and platform_admins.
