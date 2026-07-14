-- Row-level security: every table scoped to the requesting user's store.

alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

-- security definer helper avoids recursive RLS lookups on profiles
create function public.current_store_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select store_id from public.profiles where id = auth.uid();
$$;

create function public.current_role()
returns profile_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- stores: members can read their own store; owner/manager can update it.
create policy "store members can read their store"
  on public.stores for select
  using (id = public.current_store_id());

create policy "owner or manager can update their store"
  on public.stores for update
  using (id = public.current_store_id() and public.current_role() in ('owner', 'manager'));

-- profiles: members can read profiles in their own store.
create policy "store members can read profiles in their store"
  on public.profiles for select
  using (store_id = public.current_store_id());

create policy "users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- transactions: full CRUD scoped to the requesting user's store.
create policy "store members can read their transactions"
  on public.transactions for select
  using (store_id = public.current_store_id());

create policy "store members can insert transactions for their store"
  on public.transactions for insert
  with check (store_id = public.current_store_id());

create policy "store members can update their transactions"
  on public.transactions for update
  using (store_id = public.current_store_id());

create policy "owner or manager can delete their transactions"
  on public.transactions for delete
  using (store_id = public.current_store_id() and public.current_role() in ('owner', 'manager'));

-- storage: files scoped to a `{store_id}/...` path prefix.
create policy "store members can read their source files"
  on storage.objects for select
  using (
    bucket_id = 'transaction-sources'
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );

create policy "store members can upload their source files"
  on storage.objects for insert
  with check (
    bucket_id = 'transaction-sources'
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );

create policy "store members can delete their source files"
  on storage.objects for delete
  using (
    bucket_id = 'transaction-sources'
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );
