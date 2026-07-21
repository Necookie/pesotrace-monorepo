-- Staff invitations: lets an owner/manager bring a manager/staff user into
-- their store without them going through the auto-onboarding "create my own
-- store" path in (app)/layout.tsx. email is stored lowercased by the app
-- layer (no citext extension needed for a single-column case-insensitive
-- compare at this scale).

create type invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  role profile_role not null default 'staff',
  token text not null unique,
  invited_by text not null,
  status invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_by text,
  created_at timestamptz not null default now()
);

create index invitations_store_id_idx on public.invitations (store_id);
create index invitations_email_idx on public.invitations (email);
-- One live pending invite per (store, email) at a time.
create unique index invitations_store_email_pending_unique
  on public.invitations (store_id, email)
  where status = 'pending';

alter table public.invitations enable row level security;

create policy "owner or manager can read their store's invitations"
  on public.invitations for select
  using (store_id = public.current_store_id() and public.current_role() in ('owner', 'manager'));

create policy "owner or manager can create invitations for their store"
  on public.invitations for insert
  with check (store_id = public.current_store_id() and public.current_role() in ('owner', 'manager'));

create policy "owner or manager can revoke their store's invitations"
  on public.invitations for update
  using (store_id = public.current_store_id() and public.current_role() in ('owner', 'manager'));
