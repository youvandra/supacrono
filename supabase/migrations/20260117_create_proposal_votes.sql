create table if not exists public.proposal_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  voter_address text not null,
  voting_power numeric not null,
  choice text not null check (choice in ('yes', 'no', 'abstain')),
  created_at timestamptz not null default now(),
  unique (proposal_id, voter_address)
);

create index if not exists proposal_votes_proposal_id_idx on public.proposal_votes (proposal_id);
create index if not exists proposal_votes_voter_address_idx on public.proposal_votes (voter_address);

