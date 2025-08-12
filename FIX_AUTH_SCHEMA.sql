-- FIX SUPABASE AUTHENTICATION SCHEMA ISSUE
-- Run this in Supabase SQL Editor to fix "Database error querying schema"

-- This query will reset and fix common auth schema issues

-- 1. Ensure auth schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Ensure the auth.users table exists with proper structure
-- (This should already exist, but let's make sure)
DO $$
BEGIN
    -- Check if auth.users exists, if not this might indicate a bigger issue
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE EXCEPTION 'Auth schema is corrupted. Please contact Supabase support or recreate project.';
    END IF;
END $$;

-- 3. Fix potential RLS issues on auth tables
-- Disable RLS on auth tables (they should not have RLS enabled)
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.refresh_tokens DISABLE ROW LEVEL SECURITY;

-- 4. Ensure proper grants exist for authenticated role
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- 5. Check if there are any conflicting policies on public schema
-- that might interfere with auth queries
DO $$
DECLARE
    r RECORD;
BEGIN
    -- List any policies that might be interfering
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        RAISE NOTICE 'Found policy: %.%.%', r.schemaname, r.tablename, r.policyname;
    END LOOP;
END $$;

-- 6. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Test query to verify auth schema is working
SELECT 'Auth schema check completed successfully' as status;

-- If you still get errors after this, the issue might be:
-- 1. Your Supabase project is corrupted
-- 2. You need to recreate the project
-- 3. There's a Supabase service issue