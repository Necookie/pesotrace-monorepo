-- 1. Drop trigger, function, and policies depending on columns to alter
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop policy if exists "users can update their own profile" on public.profiles;

-- 2. Drop foreign key constraints
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.transactions drop constraint if exists transactions_created_by_fkey;

-- 3. Alter column types from uuid to text
alter table public.profiles alter column id type text;
alter table public.transactions alter column created_by type text;

-- 4. Re-apply foreign key constraint between transactions and profiles
alter table public.transactions
  add constraint transactions_created_by_fkey
  foreign key (created_by) references public.profiles(id)
  on delete set null;

-- 5. Update current_store_id() and current_role() functions to read Clerk user ID from JWT claims
create or replace function public.current_store_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select store_id from public.profiles
  where id = nullif(current_setting('request.jwt.claims', true)::json->>'sub', '');
$$;

create or replace function public.current_role()
returns profile_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles
  where id = nullif(current_setting('request.jwt.claims', true)::json->>'sub', '');
$$;

-- 6. Re-create the profile update policy based on Clerk's sub claim
create policy "users can update their own profile"
  on public.profiles for update
  using (id = nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''));
