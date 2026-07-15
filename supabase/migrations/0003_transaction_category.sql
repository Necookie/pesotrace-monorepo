-- Adds a transaction category matching how the store already tracks
-- transactions on paper (Cash In / Cash Out / Load / Bills / Other), on top
-- of the existing send/receive direction. Direction still drives the
-- balance math; category is how the store's own daily summary sheet
-- classifies each row.

create type transaction_category as enum ('cash_in', 'cash_out', 'load', 'bills', 'other');

alter table public.transactions
  add column category transaction_category not null default 'other';

create index transactions_category_idx on public.transactions (store_id, category);
