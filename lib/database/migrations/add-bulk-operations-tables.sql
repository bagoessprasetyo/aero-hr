-- Migration: Add Bulk Operations Tables
-- Run this SQL in your Supabase SQL Editor to add the missing tables

-- Salary Component History Table (for audit trail)
CREATE TABLE IF NOT EXISTS salary_component_history (
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
CREATE TABLE IF NOT EXISTS employee_change_log (
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
CREATE TABLE IF NOT EXISTS bulk_salary_operations (
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
CREATE TABLE IF NOT EXISTS bulk_salary_operation_items (
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
CREATE TABLE IF NOT EXISTS salary_review_schedule (
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
CREATE TABLE IF NOT EXISTS compliance_audit_log (
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
CREATE INDEX IF NOT EXISTS idx_salary_component_history_employee ON salary_component_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_component_history_date ON salary_component_history(effective_date);
CREATE INDEX IF NOT EXISTS idx_employee_change_log_employee ON employee_change_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_change_log_date ON employee_change_log(change_date);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_salary_operations(operation_status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_type ON bulk_salary_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_date ON bulk_salary_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_items_bulk_op ON bulk_salary_operation_items(bulk_operation_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_items_employee ON bulk_salary_operation_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_review_schedule_employee ON salary_review_schedule(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_review_schedule_date ON salary_review_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_log_type ON compliance_audit_log(audit_type);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_log_date ON compliance_audit_log(generated_at);

-- Enable Row Level Security for new tables
ALTER TABLE salary_component_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_salary_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_salary_operation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables (allowing authenticated users to manage all operations)
-- In production, you might want more restrictive policies based on user roles

-- Salary Component History policies
DROP POLICY IF EXISTS "Authenticated users can view salary_component_history" ON salary_component_history;
DROP POLICY IF EXISTS "Authenticated users can manage salary_component_history" ON salary_component_history;
CREATE POLICY "Authenticated users can view salary_component_history" ON salary_component_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage salary_component_history" ON salary_component_history FOR ALL TO authenticated USING (true);

-- Employee Change Log policies
DROP POLICY IF EXISTS "Authenticated users can view employee_change_log" ON employee_change_log;
DROP POLICY IF EXISTS "Authenticated users can manage employee_change_log" ON employee_change_log;
CREATE POLICY "Authenticated users can view employee_change_log" ON employee_change_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage employee_change_log" ON employee_change_log FOR ALL TO authenticated USING (true);

-- Bulk Salary Operations policies
DROP POLICY IF EXISTS "Authenticated users can view bulk_salary_operations" ON bulk_salary_operations;
DROP POLICY IF EXISTS "Authenticated users can manage bulk_salary_operations" ON bulk_salary_operations;
CREATE POLICY "Authenticated users can view bulk_salary_operations" ON bulk_salary_operations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bulk_salary_operations" ON bulk_salary_operations FOR ALL TO authenticated USING (true);

-- Bulk Salary Operation Items policies
DROP POLICY IF EXISTS "Authenticated users can view bulk_salary_operation_items" ON bulk_salary_operation_items;
DROP POLICY IF EXISTS "Authenticated users can manage bulk_salary_operation_items" ON bulk_salary_operation_items;
CREATE POLICY "Authenticated users can view bulk_salary_operation_items" ON bulk_salary_operation_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bulk_salary_operation_items" ON bulk_salary_operation_items FOR ALL TO authenticated USING (true);

-- Salary Review Schedule policies
DROP POLICY IF EXISTS "Authenticated users can view salary_review_schedule" ON salary_review_schedule;
DROP POLICY IF EXISTS "Authenticated users can manage salary_review_schedule" ON salary_review_schedule;
CREATE POLICY "Authenticated users can view salary_review_schedule" ON salary_review_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage salary_review_schedule" ON salary_review_schedule FOR ALL TO authenticated USING (true);

-- Compliance Audit Log policies
DROP POLICY IF EXISTS "Authenticated users can view compliance_audit_log" ON compliance_audit_log;
DROP POLICY IF EXISTS "Authenticated users can manage compliance_audit_log" ON compliance_audit_log;
CREATE POLICY "Authenticated users can view compliance_audit_log" ON compliance_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage compliance_audit_log" ON compliance_audit_log FOR ALL TO authenticated USING (true);

-- Create updated_at trigger for salary_review_schedule if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_salary_review_schedule_updated_at') THEN
        CREATE TRIGGER update_salary_review_schedule_updated_at 
        BEFORE UPDATE ON salary_review_schedule 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verify tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'salary_component_history',
    'employee_change_log', 
    'bulk_salary_operations',
    'bulk_salary_operation_items',
    'salary_review_schedule',
    'compliance_audit_log'
)
ORDER BY tablename;