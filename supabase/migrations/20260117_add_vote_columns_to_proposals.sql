alter table public.proposals
  add column if not exists yes_votes bigint not null default 0,
  add column if not exists no_votes bigint not null default 0,
  add column if not exists abstain_votes bigint not null default 0;

