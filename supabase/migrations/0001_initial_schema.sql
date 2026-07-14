-- PesoTrace initial schema
-- stores, profiles, transactions + storage bucket for uploaded screenshots/statements

create extension if not exists "pgcrypto";

create type transaction_direction as enum ('send', 'receive');
create type transaction_status as enum ('needs_review', 'confirmed');
create type transaction_source as enum ('screenshot', 'statement', 'manual');
create type profile_role as enum ('owner', 'manager', 'staff');

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_tier_config jsonb not null default '[{"min":0,"max":null,"type":"per_thousand","fee":20}]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  role profile_role not null default 'owner',
  full_name text,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  direction transaction_direction not null,
  amount numeric(12, 2) not null check (amount >= 0),
  ref_number text not null,
  counterparty_number text,
  counterparty_name text,
  occurred_at timestamptz not null,
  status transaction_status not null default 'needs_review',
  fee_computed numeric(12, 2) not null default 0,
  source_type transaction_source not null default 'screenshot',
  source_file_url text,
  confidence numeric(3, 2),
  notes text,
  tags text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index transactions_store_id_idx on public.transactions (store_id);
create index transactions_occurred_at_idx on public.transactions (occurred_at desc);
create index transactions_ref_number_idx on public.transactions (store_id, ref_number);
create unique index transactions_store_ref_unique on public.transactions (store_id, ref_number)
  where ref_number is not null and ref_number <> '';

-- New signups get their own store + owner profile automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_store_id uuid;
begin
  insert into public.stores (name)
  values (coalesce(new.raw_user_meta_data->>'store_name', 'My Store'))
  returning id into new_store_id;

  insert into public.profiles (id, store_id, role, full_name)
  values (new.id, new_store_id, 'owner', new.raw_user_meta_data->>'full_name');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private storage bucket for uploaded screenshots/statements.
insert into storage.buckets (id, name, public)
values ('transaction-sources', 'transaction-sources', false)
on conflict (id) do nothing;
