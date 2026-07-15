alter table public.stores
  add column phone_numbers text[] not null default '{}';
