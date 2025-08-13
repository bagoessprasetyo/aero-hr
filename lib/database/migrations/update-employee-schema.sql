-- Migration: Update Employee Schema to Use Master Data Foreign Keys
-- Run this SQL in your Supabase SQL Editor to update employee table structure

-- =============================================================================
-- BACKUP EXISTING DATA
-- =============================================================================

-- Create backup table for existing employee data
CREATE TABLE IF NOT EXISTS employees_backup AS 
SELECT * FROM employees;

-- =============================================================================
-- ADD NEW FOREIGN KEY COLUMNS
-- =============================================================================

-- Add new columns with foreign key references
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id),
ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES banks(id),
ADD COLUMN IF NOT EXISTS bank_branch_id UUID REFERENCES bank_branches(id);

-- =============================================================================
-- MIGRATE EXISTING DATA
-- =============================================================================

-- Update department_id based on existing department text
UPDATE employees 
SET department_id = d.id
FROM departments d
WHERE employees.department = d.department_name
AND employees.department_id IS NULL;

-- Update position_id based on existing position_title text
UPDATE employees 
SET position_id = p.id
FROM positions p
WHERE employees.position_title = p.position_title
AND employees.position_id IS NULL;

-- Update bank_id based on existing bank_name text (if bank_name field exists)
-- Note: This assumes bank_name matches one of our master banks
UPDATE employees 
SET bank_id = b.id
FROM banks b
WHERE employees.bank_name = b.bank_name
AND employees.bank_id IS NULL;

-- For employees without matching departments, create a default "Unassigned" department
INSERT INTO departments (department_code, department_name, department_description, is_active, display_order)
SELECT 'UNASSIGNED', 'Unassigned', 'Temporary department for employees without assigned department', true, 999
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'UNASSIGNED');

-- Assign unmatched employees to Unassigned department
UPDATE employees 
SET department_id = (SELECT id FROM departments WHERE department_code = 'UNASSIGNED')
WHERE department_id IS NULL;

-- For employees without matching positions, create default positions
INSERT INTO positions (position_code, position_title, position_description, department_id, position_level, is_active, display_order)
SELECT 
    'UNASSIGNED-' || UPPER(REPLACE(employees.position_title, ' ', '-')),
    employees.position_title,
    'Migrated position from existing data',
    (SELECT id FROM departments WHERE department_code = 'UNASSIGNED'),
    1,
    true,
    999
FROM employees 
WHERE position_id IS NULL 
AND position_title IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM positions 
    WHERE position_title = employees.position_title
)
GROUP BY employees.position_title;

-- Now assign positions to employees
UPDATE employees 
SET position_id = p.id
FROM positions p
WHERE employees.position_title = p.position_title
AND employees.position_id IS NULL;

-- Set default bank if none specified (use BCA as default)
UPDATE employees 
SET bank_id = (SELECT id FROM banks WHERE bank_code = 'BCA' LIMIT 1)
WHERE bank_id IS NULL;

-- =============================================================================
-- VALIDATE DATA MIGRATION
-- =============================================================================

-- Check for any employees still without proper foreign key references
SELECT 
    'Employees without department_id' as issue,
    COUNT(*) as count
FROM employees 
WHERE department_id IS NULL

UNION ALL

SELECT 
    'Employees without position_id' as issue,
    COUNT(*) as count
FROM employees 
WHERE position_id IS NULL

UNION ALL

SELECT 
    'Employees without bank_id' as issue,
    COUNT(*) as count
FROM employees 
WHERE bank_id IS NULL;

-- =============================================================================
-- ADD CONSTRAINTS (After data migration)
-- =============================================================================

-- Make the foreign key columns NOT NULL after migration
-- Note: Do this only after confirming all employees have been assigned proper references
-- Uncomment these after verifying the migration was successful:

-- ALTER TABLE employees ALTER COLUMN department_id SET NOT NULL;
-- ALTER TABLE employees ALTER COLUMN position_id SET NOT NULL;
-- ALTER TABLE employees ALTER COLUMN bank_id SET NOT NULL;

-- =============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_bank_id ON employees(bank_id);
CREATE INDEX IF NOT EXISTS idx_employees_bank_branch_id ON employees(bank_branch_id);

-- =============================================================================
-- UPDATE VIEWS AND FUNCTIONS (Optional)
-- =============================================================================

-- Create a view for easy employee data access with master data
CREATE OR REPLACE VIEW employee_details AS
SELECT 
    e.*,
    d.department_name,
    d.department_code,
    p.position_title,
    p.position_code,
    p.position_level,
    p.min_salary,
    p.max_salary,
    b.bank_name,
    b.bank_short_name,
    b.bank_code,
    bb.branch_name,
    bb.branch_code
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN banks b ON e.bank_id = b.id
LEFT JOIN bank_branches bb ON e.bank_branch_id = bb.id;

-- =============================================================================
-- CLEANUP (Run only after confirming migration success)
-- =============================================================================

-- After confirming the migration was successful, you can:
-- 1. Drop the old text columns (uncomment below):

/*
ALTER TABLE employees DROP COLUMN IF EXISTS department;
ALTER TABLE employees DROP COLUMN IF EXISTS position_title;
ALTER TABLE employees DROP COLUMN IF EXISTS bank_name;
*/

-- 2. Drop the backup table (uncomment below):
/*
DROP TABLE IF EXISTS employees_backup;
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify the migration results
SELECT 
    'Total employees' as metric,
    COUNT(*) as value
FROM employees

UNION ALL

SELECT 
    'Employees with departments' as metric,
    COUNT(*) as value
FROM employees e
INNER JOIN departments d ON e.department_id = d.id

UNION ALL

SELECT 
    'Employees with positions' as metric,
    COUNT(*) as value
FROM employees e
INNER JOIN positions p ON e.position_id = p.id

UNION ALL

SELECT 
    'Employees with banks' as metric,
    COUNT(*) as value
FROM employees e
INNER JOIN banks b ON e.bank_id = b.id;

-- Show department distribution
SELECT 
    d.department_name,
    COUNT(e.id) as employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.department_name
ORDER BY employee_count DESC;

-- Show position distribution
SELECT 
    p.position_title,
    d.department_name,
    COUNT(e.id) as employee_count
FROM positions p
LEFT JOIN employees e ON p.id = e.position_id
LEFT JOIN departments d ON p.department_id = d.id
GROUP BY p.id, p.position_title, d.department_name
ORDER BY employee_count DESC;