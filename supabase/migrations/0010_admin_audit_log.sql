-- Append-only log of platform-admin actions, independent of credit_ledger
-- (which only covers credit-related events and gets wiped by store
-- deletion's FK cascade). store_id is nullable + on delete set null so a
-- deleteStore audit row survives the very cascade it's documenting.

create type admin_action_type as enum (
  'adjust_credit',
  'approve_request',
  'deny_request',
  'update_store_name',
  'delete_store',
  'grant_admin',
  'revoke_admin'
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id text not null,
  action admin_action_type not null,
  store_id uuid references public.stores(id) on delete set null,
  target_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_store_id_idx on public.admin_audit_log (store_id);
