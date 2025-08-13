-- User Management Database Tables Setup
-- Run these commands in your Supabase SQL Editor

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name VARCHAR(100) UNIQUE NOT NULL,
  role_description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_name VARCHAR(100) UNIQUE NOT NULL,
  permission_description TEXT,
  module_name VARCHAR(50) NOT NULL,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'manage', 'export')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES user_permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

-- 4. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  employee_id VARCHAR(20),
  role_id UUID REFERENCES user_roles(id),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user_activity_logs table
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

-- 6. Insert default permissions
INSERT INTO user_permissions (permission_name, permission_description, module_name, action_type) VALUES
-- Employee permissions
('employees.create', 'Create new employees', 'employees', 'create'),
('employees.read', 'View employee information', 'employees', 'read'),
('employees.update', 'Edit employee information', 'employees', 'update'),
('employees.delete', 'Delete employees', 'employees', 'delete'),
('employees.manage', 'Full employee management', 'employees', 'manage'),
('employees.export', 'Export employee data', 'employees', 'export'),

-- Payroll permissions
('payroll.create', 'Create payroll entries', 'payroll', 'create'),
('payroll.read', 'View payroll information', 'payroll', 'read'),
('payroll.update', 'Edit payroll entries', 'payroll', 'update'),
('payroll.delete', 'Delete payroll entries', 'payroll', 'delete'),
('payroll.manage', 'Full payroll management', 'payroll', 'manage'),
('payroll.export', 'Export payroll data', 'payroll', 'export'),

-- Bulk Operations permissions
('bulk_operations.create', 'Create bulk operations', 'bulk_operations', 'create'),
('bulk_operations.read', 'View bulk operations', 'bulk_operations', 'read'),
('bulk_operations.update', 'Edit bulk operations', 'bulk_operations', 'update'),
('bulk_operations.delete', 'Delete bulk operations', 'bulk_operations', 'delete'),
('bulk_operations.manage', 'Full bulk operations management', 'bulk_operations', 'manage'),
('bulk_operations.export', 'Export bulk operations data', 'bulk_operations', 'export'),

-- Reports permissions
('reports.create', 'Create reports', 'reports', 'create'),
('reports.read', 'View reports', 'reports', 'read'),
('reports.update', 'Edit reports', 'reports', 'update'),
('reports.delete', 'Delete reports', 'reports', 'delete'),
('reports.manage', 'Full reports management', 'reports', 'manage'),
('reports.export', 'Export reports', 'reports', 'export'),

-- Admin permissions
('admin.create', 'Create admin resources', 'admin', 'create'),
('admin.read', 'View admin panel', 'admin', 'read'),
('admin.update', 'Edit admin settings', 'admin', 'update'),
('admin.delete', 'Delete admin resources', 'admin', 'delete'),
('admin.manage', 'Full admin access', 'admin', 'manage'),
('admin.export', 'Export admin data', 'admin', 'export')
ON CONFLICT (permission_name) DO NOTHING;

-- 7. Insert default roles
INSERT INTO user_roles (role_name, role_description, is_system_role, is_active) VALUES
('Super Admin', 'Full system access with all permissions', true, true),
('HR Manager', 'Human Resources manager with employee and payroll access', false, true),
('HR Staff', 'Human Resources staff with limited access', false, true),
('Payroll Manager', 'Payroll management with salary and benefits access', false, true),
('Department Head', 'Department head with team management access', false, true),
('Employee', 'Basic employee access to view own information', false, true)
ON CONFLICT (role_name) DO NOTHING;

-- 8. Assign all permissions to Super Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE role_name = 'Super Admin'),
  id
FROM user_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 9. Assign permissions to HR Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE role_name = 'HR Manager'),
  id
FROM user_permissions 
WHERE module_name IN ('employees', 'payroll', 'reports') 
  AND action_type IN ('create', 'read', 'update', 'export')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10. Create RLS policies (Row Level Security)
-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read user_roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read user_permissions" ON user_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read user_profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to read own activity logs" ON user_activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow admins to manage everything (you'll need to refine these based on your needs)
CREATE POLICY "Allow admins to manage user_roles" ON user_roles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN user_roles ur ON up.role_id = ur.id 
    WHERE up.id = auth.uid() AND ur.role_name = 'Super Admin'
  )
);

CREATE POLICY "Allow admins to manage user_profiles" ON user_profiles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN user_roles ur ON up.role_id = ur.id 
    WHERE up.id = auth.uid() AND ur.role_name IN ('Super Admin', 'HR Manager')
  )
);

-- 11. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Setup complete!
SELECT 'User management database tables created successfully!' as status;