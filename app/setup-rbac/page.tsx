"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Database, Play } from 'lucide-react'

export default function SetupRBACPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  
  const supabase = createClient()

  const steps = [
    { name: 'Create user_roles table', status: 'pending' },
    { name: 'Create user_permissions table', status: 'pending' },
    { name: 'Create user_profiles table', status: 'pending' },
    { name: 'Create role_permissions table', status: 'pending' },
    { name: 'Create user_activity_logs table', status: 'pending' },
    { name: 'Insert default roles', status: 'pending' },
    { name: 'Insert default permissions', status: 'pending' },
    { name: 'Setup role permissions', status: 'pending' }
  ]

  const runMigration = async () => {
    setLoading(true)
    setResults([])
    setErrors([])
    setStep(0)

    const migrations = [
      {
        name: 'Create user_roles table',
        sql: `
          CREATE TABLE IF NOT EXISTS user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            role_name TEXT UNIQUE NOT NULL,
            role_description TEXT,
            is_active BOOLEAN DEFAULT true,
            is_system_role BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'Create user_permissions table',
        sql: `
          CREATE TABLE IF NOT EXISTS user_permissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            permission_name TEXT UNIQUE NOT NULL,
            module_name TEXT NOT NULL,
            action_type TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'Create user_profiles table',
        sql: `
          CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role_id UUID REFERENCES user_roles(id),
            department_id UUID,
            employee_id UUID,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'Create role_permissions table',
        sql: `
          CREATE TABLE IF NOT EXISTS role_permissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
            permission_id UUID NOT NULL REFERENCES user_permissions(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(role_id, permission_id)
          );
        `
      },
      {
        name: 'Create user_activity_logs table',
        sql: `
          CREATE TABLE IF NOT EXISTS user_activity_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            action_description TEXT NOT NULL,
            resource_type TEXT,
            resource_id UUID,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ]

    const dataInserts = [
      {
        name: 'Insert default roles',
        action: async () => {
          const { error } = await supabase
            .from('user_roles')
            .upsert([
              { role_name: 'Super Admin', role_description: 'Full system access with all permissions', is_system_role: true },
              { role_name: 'HR Admin', role_description: 'HR administration with employee and payroll management', is_system_role: false },
              { role_name: 'HR Staff', role_description: 'Basic HR operations with limited access', is_system_role: false },
              { role_name: 'Payroll Admin', role_description: 'Payroll processing and reporting', is_system_role: false },
              { role_name: 'Employee', role_description: 'Basic employee self-service access', is_system_role: false }
            ], { onConflict: 'role_name' })
          return error
        }
      },
      {
        name: 'Insert default permissions',
        action: async () => {
          const { error } = await supabase
            .from('user_permissions')
            .upsert([
              { permission_name: 'employees.create', module_name: 'employees', action_type: 'create', description: 'Create new employee records' },
              { permission_name: 'employees.read', module_name: 'employees', action_type: 'read', description: 'View employee information' },
              { permission_name: 'employees.update', module_name: 'employees', action_type: 'update', description: 'Edit employee records' },
              { permission_name: 'employees.delete', module_name: 'employees', action_type: 'delete', description: 'Delete employee records' },
              { permission_name: 'employees.export', module_name: 'employees', action_type: 'export', description: 'Export employee data' },
              
              { permission_name: 'payroll.create', module_name: 'payroll', action_type: 'create', description: 'Create payroll periods' },
              { permission_name: 'payroll.read', module_name: 'payroll', action_type: 'read', description: 'View payroll information' },
              { permission_name: 'payroll.update', module_name: 'payroll', action_type: 'update', description: 'Edit payroll calculations' },
              { permission_name: 'payroll.manage', module_name: 'payroll', action_type: 'manage', description: 'Process and finalize payroll' },
              { permission_name: 'payroll.export', module_name: 'payroll', action_type: 'export', description: 'Export payroll reports' },
              
              { permission_name: 'bulk_operations.create', module_name: 'bulk_operations', action_type: 'create', description: 'Create bulk operations' },
              { permission_name: 'bulk_operations.read', module_name: 'bulk_operations', action_type: 'read', description: 'View bulk operations' },
              { permission_name: 'bulk_operations.manage', module_name: 'bulk_operations', action_type: 'manage', description: 'Execute bulk operations' },
              { permission_name: 'bulk_operations.export', module_name: 'bulk_operations', action_type: 'export', description: 'Export bulk operation results' },
              
              { permission_name: 'reports.read', module_name: 'reports', action_type: 'read', description: 'View system reports' },
              { permission_name: 'reports.export', module_name: 'reports', action_type: 'export', description: 'Export reports and analytics' },
              
              { permission_name: 'admin.create', module_name: 'admin', action_type: 'create', description: 'Create system configuration' },
              { permission_name: 'admin.read', module_name: 'admin', action_type: 'read', description: 'View administration panels' },
              { permission_name: 'admin.update', module_name: 'admin', action_type: 'update', description: 'Edit system configuration' },
              { permission_name: 'admin.delete', module_name: 'admin', action_type: 'delete', description: 'Delete system configuration' },
              { permission_name: 'admin.manage', module_name: 'admin', action_type: 'manage', description: 'Manage users and permissions' }
            ], { onConflict: 'permission_name' })
          return error
        }
      },
      {
        name: 'Setup role permissions',
        action: async () => {
          // Get all permissions for Super Admin
          const { data: allPermissions } = await supabase
            .from('user_permissions')
            .select('id')
          
          const { data: superAdminRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('role_name', 'Super Admin')
            .single()

          if (allPermissions && superAdminRole) {
            const rolePermissions = allPermissions.map(p => ({
              role_id: superAdminRole.id,
              permission_id: p.id
            }))

            const { error } = await supabase
              .from('role_permissions')
              .upsert(rolePermissions, { onConflict: 'role_id,permission_id' })
            
            return error
          }
          return null
        }
      }
    ]

    try {
      // Run table creation migrations
      for (let i = 0; i < migrations.length; i++) {
        setStep(i)
        const migration = migrations[i]
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: migration.sql })
          if (error) throw error
          
          setResults(prev => [...prev, `✅ ${migration.name}`])
        } catch (error: any) {
          const errorMsg = `❌ ${migration.name}: ${error.message}`
          setErrors(prev => [...prev, errorMsg])
          throw new Error(errorMsg)
        }
      }

      // Run data inserts
      for (let i = 0; i < dataInserts.length; i++) {
        setStep(migrations.length + i)
        const insert = dataInserts[i]
        
        try {
          const error = await insert.action()
          if (error) throw error
          
          setResults(prev => [...prev, `✅ ${insert.name}`])
        } catch (error: any) {
          const errorMsg = `❌ ${insert.name}: ${error.message}`
          setErrors(prev => [...prev, errorMsg])
          // Don't throw for data inserts, continue with next
        }
      }

      setResults(prev => [...prev, '🎉 RBAC setup completed successfully!'])
      
    } catch (error: any) {
      setErrors(prev => [...prev, `Migration failed: ${error.message}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">RBAC Setup</h1>
        <p className="text-muted-foreground">
          Set up Role-Based Access Control system for Aero HR
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Migration Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((stepItem, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded">
                {index < step ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : index === step && loading ? (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                <span className={index <= step ? 'font-medium' : 'text-muted-foreground'}>
                  {stepItem.name}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!loading && results.length === 0 && errors.length === 0 && (
              <div className="text-center py-8">
                <Button onClick={runMigration} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Run RBAC Setup
                </Button>
              </div>
            )}
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono p-2 bg-green-50 text-green-800 rounded">
                  {result}
                </div>
              ))}
              {errors.map((error, index) => (
                <div key={index} className="text-sm font-mono p-2 bg-red-50 text-red-800 rounded">
                  {error}
                </div>
              ))}
            </div>
            
            {loading && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  Running migration step {step + 1} of {steps.length}...
                </div>
              </div>
            )}
            
            {!loading && (results.length > 0 || errors.length > 0) && (
              <div className="mt-4 pt-4 border-t">
                <Button onClick={() => window.location.href = '/admin'} className="w-full">
                  Go to Admin Panel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>What this migration does:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Creates user_roles, user_permissions, user_profiles, role_permissions, and user_activity_logs tables</li>
              <li>Inserts default roles: Super Admin, HR Admin, HR Staff, Payroll Admin, Employee</li>
              <li>Inserts permissions for employees, payroll, bulk operations, reports, and admin modules</li>
              <li>Assigns all permissions to Super Admin role</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}