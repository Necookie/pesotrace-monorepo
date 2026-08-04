-- Suspend/pause: lets a platform operator block a store's extraction access
-- (abuse, non-payment, investigation) without the irreversible full delete
-- that's the only other lever today.
alter table public.stores
  add column suspended boolean not null default false,
  add column suspended_at timestamptz,
  add column suspended_reason text;

-- Admin-only support notes on a store — never surfaced to the store owner,
-- purely for operators to leave context ("walked them through fee setup
-- 7/28") for whoever picks up the next ticket.
alter table public.stores
  add column admin_notes text;

-- New admin actions from this batch each need their own audit_log entry
-- type. ALTER TYPE ... ADD VALUE cannot share a transaction with other DDL,
-- so these run as their own statements when applied (see
-- 0016_fee_formula.sql for the same note).
alter type admin_action_type add value if not exists 'suspend_store';
alter type admin_action_type add value if not exists 'unsuspend_store';
alter type admin_action_type add value if not exists 'update_admin_notes';
alter type admin_action_type add value if not exists 'bulk_grant_credits';
alter type admin_action_type add value if not exists 'update_platform_settings';
