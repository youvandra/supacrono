-- Allow public insert access for pool_activity
-- This is necessary because we are using the anon key for both client and server (fallback)
-- and we don't have the service role key in the environment variables.

DROP POLICY IF EXISTS "Allow public insert access" ON pool_activity;

CREATE POLICY "Allow public insert access" ON pool_activity
    FOR INSERT TO public WITH CHECK (true);
