-- Migration: Add Master Data and User Management Tables
-- Run this SQL in your Supabase SQL Editor to add master data management

-- =============================================================================
-- MASTER DATA TABLES
-- =============================================================================

-- Departments Table (Master Data)
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_code TEXT UNIQUE NOT NULL,
    department_name TEXT NOT NULL,
    department_description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    department_head_employee_id UUID,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positions Table (Master Data)
CREATE TABLE IF NOT EXISTS positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    position_code TEXT UNIQUE NOT NULL,
    position_title TEXT NOT NULL,
    position_description TEXT,
    department_id UUID NOT NULL REFERENCES departments(id),
    position_level INTEGER DEFAULT 1,
    min_salary DECIMAL(15,2),
    max_salary DECIMAL(15,2),
    required_skills TEXT[],
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banks Table (Master Data)
CREATE TABLE IF NOT EXISTS banks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_code TEXT UNIQUE NOT NULL,
    bank_name TEXT NOT NULL,
    bank_short_name TEXT,
    swift_code TEXT,
    bank_address TEXT,
    phone TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Branches Table
CREATE TABLE IF NOT EXISTS bank_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    branch_code TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    branch_address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(bank_id, branch_code)
);

-- =============================================================================
-- USER MANAGEMENT TABLES
-- =============================================================================

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    permission_name TEXT UNIQUE NOT NULL,
    permission_description TEXT,
    module_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'manage', 'export')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES user_permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID,
    
    UNIQUE(role_id, permission_id)
);

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    role_id UUID NOT NULL REFERENCES user_roles(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Log Table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    activity_description TEXT NOT NULL,
    module_name TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INSERT DEFAULT MASTER DATA (Only if tables are empty)
-- =============================================================================

-- Insert default departments
INSERT INTO departments (department_code, department_name, department_description, display_order) 
SELECT * FROM (VALUES
    ('IT', 'Information Technology', 'Technology and system development department', 1),
    ('HR', 'Human Resources', 'Human resources and talent management', 2),
    ('FIN', 'Finance & Accounting', 'Financial management and accounting', 3),
    ('OPS', 'Operations', 'Business operations and process management', 4),
    ('MKT', 'Marketing', 'Marketing and brand management', 5),
    ('SALES', 'Sales', 'Sales and business development', 6)
) AS v(department_code, department_name, department_description, display_order)
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE departments.department_code = v.department_code);

-- Insert default positions (only if departments exist and positions don't)
INSERT INTO positions (position_code, position_title, position_description, department_id, position_level, min_salary, max_salary, display_order)
SELECT 
    v.position_code, v.position_title, v.position_description, 
    d.id, v.position_level, v.min_salary, v.max_salary, v.display_order
FROM (VALUES
    ('IT-DEV-JR', 'Junior Developer', 'Entry-level software developer', 'IT', 1, 8000000, 12000000, 1),
    ('IT-DEV-SR', 'Senior Developer', 'Experienced software developer', 'IT', 3, 15000000, 25000000, 2),
    ('IT-LEAD', 'Tech Lead', 'Technical leadership role', 'IT', 4, 20000000, 35000000, 3),
    ('HR-SPEC', 'HR Specialist', 'Human resources specialist', 'HR', 2, 10000000, 18000000, 4),
    ('HR-MGR', 'HR Manager', 'Human resources manager', 'HR', 4, 18000000, 30000000, 5),
    ('FIN-ANAL', 'Financial Analyst', 'Financial analysis and reporting', 'FIN', 2, 12000000, 20000000, 6),
    ('FIN-MGR', 'Finance Manager', 'Finance and accounting manager', 'FIN', 4, 20000000, 35000000, 7)
) AS v(position_code, position_title, position_description, dept_code, position_level, min_salary, max_salary, display_order)
INNER JOIN departments d ON d.department_code = v.dept_code
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE positions.position_code = v.position_code);

-- Insert default banks (Indonesian banks)
INSERT INTO banks (bank_code, bank_name, bank_short_name, swift_code, display_order)
SELECT * FROM (VALUES
    ('BCA', 'PT Bank Central Asia Tbk', 'BCA', 'CENAIDJA', 1),
    ('BRI', 'PT Bank Rakyat Indonesia (Persero) Tbk', 'BRI', 'BRINIDJA', 2),
    ('BNI', 'PT Bank Negara Indonesia (Persero) Tbk', 'BNI', 'BNINIDJA', 3),
    ('MANDIRI', 'PT Bank Mandiri (Persero) Tbk', 'Mandiri', 'BMRIIDJA', 4),
    ('CIMB', 'PT Bank CIMB Niaga Tbk', 'CIMB Niaga', 'BNIAIDJA', 5),
    ('DANAMON', 'PT Bank Danamon Indonesia Tbk', 'Danamon', 'BDMNIDJA', 6),
    ('PERMATA', 'PT Bank Permata Tbk', 'Permata', 'BBBAIDJA', 7),
    ('BTN', 'PT Bank Tabungan Negara (Persero) Tbk', 'BTN', 'BTANIDJA', 8)
) AS v(bank_code, bank_name, bank_short_name, swift_code, display_order)
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE banks.bank_code = v.bank_code);

-- Insert default user roles
INSERT INTO user_roles (role_name, role_description, is_system_role)
SELECT * FROM (VALUES
    ('Super Admin', 'Full system access and user management', true),
    ('HR Admin', 'Human resources administration access', true),
    ('HR Manager', 'HR management with approval authority', false),
    ('HR Staff', 'Basic HR operations access', false),
    ('Finance Manager', 'Financial operations and reporting access', false),
    ('Employee', 'Basic employee self-service access', false),
    ('Viewer', 'Read-only access to reports and data', false)
) AS v(role_name, role_description, is_system_role)
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_roles.role_name = v.role_name);

-- Insert default permissions
INSERT INTO user_permissions (permission_name, permission_description, module_name, action_type)
SELECT * FROM (VALUES
    -- System permissions
    ('system.manage_users', 'Manage system users and roles', 'system', 'manage'),
    ('system.manage_master_data', 'Manage master data (departments, positions, banks)', 'system', 'manage'),
    ('system.view_audit_logs', 'View system audit logs', 'system', 'read'),
    
    -- Employee permissions
    ('employees.create', 'Create new employees', 'employees', 'create'),
    ('employees.read', 'View employee information', 'employees', 'read'),
    ('employees.update', 'Update employee information', 'employees', 'update'),
    ('employees.delete', 'Delete employees', 'employees', 'delete'),
    ('employees.manage_salary', 'Manage employee salary components', 'employees', 'manage'),
    
    -- Payroll permissions
    ('payroll.create', 'Create payroll periods', 'payroll', 'create'),
    ('payroll.read', 'View payroll data', 'payroll', 'read'),
    ('payroll.update', 'Update payroll calculations', 'payroll', 'update'),
    ('payroll.finalize', 'Finalize payroll periods', 'payroll', 'manage'),
    ('payroll.export', 'Export payroll reports', 'payroll', 'export'),
    
    -- Bulk operations permissions
    ('bulk_ops.create', 'Create bulk salary operations', 'bulk_operations', 'create'),
    ('bulk_ops.read', 'View bulk operations history', 'bulk_operations', 'read'),
    ('bulk_ops.execute', 'Execute bulk operations', 'bulk_operations', 'manage'),
    ('bulk_ops.rollback', 'Rollback bulk operations', 'bulk_operations', 'manage'),
    
    -- Reports permissions
    ('reports.view', 'View reports and analytics', 'reports', 'read'),
    ('reports.export', 'Export reports', 'reports', 'export'),
    
    -- Admin permissions
    ('admin.tax_config', 'Manage tax configuration', 'admin', 'manage'),
    ('admin.system_config', 'Manage system configuration', 'admin', 'manage')
) AS v(permission_name, permission_description, module_name, action_type)
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_permissions.permission_name = v.permission_name);

-- Assign permissions to roles (only if role_permissions is empty)
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Super Admin'),
    up.id
FROM user_permissions up
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM user_roles WHERE role_name = 'Super Admin')
    AND rp.permission_id = up.id
);

-- HR Admin gets most permissions except system management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Admin'),
    up.id
FROM user_permissions up
WHERE up.permission_name NOT LIKE 'system.%'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM user_roles WHERE role_name = 'HR Admin')
    AND rp.permission_id = up.id
);

-- HR Manager gets HR and payroll permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Manager'),
    up.id
FROM user_permissions up
WHERE up.module_name IN ('employees', 'payroll', 'bulk_operations', 'reports')
AND up.action_type IN ('create', 'read', 'update', 'manage', 'export')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM user_roles WHERE role_name = 'HR Manager')
    AND rp.permission_id = up.id
);

-- HR Staff gets basic HR permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Staff'),
    up.id
FROM user_permissions up
WHERE up.module_name IN ('employees', 'payroll', 'reports')
AND up.action_type IN ('create', 'read', 'update', 'export')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM user_roles WHERE role_name = 'HR Staff')
    AND rp.permission_id = up.id
);

-- Viewer gets read permissions only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Viewer'),
    up.id
FROM user_permissions up
WHERE up.action_type IN ('read')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = (SELECT id FROM user_roles WHERE role_name = 'Viewer')
    AND rp.permission_id = up.id
);

-- =============================================================================
-- INDEXES FOR MASTER DATA AND USER MANAGEMENT
-- =============================================================================

-- Master data indexes
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_active ON positions(is_active);
CREATE INDEX IF NOT EXISTS idx_positions_level ON positions(position_level);
CREATE INDEX IF NOT EXISTS idx_banks_code ON banks(bank_code);
CREATE INDEX IF NOT EXISTS idx_banks_active ON banks(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_branches_bank ON bank_branches(bank_id);

-- User management indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_date ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- =============================================================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- =============================================================================

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies (basic authenticated access for now - will refine with role-based later)
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can manage departments" ON departments;
CREATE POLICY "Authenticated users can view departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage departments" ON departments FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view positions" ON positions;
DROP POLICY IF EXISTS "Authenticated users can manage positions" ON positions;
CREATE POLICY "Authenticated users can view positions" ON positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage positions" ON positions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view banks" ON banks;
DROP POLICY IF EXISTS "Authenticated users can manage banks" ON banks;
CREATE POLICY "Authenticated users can view banks" ON banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage banks" ON banks FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view bank_branches" ON bank_branches;
DROP POLICY IF EXISTS "Authenticated users can manage bank_branches" ON bank_branches;
CREATE POLICY "Authenticated users can view bank_branches" ON bank_branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bank_branches" ON bank_branches FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can manage user_roles" ON user_roles;
CREATE POLICY "Authenticated users can view user_roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage user_roles" ON user_roles FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view user_permissions" ON user_permissions;
CREATE POLICY "Authenticated users can view user_permissions" ON user_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view role_permissions" ON role_permissions;
CREATE POLICY "Authenticated users can view role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage user_profiles" ON user_profiles;
CREATE POLICY "Authenticated users can view user_profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage user_profiles" ON user_profiles FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view user_activity_log" ON user_activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert user_activity_log" ON user_activity_log;
CREATE POLICY "Authenticated users can view user_activity_log" ON user_activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert user_activity_log" ON user_activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Create triggers for updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_departments_updated_at') THEN
        CREATE TRIGGER update_departments_updated_at 
        BEFORE UPDATE ON departments 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_positions_updated_at') THEN
        CREATE TRIGGER update_positions_updated_at 
        BEFORE UPDATE ON positions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_banks_updated_at') THEN
        CREATE TRIGGER update_banks_updated_at 
        BEFORE UPDATE ON banks 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bank_branches_updated_at') THEN
        CREATE TRIGGER update_bank_branches_updated_at 
        BEFORE UPDATE ON bank_branches 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_roles_updated_at') THEN
        CREATE TRIGGER update_user_roles_updated_at 
        BEFORE UPDATE ON user_roles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'departments',
    'positions', 
    'banks',
    'bank_branches',
    'user_roles',
    'user_permissions',
    'role_permissions',
    'user_profiles',
    'user_activity_log'
)
ORDER BY tablename;

-- Show count of default data
SELECT 
    'departments' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 
    'positions' as table_name, COUNT(*) as record_count FROM positions
UNION ALL
SELECT 
    'banks' as table_name, COUNT(*) as record_count FROM banks
UNION ALL
SELECT 
    'user_roles' as table_name, COUNT(*) as record_count FROM user_roles
UNION ALL
SELECT 
    'user_permissions' as table_name, COUNT(*) as record_count FROM user_permissions
UNION ALL
SELECT 
    'role_permissions' as table_name, COUNT(*) as record_count FROM role_permissions;