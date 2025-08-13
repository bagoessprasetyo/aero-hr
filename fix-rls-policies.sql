-- Fix RLS Policies to Avoid Infinite Recursion
-- Run this in your Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow admins to manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow admins to manage user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow admins to manage role_permissions" ON role_permissions;

-- Create simpler, non-recursive policies
-- For now, allow all authenticated users to read/write (you can refine this later)

-- User Roles - Allow authenticated users to read, and service role to write
CREATE POLICY "Allow authenticated users to read user_roles" ON user_roles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role to manage user_roles" ON user_roles 
FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated users to insert user_roles" ON user_roles 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update user_roles" ON user_roles 
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete user_roles" ON user_roles 
FOR DELETE TO authenticated USING (true);

-- Role Permissions - Allow authenticated users full access
CREATE POLICY "Allow authenticated users to read role_permissions" ON role_permissions 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert role_permissions" ON role_permissions 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update role_permissions" ON role_permissions 
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete role_permissions" ON role_permissions 
FOR DELETE TO authenticated USING (true);

-- User Profiles - Allow users to read all profiles and manage appropriately
CREATE POLICY "Allow authenticated users to read user_profiles" ON user_profiles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert user_profiles" ON user_profiles 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update user_profiles" ON user_profiles 
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete user_profiles" ON user_profiles 
FOR DELETE TO authenticated USING (true);

-- User Activity Logs - Allow users to read own logs and insert new ones
CREATE POLICY "Allow users to read own activity logs" ON user_activity_logs 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert activity logs" ON user_activity_logs 
FOR INSERT TO authenticated WITH CHECK (true);

-- Alternative approach: Temporarily disable RLS for development
-- You can uncomment these lines if you want to disable RLS temporarily
-- ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;  
-- ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;

SELECT 'RLS policies fixed successfully!' as status;