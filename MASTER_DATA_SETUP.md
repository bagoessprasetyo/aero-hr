# Master Data & User Management Setup Guide

## 🎯 **Overview**

This guide will help you set up the comprehensive master data and user management system for Aero HR. This transforms the system from using hardcoded values to a fully dynamic, enterprise-ready platform.

## 📋 **What You'll Get**

### ✅ **Master Data Management**
- **Departments**: Hierarchical structure with codes, descriptions, department heads
- **Positions**: Job titles linked to departments with salary ranges and levels
- **Banks**: Indonesian bank master data with branches and SWIFT codes
- **Referential Integrity**: Employee records now reference master data instead of free text

### ✅ **User Management System**
- **Role-Based Access Control**: Super Admin, HR Admin, HR Manager, HR Staff, Viewer roles
- **Granular Permissions**: Module-level permissions (create, read, update, delete, manage, export)
- **User Profiles**: Extended user data with department assignment and activity tracking
- **Audit Trail**: Complete user activity logging

## 🚀 **Setup Instructions**

### **Step 1: Run Database Migrations**

#### **1.1 Add Master Data Tables**
```sql
-- In Supabase SQL Editor, run this migration:
-- Copy contents from: lib/database/migrations/add-master-data-tables.sql
```

#### **1.2 Update Employee Schema** 
```sql
-- In Supabase SQL Editor, run this migration:
-- Copy contents from: lib/database/migrations/update-employee-schema.sql
```

### **Step 2: Verify Database Setup**

After running the migrations, verify in Supabase:

```sql
-- Check if all tables were created
SELECT tablename FROM pg_tables 
WHERE tablename IN (
    'departments', 'positions', 'banks', 'bank_branches',
    'user_roles', 'user_permissions', 'role_permissions', 
    'user_profiles', 'user_activity_log'
)
ORDER BY tablename;

-- Check default data was inserted
SELECT 'departments' as table_name, COUNT(*) FROM departments
UNION ALL SELECT 'positions', COUNT(*) FROM positions
UNION ALL SELECT 'banks', COUNT(*) FROM banks
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles;
```

### **Step 3: Restart Development Server**

```bash
npm run dev
```

## 📊 **Default Data Included**

### **Departments**
- Information Technology (IT)
- Human Resources (HR) 
- Finance & Accounting (FIN)
- Operations (OPS)
- Marketing (MKT)
- Sales (SALES)

### **Positions**
- Junior Developer, Senior Developer, Tech Lead (IT)
- HR Specialist, HR Manager (HR)
- Financial Analyst, Finance Manager (FIN)

### **Banks** (Indonesian Banks)
- BCA, BRI, BNI, Mandiri
- CIMB Niaga, Danamon, Permata, BTN

### **User Roles & Permissions**
- **Super Admin**: Full system access
- **HR Admin**: HR operations + admin functions
- **HR Manager**: HR management with approvals
- **HR Staff**: Basic HR operations
- **Finance Manager**: Financial operations
- **Employee**: Self-service access
- **Viewer**: Read-only access

## 🔧 **Configuration Options**

### **Environment Variables**
No additional environment variables required - uses existing Supabase config.

### **Role-Based Access Control**
The system automatically enforces permissions based on user roles. Default roles cover most scenarios, but you can:

1. **Create Custom Roles**: Add new roles with specific permission combinations
2. **Modify Permissions**: Adjust which modules each role can access
3. **Department-Level Access**: Restrict users to their assigned departments

## 🎛️ **Admin Interface**

### **Master Data Management**
Access via the Admin section in the sidebar:
- **Department Management**: Create, edit, organize department hierarchy
- **Position Management**: Define job positions with salary ranges
- **Bank Management**: Maintain bank data and branches

### **User Management**
- **User Administration**: Create/manage user accounts
- **Role Management**: Define custom roles and permissions
- **Activity Monitoring**: Track user actions and login history

## 🔄 **Data Migration Notes**

### **Employee Data Migration**
The migration script automatically:
1. **Backs up existing employee data**
2. **Maps text fields to master data references**
3. **Creates "Unassigned" categories for unmatched data**
4. **Preserves all existing employee information**

### **Rollback Options**
If needed, you can rollback using the backup:
```sql
-- Restore from backup (only if migration fails)
DROP TABLE employees;
ALTER TABLE employees_backup RENAME TO employees;
```

## 🏗️ **Architecture Changes**

### **Database Changes**
- **New Tables**: 9 new tables for master data and user management
- **Foreign Keys**: Employee table now uses IDs instead of text
- **Indexes**: Optimized for fast lookups and joins
- **Views**: `employee_details` view for easy data access

### **Service Layer**
- **MasterDataService**: Complete CRUD for all master data
- **UserManagementService**: User administration and permissions
- **Validation**: Code uniqueness and referential integrity checks

### **Type System**
- **Master Data Types**: Complete TypeScript definitions
- **Request/Response Types**: Structured API interfaces
- **Filter Types**: Advanced querying capabilities

## 🔒 **Security Features**

### **Row Level Security (RLS)**
- All new tables have RLS enabled
- Policies restrict access to authenticated users
- Future enhancement: Role-based data filtering

### **Permission System**
- Granular module-level permissions
- Action-type permissions (create, read, update, delete, manage, export)
- Automatic permission checking in services

### **Audit Trail**
- Complete user activity logging
- IP address and user agent tracking
- Module-level action tracking

## 🧪 **Testing the Setup**

### **1. Verify Master Data**
```typescript
// Test in browser console or component
const masterDataService = new MasterDataService();
const departments = await masterDataService.getActiveDepartments();
console.log('Departments:', departments);
```

### **2. Test User Management**
```typescript
const userService = new UserManagementService();
const roles = await userService.getActiveRoles();
console.log('Available roles:', roles);
```

### **3. Check Permissions**
```typescript
const hasPermission = await userService.hasPermission(userId, 'employees.create');
console.log('Can create employees:', hasPermission);
```

## 📈 **Next Steps**

### **Immediate Actions**
1. ✅ Run both database migrations
2. ✅ Verify all tables and data exist
3. ✅ Restart development server
4. ✅ Test basic functionality

### **Next Development Phase**
1. **UI Components**: Build CRUD interfaces for master data
2. **Form Updates**: Replace hardcoded dropdowns with dynamic data
3. **User Management UI**: Create admin interfaces for user management
4. **Permission Integration**: Add role checks to existing components

## 🆘 **Troubleshooting**

### **Migration Issues**
```sql
-- Check for migration errors
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Verify foreign key constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('employees', 'positions', 'user_profiles');
```

### **Permission Issues**
- Ensure RLS policies are properly set
- Check if user has correct role assignment
- Verify permission assignments to roles

### **Data Issues**
```sql
-- Check for orphaned references
SELECT id, full_name FROM employees WHERE department_id IS NULL;
SELECT id, full_name FROM employees WHERE position_id IS NULL;
```

## 🎉 **Success Indicators**

✅ **Database**: All 9 new tables created with default data  
✅ **Employees**: All employees have department_id and position_id  
✅ **Services**: Master data and user management services working  
✅ **Types**: No TypeScript errors with new types  
✅ **Authentication**: User profiles and roles functioning  

The system is now ready for dynamic master data management and comprehensive user administration! 🚀