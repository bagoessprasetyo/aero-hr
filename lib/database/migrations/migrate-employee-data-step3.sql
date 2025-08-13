-- Step 3: Add Foreign Key Constraints and Finalize Migration
-- This migration adds proper foreign key constraints and cleans up the schema
-- Run this AFTER steps 1 and 2, and after verifying all employees have proper references

-- =============================================================================
-- PRE-MIGRATION VALIDATION
-- =============================================================================

-- Verify all employees have required foreign key references
DO $$
DECLARE
    missing_depts INTEGER;
    missing_positions INTEGER;
    missing_banks INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_depts FROM employees WHERE department_id IS NULL;
    SELECT COUNT(*) INTO missing_positions FROM employees WHERE position_id IS NULL;
    SELECT COUNT(*) INTO missing_banks FROM employees WHERE bank_id IS NULL;
    
    IF missing_depts > 0 THEN
        RAISE EXCEPTION 'Found % employees without department_id. Run steps 1 and 2 first.', missing_depts;
    END IF;
    
    IF missing_positions > 0 THEN
        RAISE EXCEPTION 'Found % employees without position_id. Run steps 1 and 2 first.', missing_positions;
    END IF;
    
    IF missing_banks > 0 THEN
        RAISE EXCEPTION 'Found % employees without bank_id. Run steps 1 and 2 first.', missing_banks;
    END IF;
    
    RAISE NOTICE 'All employees have proper foreign key references. Proceeding with constraints.';
END $$;

-- =============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Add foreign key constraint for department_id
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id);

-- Add foreign key constraint for position_id
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_position_id 
FOREIGN KEY (position_id) REFERENCES positions(id);

-- Add foreign key constraint for bank_id
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_bank_id 
FOREIGN KEY (bank_id) REFERENCES banks(id);

-- Add foreign key constraint for bank_branch_id (optional, can be NULL)
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_bank_branch_id 
FOREIGN KEY (bank_branch_id) REFERENCES bank_branches(id);

-- =============================================================================
-- SET NOT NULL CONSTRAINTS
-- =============================================================================

-- Make department_id NOT NULL (every employee must have a department)
ALTER TABLE employees 
ALTER COLUMN department_id SET NOT NULL;

-- Make position_id NOT NULL (every employee must have a position)
ALTER TABLE employees 
ALTER COLUMN position_id SET NOT NULL;

-- Make bank_id NOT NULL (every employee must have a bank for salary)
ALTER TABLE employees 
ALTER COLUMN bank_id SET NOT NULL;

-- bank_branch_id can remain NULL (not all banks have specific branches)

-- =============================================================================
-- CREATE UPDATED EMPLOYEE VIEW
-- =============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS employee_details;

-- Create comprehensive view with all master data relationships
CREATE VIEW employee_details AS
SELECT 
    e.id,
    e.employee_id,
    e.full_name,
    e.nik,
    e.npwp,
    e.address,
    e.phone,
    e.email,
    e.join_date,
    e.employment_status,
    e.employee_status,
    e.bank_account_number,
    e.ptkp_status,
    e.bpjs_health_enrolled,
    e.bpjs_manpower_enrolled,
    e.created_at,
    e.updated_at,
    
    -- Department information
    d.id as department_id,
    d.department_code,
    d.department_name,
    d.department_description,
    
    -- Position information
    p.id as position_id,
    p.position_code,
    p.position_title,
    p.position_description,
    p.position_level,
    p.min_salary,
    p.max_salary,
    p.required_skills,
    
    -- Bank information
    b.id as bank_id,
    b.bank_code,
    b.bank_name,
    b.bank_short_name,
    b.swift_code,
    
    -- Bank branch information (if available)
    bb.id as bank_branch_id,
    bb.branch_code,
    bb.branch_name,
    bb.branch_address,
    
    -- Legacy text fields (for backwards compatibility during transition)
    e.department as legacy_department,
    e.position_title as legacy_position_title,
    e.bank_name as legacy_bank_name
    
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
INNER JOIN positions p ON e.position_id = p.id
INNER JOIN banks b ON e.bank_id = b.id
LEFT JOIN bank_branches bb ON e.bank_branch_id = bb.id;

-- =============================================================================
-- UPDATE EMPLOYEE SERVICE COMPATIBILITY
-- =============================================================================

-- Create a function to get employee with master data for API compatibility
CREATE OR REPLACE FUNCTION get_employee_with_master_data(emp_id UUID)
RETURNS TABLE (
    id UUID,
    employee_id TEXT,
    full_name TEXT,
    nik TEXT,
    npwp TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    join_date DATE,
    employment_status TEXT,
    employee_status TEXT,
    bank_account_number TEXT,
    ptkp_status TEXT,
    bpjs_health_enrolled BOOLEAN,
    bpjs_manpower_enrolled BOOLEAN,
    -- Master data fields
    department_name TEXT,
    position_title TEXT,
    bank_name TEXT,
    -- Additional master data
    department_code TEXT,
    position_level INTEGER,
    bank_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ed.id,
        ed.employee_id,
        ed.full_name,
        ed.nik,
        ed.npwp,
        ed.address,
        ed.phone,
        ed.email,
        ed.join_date,
        ed.employment_status,
        ed.employee_status,
        ed.bank_account_number,
        ed.ptkp_status,
        ed.bpjs_health_enrolled,
        ed.bpjs_manpower_enrolled,
        ed.department_name,
        ed.position_title,
        ed.bank_name,
        ed.department_code,
        ed.position_level,
        ed.bank_code,
        ed.created_at,
        ed.updated_at
    FROM employee_details ed
    WHERE ed.id = emp_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_dept_position ON employees(department_id, position_id);
CREATE INDEX IF NOT EXISTS idx_employees_status_active ON employees(employee_status) WHERE employee_status = 'active';
CREATE INDEX IF NOT EXISTS idx_employees_join_date ON employees(join_date);

-- Add indexes on master data tables for lookups
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_positions_dept_active ON positions(department_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_banks_active ON banks(is_active) WHERE is_active = true;

-- =============================================================================
-- MIGRATION COMPLETION REPORT
-- =============================================================================

SELECT 'MIGRATION COMPLETED SUCCESSFULLY' as status;

-- Final statistics
SELECT 
    'Database Schema' as category,
    'Foreign Key Constraints Added' as detail,
    '4 constraints' as value

UNION ALL

SELECT 
    'Database Schema' as category,
    'NOT NULL Constraints Added' as detail,
    '3 constraints' as value

UNION ALL

SELECT 
    'Performance' as category,
    'Indexes Created' as detail,
    COUNT(*)::text || ' indexes' as value
FROM pg_indexes 
WHERE tablename = 'employees' 
AND indexname LIKE 'idx_employees_%'

UNION ALL

SELECT 
    'Data Integrity' as category,
    'Employee Records Migrated' as detail,
    COUNT(*)::text || ' employees' as value
FROM employees

UNION ALL

SELECT 
    'Views & Functions' as category,
    'employee_details view' as detail,
    'Created' as value

UNION ALL

SELECT 
    'Views & Functions' as category,
    'get_employee_with_master_data function' as detail,
    'Created' as value;

-- Verify constraint integrity
SELECT 
    'Constraint Verification' as category,
    constraint_name as detail,
    'ACTIVE' as value
FROM information_schema.table_constraints 
WHERE table_name = 'employees' 
AND constraint_type = 'FOREIGN KEY'
AND constraint_name LIKE 'fk_employees_%';

-- =============================================================================
-- POST-MIGRATION CLEANUP (OPTIONAL)
-- =============================================================================

/*
OPTIONAL: Remove legacy text columns after verifying everything works correctly

-- Remove old text columns (UNCOMMENT AFTER TESTING)
-- ALTER TABLE employees DROP COLUMN IF EXISTS department;
-- ALTER TABLE employees DROP COLUMN IF EXISTS position_title;
-- ALTER TABLE employees DROP COLUMN IF EXISTS bank_name;

-- Drop migration backup (UNCOMMENT AFTER CONFIRMING MIGRATION SUCCESS)
-- DROP TABLE IF EXISTS employees_migration_backup;

-- To verify the migration worked correctly, test these queries:

-- 1. Check all employees have proper references
SELECT COUNT(*) FROM employees WHERE department_id IS NULL OR position_id IS NULL OR bank_id IS NULL;
-- Should return 0

-- 2. Test the employee_details view
SELECT * FROM employee_details LIMIT 5;

-- 3. Test the API compatibility function
SELECT * FROM get_employee_with_master_data((SELECT id FROM employees LIMIT 1));

-- 4. Verify foreign key constraints
SELECT * FROM employees e WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.id = e.department_id);
-- Should return no rows
*/