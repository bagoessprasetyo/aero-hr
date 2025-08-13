-- Fix RLS on existing tables only
-- Run this in your Supabase SQL Editor

-- First, let's see which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'user_permissions', 'role_permissions', 'user_profiles', 'user_activity_logs');

-- Disable RLS on existing user management tables
DO $$
BEGIN
    -- Check and disable RLS for user_roles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS for user_roles';
    END IF;

    -- Check and disable RLS for user_permissions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_permissions' AND table_schema = 'public') THEN
        ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS for user_permissions';
    END IF;

    -- Check and disable RLS for role_permissions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions' AND table_schema = 'public') THEN
        ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS for role_permissions';
    END IF;

    -- Check and disable RLS for user_profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS for user_profiles';
    END IF;

    -- Check and disable RLS for user_activity_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs' AND table_schema = 'public') THEN
        ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS for user_activity_logs';
    ELSE
        RAISE NOTICE 'user_activity_logs table does not exist - will create it';
    END IF;
END $$;

-- Create user_activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_description TEXT NOT NULL,
  module_name VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop any existing problematic policies
DO $$
BEGIN
    -- Drop policies for user_roles
    BEGIN
        DROP POLICY IF EXISTS "Allow authenticated users to read user_roles" ON user_roles;
        DROP POLICY IF EXISTS "Allow service role to manage user_roles" ON user_roles;
        DROP POLICY IF EXISTS "Allow authenticated users to insert user_roles" ON user_roles;
        DROP POLICY IF EXISTS "Allow authenticated users to update user_roles" ON user_roles;
        DROP POLICY IF EXISTS "Allow authenticated users to delete user_roles" ON user_roles;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Table doesn't exist, ignore
    END;

    -- Drop policies for role_permissions
    BEGIN
        DROP POLICY IF EXISTS "Allow authenticated users to read role_permissions" ON role_permissions;
        DROP POLICY IF EXISTS "Allow authenticated users to insert role_permissions" ON role_permissions;
        DROP POLICY IF EXISTS "Allow authenticated users to update role_permissions" ON role_permissions;
        DROP POLICY IF EXISTS "Allow authenticated users to delete role_permissions" ON role_permissions;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Table doesn't exist, ignore
    END;

    -- Drop policies for user_profiles
    BEGIN
        DROP POLICY IF EXISTS "Allow authenticated users to read user_profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Allow authenticated users to insert user_profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Allow authenticated users to update user_profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Allow authenticated users to delete user_profiles" ON user_profiles;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Table doesn't exist, ignore
    END;
END $$;

SELECT 'RLS disabled on existing tables and user_activity_logs created!' as status;