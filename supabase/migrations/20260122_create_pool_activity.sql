-- Create pool_activity table
CREATE TABLE IF NOT EXISTS pool_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('OPEN_TRADE', 'CLOSE_TRADE', 'DEPOSIT', 'WITHDRAW')),
    role TEXT CHECK (role IN ('TAKER', 'ABSORBER', 'OPERATOR')),
    amount NUMERIC,
    asset TEXT DEFAULT 'CRO',
    tx_hash TEXT,
    description TEXT,
    pnl NUMERIC -- Only for CLOSE_TRADE
);

-- Add RLS policies
ALTER TABLE pool_activity ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON pool_activity
    FOR SELECT TO public USING (true);

-- Allow service role (server-side) to insert/update/delete
CREATE POLICY "Allow service role full access" ON pool_activity
    FOR ALL TO service_role USING (true);

-- Create index for faster querying by time
CREATE INDEX idx_pool_activity_created_at ON pool_activity (created_at DESC);
