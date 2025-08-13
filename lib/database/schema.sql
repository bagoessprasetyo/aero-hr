-- Database Schema for Aero HR MVP
-- Based on PRD requirements for Indonesian payroll system

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- App Configuration Table
CREATE TABLE app_configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration values
INSERT INTO app_configuration (key, value, description) VALUES
    ('ptkp_tk0', '54000000', 'PTKP for TK/0 status (yearly)'),
    ('ptkp_k0', '58500000', 'PTKP for K/0 status (yearly)'),
    ('ptkp_k1', '63000000', 'PTKP for K/1 status (yearly)'),
    ('ptkp_k2', '67500000', 'PTKP for K/2 status (yearly)'),
    ('ptkp_k3', '72000000', 'PTKP for K/3 status (yearly)'),
    ('occupational_cost_max_yearly', '6000000', 'Maximum occupational cost deduction per year'),
    ('occupational_cost_percentage', '5', 'Occupational cost deduction percentage'),
    ('bpjs_health_employee_rate', '1', 'BPJS Health employee contribution rate (%)'),
    ('bpjs_health_company_rate', '4', 'BPJS Health company contribution rate (%)'),
    ('bpjs_health_max_salary', '12000000', 'BPJS Health maximum salary for calculation'),
    ('bpjs_jht_employee_rate', '2', 'BPJS JHT employee contribution rate (%)'),
    ('bpjs_jht_company_rate', '3.7', 'BPJS JHT company contribution rate (%)'),
    ('bpjs_jp_employee_rate', '1', 'BPJS JP employee contribution rate (%)'),
    ('bpjs_jp_company_rate', '2', 'BPJS JP company contribution rate (%)'),
    ('bpjs_jkk_company_rate', '0.24', 'BPJS JKK company contribution rate (%)'),
    ('bpjs_jkm_company_rate', '0.30', 'BPJS JKM company contribution rate (%)');

-- Employees Table
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    npwp TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    
    -- Employment Information
    position_title TEXT NOT NULL,
    department TEXT NOT NULL,
    join_date DATE NOT NULL,
    employment_status TEXT NOT NULL CHECK (employment_status IN ('permanent', 'contract')),
    employee_status TEXT NOT NULL DEFAULT 'active' CHECK (employee_status IN ('active', 'resigned', 'terminated')),
    
    -- Financial Information
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    ptkp_status TEXT NOT NULL CHECK (ptkp_status IN ('TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3')),
    
    -- BPJS Enrollment
    bpjs_health_enrolled BOOLEAN DEFAULT false,
    bpjs_manpower_enrolled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary Components Table
CREATE TABLE salary_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL CHECK (component_type IN ('basic_salary', 'fixed_allowance')),
    amount DECIMAL(15,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, component_name)
);

-- Payrolls Table (Master payroll periods)
CREATE TABLE payrolls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'finalized')),
    total_employees INTEGER DEFAULT 0,
    total_gross_salary DECIMAL(15,2) DEFAULT 0,
    total_pph21 DECIMAL(15,2) DEFAULT 0,
    total_bpjs_company DECIMAL(15,2) DEFAULT 0,
    total_bpjs_employee DECIMAL(15,2) DEFAULT 0,
    total_net_salary DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(period_month, period_year)
);

-- Payroll Items Table (Detailed calculations per employee)
CREATE TABLE payroll_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    
    -- Variable components (input)
    bonus DECIMAL(15,2) DEFAULT 0,
    overtime_pay DECIMAL(15,2) DEFAULT 0,
    other_allowances DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    
    -- Calculated amounts
    basic_salary DECIMAL(15,2) NOT NULL,
    fixed_allowances DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) NOT NULL,
    
    -- BPJS calculations
    bpjs_health_employee DECIMAL(15,2) DEFAULT 0,
    bpjs_health_company DECIMAL(15,2) DEFAULT 0,
    bpjs_jht_employee DECIMAL(15,2) DEFAULT 0,
    bpjs_jht_company DECIMAL(15,2) DEFAULT 0,
    bpjs_jp_employee DECIMAL(15,2) DEFAULT 0,
    bpjs_jp_company DECIMAL(15,2) DEFAULT 0,
    bpjs_jkk_company DECIMAL(15,2) DEFAULT 0,
    bpjs_jkm_company DECIMAL(15,2) DEFAULT 0,
    
    -- Tax calculations
    taxable_income DECIMAL(15,2) DEFAULT 0,
    occupational_cost DECIMAL(15,2) DEFAULT 0,
    ptkp_amount DECIMAL(15,2) DEFAULT 0,
    pkp_yearly DECIMAL(15,2) DEFAULT 0,
    pph21_yearly DECIMAL(15,2) DEFAULT 0,
    pph21_monthly DECIMAL(15,2) DEFAULT 0,
    
    -- Final amounts
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(payroll_id, employee_id)
);

-- Create indexes for better performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_status ON employees(employee_status);
CREATE INDEX idx_salary_components_employee ON salary_components(employee_id);
CREATE INDEX idx_payroll_items_payroll ON payroll_items(payroll_id);
CREATE INDEX idx_payroll_items_employee ON payroll_items(employee_id);
CREATE INDEX idx_payrolls_period ON payrolls(period_year, period_month);

-- Enable Row Level Security
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- Create policies (basic authenticated user access for now)
CREATE POLICY "Authenticated users can view app_configuration" ON app_configuration FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage employees" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage salary_components" ON salary_components FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage payrolls" ON payrolls FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage payroll_items" ON payroll_items FOR ALL TO authenticated USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salary_components_updated_at BEFORE UPDATE ON salary_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payrolls_updated_at BEFORE UPDATE ON payrolls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_items_updated_at BEFORE UPDATE ON payroll_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_configuration_updated_at BEFORE UPDATE ON app_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Salary Component History Table (for audit trail)
CREATE TABLE salary_component_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salary_component_id UUID REFERENCES salary_components(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL CHECK (component_type IN ('basic_salary', 'fixed_allowance')),
    previous_amount DECIMAL(15,2),
    new_amount DECIMAL(15,2),
    previous_status BOOLEAN,
    new_status BOOLEAN,
    effective_date DATE NOT NULL,
    change_reason TEXT,
    change_notes TEXT,
    changed_by TEXT NOT NULL,
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Change Log Table (summary view)
CREATE TABLE employee_change_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    change_type TEXT NOT NULL CHECK (change_type IN ('salary_adjustment', 'promotion', 'status_change', 'bulk_operation')),
    change_date DATE NOT NULL,
    change_amount DECIMAL(15,2),
    previous_gross_salary DECIMAL(15,2),
    new_gross_salary DECIMAL(15,2),
    change_reason TEXT,
    changed_by TEXT NOT NULL,
    bulk_operation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk Salary Operations Table
CREATE TABLE bulk_salary_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('annual_review', 'mass_increase', 'department_adjustment', 'promotion_batch', 'cost_of_living', 'rollback')),
    operation_name TEXT NOT NULL,
    operation_description TEXT,
    affected_employees_count INTEGER NOT NULL DEFAULT 0,
    department_filter TEXT,
    position_filter TEXT,
    salary_range_filter JSONB,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount', 'new_structure', 'rollback')),
    adjustment_value DECIMAL(15,2),
    total_cost_impact DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_employees_affected INTEGER NOT NULL DEFAULT 0,
    effective_date DATE NOT NULL,
    operation_status TEXT NOT NULL DEFAULT 'draft' CHECK (operation_status IN ('draft', 'executing', 'completed', 'partially_completed', 'failed', 'cancelled')),
    successful_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    error_message TEXT,
    created_by TEXT NOT NULL,
    executed_by TEXT,
    cancelled_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- Bulk Salary Operation Items Table
CREATE TABLE bulk_salary_operation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_operation_id UUID NOT NULL REFERENCES bulk_salary_operations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    previous_gross_salary DECIMAL(15,2) NOT NULL,
    new_gross_salary DECIMAL(15,2) NOT NULL,
    salary_change_amount DECIMAL(15,2) NOT NULL,
    component_changes JSONB,
    item_status TEXT NOT NULL DEFAULT 'pending' CHECK (item_status IN ('pending', 'applied', 'failed')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary Review Schedule Table
CREATE TABLE salary_review_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    review_type TEXT NOT NULL CHECK (review_type IN ('annual', 'probation', 'promotion', 'market_adjustment')),
    scheduled_date DATE NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (review_status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    reviewer_id TEXT,
    review_notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Audit Log Table
CREATE TABLE compliance_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_type TEXT NOT NULL CHECK (audit_type IN ('salary_export', 'bulk_operation', 'tax_calculation', 'bpjs_calculation')),
    audit_description TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    employee_ids UUID[],
    departments TEXT[],
    total_employees_audited INTEGER DEFAULT 0,
    total_salary_components_reviewed INTEGER DEFAULT 0,
    issues_found INTEGER DEFAULT 0,
    audit_results JSONB,
    requested_by TEXT NOT NULL,
    generated_by TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bulk operations tables
CREATE INDEX idx_salary_component_history_employee ON salary_component_history(employee_id);
CREATE INDEX idx_salary_component_history_date ON salary_component_history(effective_date);
CREATE INDEX idx_employee_change_log_employee ON employee_change_log(employee_id);
CREATE INDEX idx_employee_change_log_date ON employee_change_log(change_date);
CREATE INDEX idx_bulk_operations_status ON bulk_salary_operations(operation_status);
CREATE INDEX idx_bulk_operations_type ON bulk_salary_operations(operation_type);
CREATE INDEX idx_bulk_operations_date ON bulk_salary_operations(created_at);
CREATE INDEX idx_bulk_operation_items_bulk_op ON bulk_salary_operation_items(bulk_operation_id);
CREATE INDEX idx_bulk_operation_items_employee ON bulk_salary_operation_items(employee_id);
CREATE INDEX idx_salary_review_schedule_employee ON salary_review_schedule(employee_id);
CREATE INDEX idx_salary_review_schedule_date ON salary_review_schedule(scheduled_date);
CREATE INDEX idx_compliance_audit_log_type ON compliance_audit_log(audit_type);
CREATE INDEX idx_compliance_audit_log_date ON compliance_audit_log(generated_at);

-- Enable Row Level Security for new tables
ALTER TABLE salary_component_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_salary_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_salary_operation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Authenticated users can view salary_component_history" ON salary_component_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage salary_component_history" ON salary_component_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view employee_change_log" ON employee_change_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage employee_change_log" ON employee_change_log FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view bulk_salary_operations" ON bulk_salary_operations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bulk_salary_operations" ON bulk_salary_operations FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view bulk_salary_operation_items" ON bulk_salary_operation_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bulk_salary_operation_items" ON bulk_salary_operation_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view salary_review_schedule" ON salary_review_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage salary_review_schedule" ON salary_review_schedule FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view compliance_audit_log" ON compliance_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage compliance_audit_log" ON compliance_audit_log FOR ALL TO authenticated USING (true);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_salary_review_schedule_updated_at BEFORE UPDATE ON salary_review_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MASTER DATA TABLES
-- =============================================================================

-- Departments Table (Master Data)
CREATE TABLE departments (
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
CREATE TABLE positions (
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
CREATE TABLE banks (
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
CREATE TABLE bank_branches (
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
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Permissions Table
CREATE TABLE user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    permission_name TEXT UNIQUE NOT NULL,
    permission_description TEXT,
    module_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'manage', 'export')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Table (Many-to-Many)
CREATE TABLE role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES user_permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID,
    
    UNIQUE(role_id, permission_id)
);

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE user_profiles (
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
CREATE TABLE user_activity_log (
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
-- INSERT DEFAULT MASTER DATA
-- =============================================================================

-- Insert default departments
INSERT INTO departments (department_code, department_name, department_description, display_order) VALUES
    ('IT', 'Information Technology', 'Technology and system development department', 1),
    ('HR', 'Human Resources', 'Human resources and talent management', 2),
    ('FIN', 'Finance & Accounting', 'Financial management and accounting', 3),
    ('OPS', 'Operations', 'Business operations and process management', 4),
    ('MKT', 'Marketing', 'Marketing and brand management', 5),
    ('SALES', 'Sales', 'Sales and business development', 6);

-- Insert default positions (will reference departments after they're created)
INSERT INTO positions (position_code, position_title, position_description, department_id, position_level, min_salary, max_salary, display_order) VALUES
    ('IT-DEV-JR', 'Junior Developer', 'Entry-level software developer', (SELECT id FROM departments WHERE department_code = 'IT'), 1, 8000000, 12000000, 1),
    ('IT-DEV-SR', 'Senior Developer', 'Experienced software developer', (SELECT id FROM departments WHERE department_code = 'IT'), 3, 15000000, 25000000, 2),
    ('IT-LEAD', 'Tech Lead', 'Technical leadership role', (SELECT id FROM departments WHERE department_code = 'IT'), 4, 20000000, 35000000, 3),
    ('HR-SPEC', 'HR Specialist', 'Human resources specialist', (SELECT id FROM departments WHERE department_code = 'HR'), 2, 10000000, 18000000, 4),
    ('HR-MGR', 'HR Manager', 'Human resources manager', (SELECT id FROM departments WHERE department_code = 'HR'), 4, 18000000, 30000000, 5),
    ('FIN-ANAL', 'Financial Analyst', 'Financial analysis and reporting', (SELECT id FROM departments WHERE department_code = 'FIN'), 2, 12000000, 20000000, 6),
    ('FIN-MGR', 'Finance Manager', 'Finance and accounting manager', (SELECT id FROM departments WHERE department_code = 'FIN'), 4, 20000000, 35000000, 7);

-- Insert default banks (Indonesian banks)
INSERT INTO banks (bank_code, bank_name, bank_short_name, swift_code, display_order) VALUES
    ('BCA', 'PT Bank Central Asia Tbk', 'BCA', 'CENAIDJA', 1),
    ('BRI', 'PT Bank Rakyat Indonesia (Persero) Tbk', 'BRI', 'BRINIDJA', 2),
    ('BNI', 'PT Bank Negara Indonesia (Persero) Tbk', 'BNI', 'BNINIDJA', 3),
    ('MANDIRI', 'PT Bank Mandiri (Persero) Tbk', 'Mandiri', 'BMRIIDJA', 4),
    ('CIMB', 'PT Bank CIMB Niaga Tbk', 'CIMB Niaga', 'BNIAIDJA', 5),
    ('DANAMON', 'PT Bank Danamon Indonesia Tbk', 'Danamon', 'BDMNIDJA', 6),
    ('PERMATA', 'PT Bank Permata Tbk', 'Permata', 'BBBAIDJA', 7),
    ('BTN', 'PT Bank Tabungan Negara (Persero) Tbk', 'BTN', 'BTANIDJA', 8);

-- Insert default user roles
INSERT INTO user_roles (role_name, role_description, is_system_role) VALUES
    ('Super Admin', 'Full system access and user management', true),
    ('HR Admin', 'Human resources administration access', true),
    ('HR Manager', 'HR management with approval authority', false),
    ('HR Staff', 'Basic HR operations access', false),
    ('Finance Manager', 'Financial operations and reporting access', false),
    ('Employee', 'Basic employee self-service access', false),
    ('Viewer', 'Read-only access to reports and data', false);

-- Insert default permissions
INSERT INTO user_permissions (permission_name, permission_description, module_name, action_type) VALUES
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
    ('admin.system_config', 'Manage system configuration', 'admin', 'manage');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Super Admin'),
    id
FROM user_permissions;

-- HR Admin gets most permissions except system management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Admin'),
    id
FROM user_permissions 
WHERE permission_name NOT LIKE 'system.%';

-- HR Manager gets HR and payroll permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Manager'),
    id
FROM user_permissions 
WHERE module_name IN ('employees', 'payroll', 'bulk_operations', 'reports')
AND action_type IN ('create', 'read', 'update', 'manage', 'export');

-- HR Staff gets basic HR permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'HR Staff'),
    id
FROM user_permissions 
WHERE module_name IN ('employees', 'payroll', 'reports')
AND action_type IN ('create', 'read', 'update', 'export');

-- Viewer gets read permissions only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Viewer'),
    id
FROM user_permissions 
WHERE action_type IN ('read');

-- =============================================================================
-- INDEXES FOR MASTER DATA AND USER MANAGEMENT
-- =============================================================================

-- Master data indexes
CREATE INDEX idx_departments_code ON departments(department_code);
CREATE INDEX idx_departments_active ON departments(is_active);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_positions_department ON positions(department_id);
CREATE INDEX idx_positions_active ON positions(is_active);
CREATE INDEX idx_positions_level ON positions(position_level);
CREATE INDEX idx_banks_code ON banks(bank_code);
CREATE INDEX idx_banks_active ON banks(is_active);
CREATE INDEX idx_bank_branches_bank ON bank_branches(bank_id);

-- User management indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role_id);
CREATE INDEX idx_user_profiles_department ON user_profiles(department_id);
CREATE INDEX idx_user_profiles_employee ON user_profiles(employee_id);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX idx_user_activity_log_user ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_date ON user_activity_log(created_at);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

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
CREATE POLICY "Authenticated users can view departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage departments" ON departments FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view positions" ON positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage positions" ON positions FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view banks" ON banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage banks" ON banks FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view bank_branches" ON bank_branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bank_branches" ON bank_branches FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view user_roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage user_roles" ON user_roles FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view user_permissions" ON user_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view user_profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage user_profiles" ON user_profiles FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view user_activity_log" ON user_activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert user_activity_log" ON user_activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banks_updated_at BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_branches_updated_at BEFORE UPDATE ON bank_branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();