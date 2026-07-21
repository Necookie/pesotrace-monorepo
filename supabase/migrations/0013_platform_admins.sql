-- Moves the platform-admin allowlist out of an env var (PLATFORM_ADMIN_USER_IDS,
-- which needs a redeploy to change and has no audit trail) into a DB table.
-- The env var stays as a bootstrap/break-glass fallback so the operator can
-- never lock themselves out — see src/lib/auth/platform-admin.ts.

create table public.platform_admins (
  user_id text primary key,
  added_by text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Read/write is service-role/admin-client only — same as admin_audit_log.
alter table public.platform_admins enable row level security;
