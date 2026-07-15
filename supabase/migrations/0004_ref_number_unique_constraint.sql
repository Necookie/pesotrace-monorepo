-- Replace the partial unique index with a real UNIQUE constraint on
-- (store_id, ref_number). ref_number is already NOT NULL and always
-- non-empty by application-level validation, so the partial WHERE clause
-- was redundant — and PostgREST's upsert(..., onConflict:) can't reliably
-- target a partial index as an ON CONFLICT arbiter without also repeating
-- its WHERE clause, which the JS client has no way to express. A plain
-- constraint fixes that for the statement-import bulk upsert.

drop index if exists public.transactions_store_ref_unique;

alter table public.transactions
  add constraint transactions_store_ref_unique unique (store_id, ref_number);
