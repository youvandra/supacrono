-- Remove last_action fields and add leverage fields
alter table public.ai_trading_status
  drop column last_action,
  drop column last_action_desc;

alter table public.ai_trading_status
  add column leverage text not null default '1x',
  add column leverage_desc text not null default 'No leverage applied';
