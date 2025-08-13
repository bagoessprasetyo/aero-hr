-- User Management Tables Migration
-- Creates tables for RBAC system

-- User Roles Table
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Permissions Table  
CREATE TABLE user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    permission_name TEXT UNIQUE NOT NULL,
    module_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role_id UUID REFERENCES user_roles(id),
    department_id UUID REFERENCES departments(id),
    employee_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Junction Table
CREATE TABLE role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES user_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role_id, permission_id)
);

-- User Activity Log Table
CREATE TABLE user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_description TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO user_roles (role_name, role_description, is_system_role) VALUES 
    ('Super Admin', 'Full system access with all permissions', true),
    ('HR Admin', 'HR administration with employee and payroll management', false),
    ('HR Staff', 'Basic HR operations with limited access', false),
    ('Payroll Admin', 'Payroll processing and reporting', false),
    ('Employee', 'Basic employee self-service access', false);

-- Insert default permissions
INSERT INTO user_permissions (permission_name, module_name, action_type, description) VALUES 
    -- Employee Management
    ('employees.create', 'employees', 'create', 'Create new employee records'),
    ('employees.read', 'employees', 'read', 'View employee information'),
    ('employees.update', 'employees', 'update', 'Edit employee records'),
    ('employees.delete', 'employees', 'delete', 'Delete employee records'),
    ('employees.export', 'employees', 'export', 'Export employee data'),
    
    -- Payroll Management
    ('payroll.create', 'payroll', 'create', 'Create payroll periods'),
    ('payroll.read', 'payroll', 'read', 'View payroll information'),
    ('payroll.update', 'payroll', 'update', 'Edit payroll calculations'),
    ('payroll.manage', 'payroll', 'manage', 'Process and finalize payroll'),
    ('payroll.export', 'payroll', 'export', 'Export payroll reports'),
    
    -- Bulk Operations
    ('bulk_operations.create', 'bulk_operations', 'create', 'Create bulk operations'),
    ('bulk_operations.read', 'bulk_operations', 'read', 'View bulk operations'),
    ('bulk_operations.manage', 'bulk_operations', 'manage', 'Execute bulk operations'),
    ('bulk_operations.export', 'bulk_operations', 'export', 'Export bulk operation results'),
    
    -- Reports & Analytics
    ('reports.read', 'reports', 'read', 'View system reports'),
    ('reports.export', 'reports', 'export', 'Export reports and analytics'),
    
    -- Administration
    ('admin.create', 'admin', 'create', 'Create system configuration'),
    ('admin.read', 'admin', 'read', 'View administration panels'),
    ('admin.update', 'admin', 'update', 'Edit system configuration'),
    ('admin.delete', 'admin', 'delete', 'Delete system configuration'),
    ('admin.manage', 'admin', 'manage', 'Manage users and permissions');

-- Assign all permissions to Super Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Super Admin'),
    id
FROM user_permissions;

-- Assign HR permissions to HR Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Admin'),
    id
FROM user_permissions 
WHERE module_name IN ('employees', 'payroll', 'reports');

-- Assign basic HR permissions to HR Staff role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Staff'),
    id
FROM user_permissions 
WHERE module_name IN ('employees') AND action_type IN ('read', 'create', 'update');

-- Assign payroll permissions to Payroll Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Payroll Admin'),
    id
FROM user_permissions 
WHERE module_name IN ('payroll', 'bulk_operations', 'reports');

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view active roles" ON user_roles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN role_permissions rp ON up.role_id = rp.role_id
            JOIN user_permissions perm ON rp.permission_id = perm.id
            WHERE up.id = auth.uid() AND perm.permission_name = 'admin.manage'
        )
    );

-- Create policies for user_permissions
CREATE POLICY "Users can view active permissions" ON user_permissions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN role_permissions rp ON up.role_id = rp.role_id
            JOIN user_permissions perm ON rp.permission_id = perm.id
            WHERE up.id = auth.uid() AND perm.permission_name = 'admin.manage'
        )
    );

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN role_permissions rp ON up.role_id = rp.role_id
            JOIN user_permissions perm ON rp.permission_id = perm.id
            WHERE up.id = auth.uid() AND perm.permission_name = 'admin.manage'
        )
    );

-- Create policies for role_permissions
CREATE POLICY "Users can view role permissions" ON role_permissions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage role permissions" ON role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN role_permissions rp ON up.role_id = rp.role_id
            JOIN user_permissions perm ON rp.permission_id = perm.id
            WHERE up.id = auth.uid() AND perm.permission_name = 'admin.manage'
        )
    );

-- Create policies for user_activity_logs
CREATE POLICY "Users can view their own activity" ON user_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN role_permissions rp ON up.role_id = rp.role_id
            JOIN user_permissions perm ON rp.permission_id = perm.id
            WHERE up.id = auth.uid() AND perm.permission_name = 'admin.read'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX idx_user_profiles_department_id ON user_profiles(department_id);
CREATE INDEX idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_permissions_module_action ON user_permissions(module_name, action_type);
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE (
    permission_id UUID,
    permission_name TEXT,
    module_name TEXT,
    action_type TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.permission_name,
        up.module_name,
        up.action_type,
        up.description
    FROM user_profiles prof
    JOIN role_permissions rp ON prof.role_id = rp.role_id
    JOIN user_permissions up ON rp.permission_id = up.id
    WHERE prof.id = user_uuid 
      AND prof.is_active = true 
      AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;