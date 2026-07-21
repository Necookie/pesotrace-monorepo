-- Controlled write path for admin_audit_log, mirroring consume_credit /
-- adjust_credit in 0008. Admin actions insert through this rather than a
-- raw insert, so the shape of every log row stays consistent.

create function public.log_admin_action(
  p_actor_user_id text,
  p_action admin_action_type,
  p_store_id uuid default null,
  p_target_summary text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.admin_audit_log
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.admin_audit_log;
begin
  insert into public.admin_audit_log (
    actor_user_id, action, store_id, target_summary, metadata
  )
  values (p_actor_user_id, p_action, p_store_id, p_target_summary, p_metadata)
  returning * into result;

  return result;
end;
$$;

-- Reads only via the service-role admin client (same as credit_ledger) —
-- no store-member select policy, since this is operator-only data.
alter table public.admin_audit_log enable row level security;
