-- Tracks the last time we emailed a store about a low/zero credit balance,
-- so the daily cron sweep doesn't re-send the same nudge every day the
-- balance stays low.

alter table public.store_credits
  add column low_balance_notified_at timestamptz;
