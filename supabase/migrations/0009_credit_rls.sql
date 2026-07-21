-- Store members can read their own store's credit standing; no direct
-- insert/update/delete policies exist for any of these tables — writes
-- only happen via consume_credit()/adjust_credit() (security definer,
-- bypasses RLS) or the service-role admin client used by the platform
-- admin dashboard.

alter table public.store_credits enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.credit_requests enable row level security;

create policy "store members can read their credit balance"
  on public.store_credits for select
  using (store_id = public.current_store_id());

create policy "store members can read their credit ledger"
  on public.credit_ledger for select
  using (store_id = public.current_store_id());

create policy "store members can read their credit requests"
  on public.credit_requests for select
  using (store_id = public.current_store_id());

create policy "store members can create their own credit requests"
  on public.credit_requests for insert
  with check (store_id = public.current_store_id());
