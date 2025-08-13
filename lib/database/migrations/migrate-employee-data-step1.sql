-- Step 1: Migrate Employee Data to Master Data References
-- This migration safely transforms existing employee text fields to foreign key references
-- Run this AFTER ensuring master data tables are populated

-- =============================================================================
-- SAFETY CHECKS AND BACKUP
-- =============================================================================

-- Create backup of current employee data
CREATE TABLE IF NOT EXISTS employees_migration_backup AS 
SELECT * FROM employees;

-- Verify master data exists before migration
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM departments) = 0 THEN
        RAISE EXCEPTION 'No departments found. Please run master data migration first.';
    END IF;
    
    IF (SELECT COUNT(*) FROM positions) = 0 THEN
        RAISE EXCEPTION 'No positions found. Please run master data migration first.';
    END IF;
    
    IF (SELECT COUNT(*) FROM banks) = 0 THEN
        RAISE EXCEPTION 'No banks found. Please run master data migration first.';
    END IF;
    
    RAISE NOTICE 'Master data validation passed. Proceeding with migration.';
END $$;

-- =============================================================================
-- ADD FOREIGN KEY COLUMNS (IF NOT EXISTS)
-- =============================================================================

-- Add new foreign key columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS position_id UUID,
ADD COLUMN IF NOT EXISTS bank_id UUID,
ADD COLUMN IF NOT EXISTS bank_branch_id UUID;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_bank_id ON employees(bank_id);

-- =============================================================================
-- MIGRATION STEP 1: DEPARTMENTS
-- =============================================================================

-- Update department_id for exact matches
UPDATE employees 
SET department_id = d.id
FROM departments d
WHERE employees.department = d.department_name
AND employees.department_id IS NULL;

-- Update department_id for case-insensitive matches
UPDATE employees 
SET department_id = d.id
FROM departments d
WHERE LOWER(employees.department) = LOWER(d.department_name)
AND employees.department_id IS NULL;

-- Update department_id using department codes
UPDATE employees 
SET department_id = d.id
FROM departments d
WHERE UPPER(employees.department) = UPPER(d.department_code)
AND employees.department_id IS NULL;

-- Show departments that couldn't be matched
SELECT 
    employees.department as unmatched_department,
    COUNT(*) as employee_count
FROM employees 
WHERE department_id IS NULL 
AND department IS NOT NULL
GROUP BY employees.department
ORDER BY employee_count DESC;

-- =============================================================================
-- MIGRATION STEP 2: BANKS
-- =============================================================================

-- Update bank_id for exact matches
UPDATE employees 
SET bank_id = b.id
FROM banks b
WHERE employees.bank_name = b.bank_name
AND employees.bank_id IS NULL;

-- Update bank_id for case-insensitive matches
UPDATE employees 
SET bank_id = b.id
FROM banks b
WHERE LOWER(employees.bank_name) = LOWER(b.bank_name)
AND employees.bank_id IS NULL;

-- Update bank_id using bank codes
UPDATE employees 
SET bank_id = b.id
FROM banks b
WHERE UPPER(employees.bank_name) = UPPER(b.bank_code)
AND employees.bank_id IS NULL;

-- Update bank_id using short names
UPDATE employees 
SET bank_id = b.id
FROM banks b
WHERE UPPER(employees.bank_name) = UPPER(b.bank_short_name)
AND employees.bank_id IS NULL;

-- Show banks that couldn't be matched
SELECT 
    employees.bank_name as unmatched_bank,
    COUNT(*) as employee_count
FROM employees 
WHERE bank_id IS NULL 
AND bank_name IS NOT NULL
GROUP BY employees.bank_name
ORDER BY employee_count DESC;

-- =============================================================================
-- MIGRATION STEP 3: POSITIONS (REQUIRES DEPARTMENTS TO BE SET)
-- =============================================================================

-- Update position_id for exact matches within the same department
UPDATE employees 
SET position_id = p.id
FROM positions p
WHERE employees.position_title = p.position_title
AND employees.department_id = p.department_id
AND employees.position_id IS NULL;

-- Update position_id for case-insensitive matches within the same department
UPDATE employees 
SET position_id = p.id
FROM positions p
WHERE LOWER(employees.position_title) = LOWER(p.position_title)
AND employees.department_id = p.department_id
AND employees.position_id IS NULL;

-- Show positions that couldn't be matched
SELECT 
    e.position_title as unmatched_position,
    d.department_name as department,
    COUNT(*) as employee_count
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.position_id IS NULL 
AND e.position_title IS NOT NULL
GROUP BY e.position_title, d.department_name
ORDER BY employee_count DESC;

-- =============================================================================
-- MIGRATION SUMMARY REPORT
-- =============================================================================

SELECT 'MIGRATION SUMMARY' as report_section;

-- Overall migration status
SELECT 
    'Total Employees' as metric,
    COUNT(*) as count
FROM employees

UNION ALL

SELECT 
    'Employees with Department ID' as metric,
    COUNT(*) as count
FROM employees 
WHERE department_id IS NOT NULL

UNION ALL

SELECT 
    'Employees with Position ID' as metric,
    COUNT(*) as count
FROM employees 
WHERE position_id IS NOT NULL

UNION ALL

SELECT 
    'Employees with Bank ID' as metric,
    COUNT(*) as count
FROM employees 
WHERE bank_id IS NOT NULL

UNION ALL

SELECT 
    'Employees Missing Department' as metric,
    COUNT(*) as count
FROM employees 
WHERE department_id IS NULL

UNION ALL

SELECT 
    'Employees Missing Position' as metric,
    COUNT(*) as count
FROM employees 
WHERE position_id IS NULL

UNION ALL

SELECT 
    'Employees Missing Bank' as metric,
    COUNT(*) as count
FROM employees 
WHERE bank_id IS NULL;

-- =============================================================================
-- NEXT STEPS
-- =============================================================================

/*
After running this migration:

1. Review the unmatched departments, positions, and banks listed above
2. Either:
   a) Add missing master data entries through the admin interface
   b) Create temporary entries for unmatched data (see step 2 migration)
3. Run step 2 migration to handle remaining unmatched data
4. Verify all employees have proper foreign key references
5. Add foreign key constraints (step 3)

To rollback this migration if needed:
DROP TABLE employees;
ALTER TABLE employees_migration_backup RENAME TO employees;
*/