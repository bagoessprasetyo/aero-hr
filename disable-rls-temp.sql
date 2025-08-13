-- Temporarily disable RLS to fix infinite recursion
-- Run this in your Supabase SQL Editor

-- Disable RLS on all user management tables
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Allow authenticated users to read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow service role to manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to delete user_roles" ON user_roles;

DROP POLICY IF EXISTS "Allow authenticated users to read role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to insert role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to update role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to delete role_permissions" ON role_permissions;

DROP POLICY IF EXISTS "Allow authenticated users to read user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete user_profiles" ON user_profiles;

DROP POLICY IF EXISTS "Allow users to read own activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert activity logs" ON user_activity_logs;

DROP POLICY IF EXISTS "Allow authenticated users to read user_permissions" ON user_permissions;

-- Verify tables exist
SELECT 
  'user_roles' as table_name, 
  COUNT(*) as row_count 
FROM user_roles
UNION ALL
SELECT 
  'user_permissions' as table_name, 
  COUNT(*) as row_count 
FROM user_permissions
UNION ALL
SELECT 
  'role_permissions' as table_name, 
  COUNT(*) as row_count 
FROM role_permissions
UNION ALL
SELECT 
  'user_profiles' as table_name, 
  COUNT(*) as row_count 
FROM user_profiles
UNION ALL
SELECT 
  'user_activity_logs' as table_name, 
  COUNT(*) as row_count 
FROM user_activity_logs;

SELECT 'RLS disabled successfully! All tables accessible.' as status;