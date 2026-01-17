alter table public.proposals
  add column if not exists last_block bigint;

