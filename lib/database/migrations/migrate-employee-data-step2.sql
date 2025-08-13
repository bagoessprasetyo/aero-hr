-- Step 2: Handle Unmatched Employee Data
-- This migration creates master data entries for unmatched employee data
-- Run this AFTER step 1 migration and reviewing unmatched data

-- =============================================================================
-- CREATE MASTER DATA FOR UNMATCHED DEPARTMENTS
-- =============================================================================

-- Create "Unassigned" department for employees without departments
INSERT INTO departments (department_code, department_name, department_description, is_active, display_order)
SELECT 'UNASSIGNED', 'Unassigned', 'Temporary department for employees without assigned department', true, 999
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'UNASSIGNED');

-- Create departments for unmatched department names
INSERT INTO departments (department_code, department_name, department_description, is_active, display_order)
SELECT 
    UPPER(REPLACE(REPLACE(e.department, ' ', ''), '&', 'AND')) as department_code,
    e.department as department_name,
    'Migrated from existing employee data' as department_description,
    true as is_active,
    500 as display_order
FROM (
    SELECT DISTINCT department
    FROM employees 
    WHERE department_id IS NULL 
    AND department IS NOT NULL
    AND department != ''
) e
WHERE NOT EXISTS (
    SELECT 1 FROM departments 
    WHERE department_name = e.department 
    OR LOWER(department_name) = LOWER(e.department)
);

-- Update employees with newly created departments
UPDATE employees 
SET department_id = d.id
FROM departments d
WHERE employees.department = d.department_name
AND employees.department_id IS NULL;

-- Assign remaining employees without departments to "Unassigned"
UPDATE employees 
SET department_id = (SELECT id FROM departments WHERE department_code = 'UNASSIGNED')
WHERE department_id IS NULL;

-- =============================================================================
-- CREATE MASTER DATA FOR UNMATCHED BANKS
-- =============================================================================

-- Create banks for unmatched bank names
INSERT INTO banks (bank_code, bank_name, bank_short_name, is_active, display_order)
SELECT 
    UPPER(REPLACE(REPLACE(e.bank_name, ' ', ''), '.', '')) as bank_code,
    e.bank_name as bank_name,
    UPPER(LEFT(REPLACE(e.bank_name, ' ', ''), 8)) as bank_short_name,
    true as is_active,
    500 as display_order
FROM (
    SELECT DISTINCT bank_name
    FROM employees 
    WHERE bank_id IS NULL 
    AND bank_name IS NOT NULL
    AND bank_name != ''
) e
WHERE NOT EXISTS (
    SELECT 1 FROM banks 
    WHERE bank_name = e.bank_name 
    OR LOWER(bank_name) = LOWER(e.bank_name)
);

-- Update employees with newly created banks
UPDATE employees 
SET bank_id = b.id
FROM banks b
WHERE employees.bank_name = b.bank_name
AND employees.bank_id IS NULL;

-- Set default bank for employees without bank (use first available bank)
UPDATE employees 
SET bank_id = (SELECT id FROM banks WHERE is_active = true ORDER BY display_order LIMIT 1)
WHERE bank_id IS NULL;

-- =============================================================================
-- CREATE MASTER DATA FOR UNMATCHED POSITIONS
-- =============================================================================

-- Create positions for unmatched position titles (assign to their respective departments)
INSERT INTO positions (position_code, position_title, position_description, department_id, position_level, is_active, display_order)
SELECT 
    UPPER(REPLACE(REPLACE(e.position_title, ' ', '-'), '&', 'AND')) as position_code,
    e.position_title as position_title,
    'Migrated from existing employee data' as position_description,
    e.department_id as department_id,
    CASE 
        WHEN LOWER(e.position_title) LIKE '%senior%' OR LOWER(e.position_title) LIKE '%lead%' THEN 3
        WHEN LOWER(e.position_title) LIKE '%junior%' OR LOWER(e.position_title) LIKE '%assistant%' THEN 1
        WHEN LOWER(e.position_title) LIKE '%manager%' OR LOWER(e.position_title) LIKE '%head%' THEN 4
        WHEN LOWER(e.position_title) LIKE '%director%' THEN 5
        ELSE 2
    END as position_level,
    true as is_active,
    500 as display_order
FROM (
    SELECT DISTINCT position_title, department_id
    FROM employees 
    WHERE position_id IS NULL 
    AND position_title IS NOT NULL
    AND position_title != ''
    AND department_id IS NOT NULL
) e
WHERE NOT EXISTS (
    SELECT 1 FROM positions 
    WHERE position_title = e.position_title 
    AND department_id = e.department_id
);

-- Update employees with newly created positions
UPDATE employees 
SET position_id = p.id
FROM positions p
WHERE employees.position_title = p.position_title
AND employees.department_id = p.department_id
AND employees.position_id IS NULL;

-- Create generic positions for employees in departments that still don't have positions
INSERT INTO positions (position_code, position_title, position_description, department_id, position_level, is_active, display_order)
SELECT 
    d.department_code || '-STAFF' as position_code,
    d.department_name || ' Staff' as position_title,
    'Generic staff position for ' || d.department_name as position_description,
    d.id as department_id,
    2 as position_level,
    true as is_active,
    999 as display_order
FROM departments d
WHERE EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.department_id = d.id 
    AND e.position_id IS NULL
)
AND NOT EXISTS (
    SELECT 1 FROM positions p 
    WHERE p.department_id = d.id 
    AND p.position_title = d.department_name || ' Staff'
);

-- Assign remaining employees to generic positions
UPDATE employees 
SET position_id = p.id
FROM positions p
INNER JOIN departments d ON p.department_id = d.id
WHERE employees.department_id = d.id
AND employees.position_id IS NULL
AND p.position_title = d.department_name || ' Staff';

-- =============================================================================
-- FINAL VERIFICATION AND REPORTING
-- =============================================================================

SELECT 'STEP 2 MIGRATION COMPLETE' as report_section;

-- Final migration status
SELECT 
    'Total Employees' as metric,
    COUNT(*) as count,
    '100%' as coverage
FROM employees

UNION ALL

SELECT 
    'Employees with Department ID' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 1) || '%' as coverage
FROM employees 
WHERE department_id IS NOT NULL

UNION ALL

SELECT 
    'Employees with Position ID' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 1) || '%' as coverage
FROM employees 
WHERE position_id IS NOT NULL

UNION ALL

SELECT 
    'Employees with Bank ID' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 1) || '%' as coverage
FROM employees 
WHERE bank_id IS NOT NULL;

-- Show newly created master data
SELECT 'NEWLY CREATED MASTER DATA' as report_section;

SELECT 'New Departments' as type, COUNT(*) as count
FROM departments 
WHERE department_description = 'Migrated from existing employee data'
OR department_code = 'UNASSIGNED'

UNION ALL

SELECT 'New Positions' as type, COUNT(*) as count
FROM positions 
WHERE position_description = 'Migrated from existing employee data'
OR position_description LIKE 'Generic staff position%'

UNION ALL

SELECT 'New Banks' as type, COUNT(*) as count
FROM banks 
WHERE display_order = 500;

-- =============================================================================
-- NEXT STEPS
-- =============================================================================

/*
After running this migration:

1. All employees should now have department_id, position_id, and bank_id references
2. Review the newly created master data entries
3. Clean up and organize the master data through the admin interface:
   - Update department codes and descriptions
   - Adjust position levels and salary ranges
   - Verify bank information
4. Run step 3 migration to add foreign key constraints
5. Optional: Remove old text columns after verifying everything works

To check data integrity:
SELECT * FROM employees WHERE department_id IS NULL OR position_id IS NULL OR bank_id IS NULL;
*/