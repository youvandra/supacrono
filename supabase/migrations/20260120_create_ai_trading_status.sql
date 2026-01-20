create table public.ai_trading_status (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Current bias
  current_bias text not null,
  current_bias_desc text not null,
  
  -- Position size
  position_size text not null,
  position_size_desc text not null,
  
  -- Risk budget remaining
  risk_budget text not null,
  risk_budget_desc text not null,
  
  -- Last action
  last_action text not null,
  last_action_desc text not null,
  
  -- Why AI is positioned this way
  reasoning text not null,
  
  constraint ai_trading_status_pkey primary key (id)
);

-- Enable RLS
alter table public.ai_trading_status enable row level security;

-- Create policy for reading (public access)
create policy "Enable read access for all users"
on public.ai_trading_status
for select
using (true);

-- Insert initial data
insert into public.ai_trading_status (
  current_bias,
  current_bias_desc,
  position_size,
  position_size_desc,
  risk_budget,
  risk_budget_desc,
  last_action,
  last_action_desc,
  reasoning
) values (
  'Long',
  'AI is tilted long CRO per current momentum and volatility regime.',
  '66% of pool · 2.1x leverage',
  'Expressed through CRO perpetuals on Crypto.com Futures.',
  '58% of daily',
  'AI can still deploy additional risk before today''s cap is hit.',
  'Reduced exposure · 6 min ago',
  'AI trimmed long size after volatility spike on CRO/USD.',
  'The engine scores short-term CRO trend, volatility, and funding conditions, then picks a bias and size under the pool''s risk budget.

Right now it is net long with moderated size after a volatility uptick, keeping Absorber buffer within the configured drawdown envelope.'
);
