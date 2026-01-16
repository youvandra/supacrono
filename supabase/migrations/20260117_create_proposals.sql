create extension if not exists "pgcrypto";

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique,
  title text not null,
  description text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'ended')),
  outcome text not null default 'pending' check (outcome in ('pending', 'passed', 'failed')),
  docs_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_short_id_idx on public.proposals (short_id);
create index if not exists proposals_status_idx on public.proposals (status);
create index if not exists proposals_created_at_idx on public.proposals (created_at);

