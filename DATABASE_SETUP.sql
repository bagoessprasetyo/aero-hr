-- COPY THIS ENTIRE CONTENT AND RUN IN SUPABASE SQL EDITOR
-- Aero HR Database Setup

-- 1. Create app_configuration table
CREATE TABLE IF NOT EXISTS app_configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    npwp TEXT,
    email TEXT,
    position_title TEXT NOT NULL,
    department TEXT NOT NULL,
    join_date DATE NOT NULL,
    employment_status TEXT NOT NULL DEFAULT 'permanent',
    employee_status TEXT NOT NULL DEFAULT 'active',
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    ptkp_status TEXT NOT NULL DEFAULT 'TK/0',
    bpjs_health_enrolled BOOLEAN DEFAULT false,
    bpjs_manpower_enrolled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create salary_components table
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, component_name)
);

-- 4. Enable Row Level Security
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for authenticated users
CREATE POLICY "Allow authenticated read app_configuration" ON app_configuration FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage employees" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage salary_components" ON salary_components FOR ALL TO authenticated USING (true);

-- 6. Insert basic configuration
INSERT INTO app_configuration (key, value, description) VALUES
    ('ptkp_tk0', '54000000', 'PTKP for TK/0 status'),
    ('bpjs_health_employee_rate', '1', 'BPJS Health employee rate')
ON CONFLICT (key) DO NOTHING;

-- 7. Insert sample employee for testing
INSERT INTO employees (
    employee_id, full_name, nik, npwp, email,
    position_title, department, join_date,
    bank_name, bank_account_number
) VALUES (
    'EMP001', 'Test Employee', '1234567890123456', '123456789012345', 'test@company.com',
    'Software Engineer', 'IT', '2024-01-01',
    'BCA', '1234567890'
) ON CONFLICT (employee_id) DO NOTHING;

-- Verification query
SELECT 'Database setup complete!' as message;