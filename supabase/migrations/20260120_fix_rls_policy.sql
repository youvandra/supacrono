-- Enable insert access for all users (required if using Anon Key)
create policy "Enable insert for all users"
on public.ai_trading_status
for insert
with check (true);
