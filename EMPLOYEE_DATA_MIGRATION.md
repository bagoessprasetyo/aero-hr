# Employee Data Migration Guide

## 🎯 **Overview**

This guide walks you through migrating existing employee data from text-based fields (like `department: "Information Technology"`) to foreign key references (like `department_id: uuid`). This transformation enables the dynamic master data system to work with existing employee records.

## 📋 **Migration Process**

### **Prerequisites**
1. ✅ Master data tables created (`departments`, `positions`, `banks`)
2. ✅ Master data populated with initial data
3. ✅ Forms updated to use dynamic master data
4. 🔄 **Current Step**: Migrate existing employee data

## 🗺️ **Migration Strategy**

### **3-Step Safe Migration Process**

#### **Step 1: Basic Data Mapping**
- Adds foreign key columns to employees table
- Maps existing text data to master data IDs
- Creates backup of original data
- Reports unmatched data for review

#### **Step 2: Handle Unmatched Data**
- Creates master data entries for unmatched employee data
- Assigns all employees to proper master data references
- Uses intelligent defaults for missing data

#### **Step 3: Add Constraints & Finalize**
- Adds foreign key constraints
- Creates optimized views and functions
- Adds performance indexes
- Finalizes the migration

## 🚀 **Running the Migration**

### **Step 1: Execute Basic Migration**

```sql
-- In Supabase SQL Editor, run:
-- Copy and paste contents from: lib/database/migrations/migrate-employee-data-step1.sql
```

**What this does:**
- Creates backup table (`employees_migration_backup`)
- Adds foreign key columns (`department_id`, `position_id`, `bank_id`)
- Maps existing data using exact matches, case-insensitive matches, and code matches
- Shows unmatched data for review

**Expected Results:**
- Most employees get proper foreign key references
- Reports show any unmatched departments, positions, or banks
- No data is lost (backup created)

### **Step 2: Handle Unmatched Data**

```sql
-- In Supabase SQL Editor, run:
-- Copy and paste contents from: lib/database/migrations/migrate-employee-data-step2.sql
```

**What this does:**
- Creates master data entries for unmatched employee data
- Creates "Unassigned" department for employees without departments
- Creates generic positions for departments without positions
- Assigns intelligent position levels based on title keywords
- Ensures 100% data coverage

**Expected Results:**
- All employees have `department_id`, `position_id`, and `bank_id`
- New master data entries created for previously unmatched data
- No employees left without proper references

### **Step 3: Finalize Migration**

```sql
-- In Supabase SQL Editor, run:
-- Copy and paste contents from: lib/database/migrations/migrate-employee-data-step3.sql
```

**What this does:**
- Adds foreign key constraints for data integrity
- Sets NOT NULL constraints on required fields
- Creates optimized `employee_details` view
- Adds performance indexes
- Creates API compatibility functions

**Expected Results:**
- Database enforces referential integrity
- Optimized performance for employee queries
- Backwards-compatible API functions
- Complete migration with full data integrity

## 📊 **Migration Verification**

### **After Each Step, Verify:**

#### **Step 1 Verification:**
```sql
-- Check migration progress
SELECT 
    'Total Employees' as metric,
    COUNT(*) as count
FROM employees
UNION ALL
SELECT 
    'Employees with Department ID' as metric,
    COUNT(*) as count
FROM employees WHERE department_id IS NOT NULL
UNION ALL
SELECT 
    'Employees with Position ID' as metric,
    COUNT(*) as count
FROM employees WHERE position_id IS NOT NULL;
```

#### **Step 2 Verification:**
```sql
-- Should return 0 (all employees have references)
SELECT COUNT(*) as employees_missing_references
FROM employees 
WHERE department_id IS NULL 
OR position_id IS NULL 
OR bank_id IS NULL;
```

#### **Step 3 Verification:**
```sql
-- Test the new employee view
SELECT * FROM employee_details LIMIT 5;

-- Verify foreign key constraints exist
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'employees' 
AND constraint_type = 'FOREIGN KEY';
```

## 🔄 **Data Mapping Examples**

### **Department Mapping:**
```
"Information Technology" → departments.id (where department_name = "Information Technology")
"IT" → departments.id (where department_code = "IT")
"human resources" → departments.id (case-insensitive match)
```

### **Position Mapping:**
```
"Senior Developer" → positions.id (where position_title = "Senior Developer" AND department matches)
"software engineer" → positions.id (case-insensitive within same department)
```

### **Bank Mapping:**
```
"BCA" → banks.id (where bank_code = "BCA" OR bank_short_name = "BCA")
"Bank Central Asia" → banks.id (where bank_name = "Bank Central Asia")
```

## 🛠️ **Intelligent Defaults**

### **Position Level Assignment:**
- **Level 1**: Junior, Assistant, Entry-level
- **Level 2**: Regular positions (default)
- **Level 3**: Senior, Lead positions
- **Level 4**: Manager, Head positions  
- **Level 5**: Director, Executive positions

### **Unmatched Data Handling:**
- **Departments**: Creates with auto-generated codes
- **Positions**: Creates with appropriate level based on title
- **Banks**: Creates with shortened codes
- **Fallbacks**: "Unassigned" department, generic staff positions

## 🔒 **Safety Features**

### **Data Protection:**
- ✅ **Complete Backup**: Original data backed up before migration
- ✅ **Non-Destructive**: Original text fields preserved during migration
- ✅ **Rollback Ready**: Can restore from backup if needed
- ✅ **Validation**: Extensive pre-migration checks

### **Rollback Process:**
```sql
-- If migration needs to be rolled back:
DROP TABLE employees;
ALTER TABLE employees_migration_backup RENAME TO employees;
```

## 📈 **Post-Migration Benefits**

### **Immediate Benefits:**
- ✅ **Dynamic Forms**: Employee forms now use live master data
- ✅ **Data Consistency**: No more typos in department/position names
- ✅ **Admin Control**: HR can manage departments/positions through UI
- ✅ **Referential Integrity**: Database prevents invalid references

### **Enhanced Capabilities:**
- 🚀 **Hierarchical Departments**: Parent-child relationships
- 🚀 **Position Levels**: Structured job levels with salary ranges
- 🚀 **Bank Integration**: Complete bank details with SWIFT codes
- 🚀 **Reporting**: Rich master data for advanced reporting

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **Issue**: "No departments found" error
**Solution**: Run master data migration first (`add-master-data-tables.sql`)

#### **Issue**: Many unmatched departments/positions
**Solution**: 
1. Review unmatched data in Step 1 output
2. Add missing master data through admin interface
3. Re-run Step 1 migration

#### **Issue**: Foreign key constraint errors
**Solution**: Ensure Steps 1 and 2 completed successfully before Step 3

### **Data Quality Checks:**
```sql
-- Find employees with potential data issues
SELECT id, full_name, department, position_title, bank_name
FROM employees 
WHERE department IS NULL 
OR position_title IS NULL 
OR bank_name IS NULL;

-- Check for duplicate employee IDs
SELECT employee_id, COUNT(*) 
FROM employees 
GROUP BY employee_id 
HAVING COUNT(*) > 1;
```

## ✅ **Success Indicators**

After completing all 3 steps:

- [ ] All employees have `department_id`, `position_id`, `bank_id`
- [ ] Foreign key constraints are active
- [ ] `employee_details` view returns complete data
- [ ] Employee forms work with dynamic master data
- [ ] No referential integrity violations
- [ ] Performance indexes created
- [ ] Migration backup exists for rollback

## 🎉 **Next Steps**

After successful migration:

1. **Test Employee Forms**: Verify add/edit employee forms work correctly
2. **Review Master Data**: Clean up auto-created master data entries through admin interface
3. **Performance Testing**: Test employee queries and reporting
4. **Optional Cleanup**: Remove legacy text columns after thorough testing
5. **User Training**: Train HR staff on new master data management features

The employee data migration transforms your system from static, hardcoded values to a fully dynamic, admin-manageable master data system! 🚀