-- Platform AI-credit system: tracks per-store credit balance used to gate
-- Gemini extraction calls, plus an append-only ledger for audit/billing.
--
-- store_credits.balance is a cache kept in sync by a trigger on
-- credit_ledger inserts, so the extraction-time gate is a single indexed
-- read rather than a sum() over the ledger. The ledger itself is the
-- source of truth.

create type credit_entry_type as enum ('grant', 'consumption', 'adjustment', 'refund');
create type credit_request_status as enum ('pending', 'approved', 'denied');

create table public.store_credits (
  store_id uuid primary key references public.stores(id) on delete cascade,
  balance numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  entry_type credit_entry_type not null,
  credit_delta numeric not null,
  cost_usd numeric(12, 6) not null default 0,
  source_type transaction_source,
  input_tokens integer,
  output_tokens integer,
  transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create index credit_ledger_store_id_created_at_idx
  on public.credit_ledger (store_id, created_at desc);
create index credit_ledger_entry_type_idx on public.credit_ledger (entry_type);

create table public.credit_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  status credit_request_status not null default 'pending',
  requested_by text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index credit_requests_store_id_idx on public.credit_requests (store_id);
create index credit_requests_status_idx on public.credit_requests (status)
  where status = 'pending';

-- Keeps store_credits.balance equal to sum(credit_delta) without a live
-- aggregate query on every extraction request.
create function public.apply_credit_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_credits (store_id, balance, updated_at)
  values (new.store_id, new.credit_delta, now())
  on conflict (store_id)
  do update set balance = public.store_credits.balance + new.credit_delta,
                updated_at = now();
  return new;
end;
$$;

create trigger on_credit_ledger_insert
  after insert on public.credit_ledger
  for each row execute function public.apply_credit_ledger_entry();
