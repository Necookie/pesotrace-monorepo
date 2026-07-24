-- Advanced fee rules: an optional expression that overrides fee_tier_config
-- for stores whose schedule the tier table cannot express (e.g. "₱20 for the
-- first ₱1,000, then ₱10 per extra ₱500"). Null means "use the tiers", which
-- stays the default and the path every non-technical store takes.
--
-- Deliberately text, not jsonb: the source is what the owner typed and what
-- the editor shows back. It is parsed and evaluated in application code by a
-- sandboxed AST walker (src/lib/fee-formula.ts) and is never executed by the
-- database.

alter table public.stores
  add column fee_formula text;

-- Platform admins can edit a store's fee configuration on the owner's behalf
-- for support, so that action needs its own audit type.
--
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block on
-- PostgreSQL versions before 12, and a value added in a transaction cannot be
-- used until it commits. Supabase runs PG 15+, where this is safe, but keep
-- this statement in its own migration step rather than folding it into a
-- larger transactional change.
alter type admin_action_type add value if not exists 'update_fee_tiers';
