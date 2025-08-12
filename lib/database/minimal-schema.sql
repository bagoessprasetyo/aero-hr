-- Minimal Schema for Aero HR - Essential Tables Only
-- Run this in Supabase SQL Editor to get started quickly

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 1. App Configuration Table (Essential for system settings)
CREATE TABLE IF NOT EXISTS app_configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert essential configuration values
INSERT INTO app_configuration (key, value, description) VALUES
    ('ptkp_tk0', '54000000', 'PTKP for TK/0 status (yearly)'),
    ('ptkp_k0', '58500000', 'PTKP for K/0 status (yearly)'),
    ('ptkp_k1', '63000000', 'PTKP for K/1 status (yearly)'),
    ('occupational_cost_max_yearly', '6000000', 'Maximum occupational cost deduction per year'),
    ('bpjs_health_employee_rate', '1', 'BPJS Health employee contribution rate (%)'),
    ('bpjs_health_company_rate', '4', 'BPJS Health company contribution rate (%)')
ON CONFLICT (key) DO NOTHING;

-- 2. Employees Table (Core employee data)
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    npwp TEXT,
    email TEXT,
    
    -- Employment Information
    position_title TEXT NOT NULL,
    department TEXT NOT NULL,
    join_date DATE NOT NULL,
    employment_status TEXT NOT NULL DEFAULT 'permanent' CHECK (employment_status IN ('permanent', 'contract')),
    employee_status TEXT NOT NULL DEFAULT 'active' CHECK (employee_status IN ('active', 'resigned', 'terminated')),
    
    -- Financial Information
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    ptkp_status TEXT NOT NULL DEFAULT 'TK/0' CHECK (ptkp_status IN ('TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3')),
    
    -- BPJS Enrollment
    bpjs_health_enrolled BOOLEAN DEFAULT false,
    bpjs_manpower_enrolled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Salary Components Table
CREATE TABLE IF NOT EXISTS salary_components (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employee_status);
CREATE INDEX IF NOT EXISTS idx_salary_components_employee ON salary_components(employee_id);

-- Enable Row Level Security
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to read app_configuration" ON app_configuration;
    DROP POLICY IF EXISTS "Allow authenticated users to manage employees" ON employees;
    DROP POLICY IF EXISTS "Allow authenticated users to manage salary_components" ON salary_components;
    
    -- Create new policies
    CREATE POLICY "Allow authenticated users to read app_configuration" ON app_configuration FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated users to manage employees" ON employees FOR ALL TO authenticated USING (true);
    CREATE POLICY "Allow authenticated users to manage salary_components" ON salary_components FOR ALL TO authenticated USING (true);
END $$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_salary_components_updated_at ON salary_components;
DROP TRIGGER IF EXISTS update_app_configuration_updated_at ON app_configuration;

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salary_components_updated_at BEFORE UPDATE ON salary_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_configuration_updated_at BEFORE UPDATE ON app_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample employee for testing
INSERT INTO employees (
    employee_id, full_name, nik, npwp, email,
    position_title, department, join_date,
    bank_name, bank_account_number, ptkp_status,
    bpjs_health_enrolled, bpjs_manpower_enrolled
) VALUES (
    'EMP001', 'John Doe', '1234567890123456', '123456789012345', 'john.doe@company.com',
    'Software Engineer', 'IT', '2024-01-01',
    'BCA', '1234567890', 'TK/0',
    true, true
) ON CONFLICT (employee_id) DO NOTHING;

-- Insert basic salary for sample employee
INSERT INTO salary_components (employee_id, component_name, component_type, amount)
SELECT id, 'Basic Salary', 'basic_salary', 10000000
FROM employees WHERE employee_id = 'EMP001'
ON CONFLICT (employee_id, component_name) DO NOTHING;

-- Verify tables were created
SELECT 'Tables created successfully!' as status;