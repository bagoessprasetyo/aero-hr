-- FIX ROW LEVEL SECURITY POLICIES
-- Run this in Supabase SQL Editor to fix authentication issues

-- First, disable RLS temporarily to clean up
ALTER TABLE app_configuration DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read app_configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow authenticated manage employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated manage salary_components" ON salary_components;
DROP POLICY IF EXISTS "Allow authenticated users to read app_configuration" ON app_configuration;
DROP POLICY IF EXISTS "Allow authenticated users to manage employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to manage salary_components" ON salary_components;

-- Re-enable RLS
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "app_configuration_policy" ON app_configuration FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employees_policy" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "salary_components_policy" ON salary_components FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Test the policies work
SELECT 'Policies updated successfully!' as message;