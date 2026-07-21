-- Per-store toggles for the transactional emails added alongside the
-- Resend integration. Kept on stores (not profiles) since today every
-- store-facing notification email goes to a single resolved recipient
-- (the owner) rather than being per-user.

alter table public.stores
  add column notification_prefs jsonb not null
  default '{"extractionFailed": true, "lowBalance": true}'::jsonb;
