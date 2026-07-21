-- Controlled write paths for credit_ledger. All credit-affecting writes
-- (extraction consumption, manual operator adjustments/grants) should go
-- through these rather than inserting into credit_ledger directly, so the
-- shape of each entry_type stays consistent even once RLS is enforced.

-- Records an extraction's real cost against a store. p_credits may be 0
-- (e.g. a failed extraction) to log Gemini spend without charging the
-- store's balance.
create function public.consume_credit(
  p_store_id uuid,
  p_credits numeric,
  p_cost_usd numeric,
  p_source_type transaction_source,
  p_input_tokens integer default null,
  p_output_tokens integer default null,
  p_transaction_id uuid default null,
  p_created_by text default null
)
returns public.credit_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.credit_ledger;
begin
  insert into public.credit_ledger (
    store_id, entry_type, credit_delta, cost_usd,
    source_type, input_tokens, output_tokens, transaction_id, created_by
  )
  values (
    p_store_id, 'consumption', -abs(p_credits), p_cost_usd,
    p_source_type, p_input_tokens, p_output_tokens, p_transaction_id, p_created_by
  )
  returning * into result;

  return result;
end;
$$;

-- Manual operator-driven balance change (grant, adjustment, or refund).
-- A note is required so every manual change is explainable in the ledger.
create function public.adjust_credit(
  p_store_id uuid,
  p_delta numeric,
  p_note text,
  p_created_by text,
  p_entry_type credit_entry_type default 'adjustment'
)
returns public.credit_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.credit_ledger;
begin
  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'adjust_credit requires a non-empty note';
  end if;

  insert into public.credit_ledger (
    store_id, entry_type, credit_delta, note, created_by
  )
  values (p_store_id, p_entry_type, p_delta, p_note, p_created_by)
  returning * into result;

  return result;
end;
$$;
