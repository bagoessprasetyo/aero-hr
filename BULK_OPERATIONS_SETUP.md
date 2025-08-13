# Bulk Operations Database Setup

## Issue Fixed
The error "Could not find the table 'public.bulk_salary_operations' in the schema cache" occurs because the bulk operations tables haven't been created in your database yet.

## Solution: Run Database Migration

### Step 1: Access Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Copy the entire contents of the file: `lib/database/migrations/add-bulk-operations-tables.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the migration

### Step 3: Verify Tables Created
After running the migration, you should see the following new tables in your database:

- ✅ `salary_component_history` - Tracks all salary component changes
- ✅ `employee_change_log` - Summary view of employee changes  
- ✅ `bulk_salary_operations` - Main bulk operations table
- ✅ `bulk_salary_operation_items` - Individual items in bulk operations
- ✅ `salary_review_schedule` - Salary review scheduling
- ✅ `compliance_audit_log` - Compliance and audit logging

### Step 4: Test the Bulk Operations
1. Restart your development server: `npm run dev`
2. Navigate to the Bulk Operations page
3. Try creating a bulk operation - the error should be resolved!

## What the Migration Does

The migration adds:

### 🗄️ **Database Tables**
- **Audit Trail System**: Complete tracking of salary changes
- **Bulk Operations Engine**: Execute mass salary adjustments
- **Compliance Logging**: Track exports and operations for compliance
- **Review Scheduling**: Plan and track salary reviews

### 🔒 **Security & Permissions**
- Row Level Security (RLS) enabled on all new tables
- Policies allowing authenticated users to manage operations
- Proper indexes for optimal query performance

### 📊 **Features Enabled**
- ✅ Real bulk salary operations (not just UI mockups)
- ✅ Operation history and analytics
- ✅ Template management and reuse
- ✅ Rollback functionality
- ✅ Comprehensive audit trail
- ✅ Progress tracking and error handling

## Alternative: Full Schema Reset

If you prefer to start fresh with the complete updated schema:

1. **Backup your data** (if you have important data)
2. In Supabase SQL Editor, run the complete schema from: `lib/database/schema.sql`
3. This will create all tables including the new bulk operations tables

## Troubleshooting

### If you get permission errors:
- Make sure you're running the SQL as the project owner
- Check that RLS policies are correctly applied

### If tables already exist:
- The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times
- Existing data will not be affected

### If you need to start over:
```sql
-- Only run this if you want to remove the bulk operations tables
DROP TABLE IF EXISTS bulk_salary_operation_items CASCADE;
DROP TABLE IF EXISTS bulk_salary_operations CASCADE;
DROP TABLE IF EXISTS salary_component_history CASCADE;
DROP TABLE IF EXISTS employee_change_log CASCADE;
DROP TABLE IF EXISTS salary_review_schedule CASCADE;
DROP TABLE IF EXISTS compliance_audit_log CASCADE;
```

## Next Steps

After running the migration:

1. **Test Bulk Operations**: Create a test bulk operation with a few employees
2. **Explore Analytics**: Check the analytics dashboard for insights
3. **Create Templates**: Save common operation configurations
4. **Review History**: Examine the operation history and audit trail

The bulk operations module is now fully functional with real database integration! 🎉