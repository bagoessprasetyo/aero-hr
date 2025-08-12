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