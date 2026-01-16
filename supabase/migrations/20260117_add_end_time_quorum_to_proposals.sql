alter table public.proposals
  add column if not exists end_time timestamptz,
  add column if not exists quorum bigint;

