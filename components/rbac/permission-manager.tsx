"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserManagementService } from '@/lib/services/user-management'
import type { UserRole, UserPermission } from '@/lib/types/master-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import {
  Shield,
  Key,
  Plus,
  Edit,
  Trash2,
  Users,
  Settings,
  Save,
  Copy
} from 'lucide-react'

const userManagementService = new UserManagementService()
const supabase = createClient()

// Permission matrix organized by module
const PERMISSION_MODULES = {
  employees: {
    name: 'Employee Management',
    description: 'Manage employee records and data',
    actions: ['create', 'read', 'update', 'delete', 'export']
  },
  payroll: {
    name: 'Payroll Processing',
    description: 'Handle payroll calculations and processing',
    actions: ['create', 'read', 'update', 'manage', 'export']
  },
  bulk_operations: {
    name: 'Bulk Operations',
    description: 'Perform bulk salary and data operations',
    actions: ['create', 'read', 'manage', 'export']
  },
  reports: {
    name: 'Reports & Analytics',
    description: 'Access and generate system reports',
    actions: ['read', 'export']
  },
  admin: {
    name: 'Administration',
    description: 'System administration and configuration',
    actions: ['create', 'read', 'update', 'delete', 'manage']
  }
}

export function PermissionManager() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<UserRole[]>([])
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [rolePermissions, setRolePermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [tablesExist, setTablesExist] = useState(true)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [newRole, setNewRole] = useState({
    role_name: '',
    role_description: '',
    is_active: true
  })

  // Load roles and permissions
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesResponse, permissionsResponse] = await Promise.all([
        userManagementService.getUserRoles(),
        userManagementService.getUserPermissions()
      ])
      
      setRoles(rolesResponse.data)
      setPermissions(permissionsResponse.data)
      
      // Select first role by default
      if (rolesResponse.data.length > 0) {
        await selectRole(rolesResponse.data[0])
      }
      setTablesExist(true)
    } catch (error: any) {
      console.error('Error loading data:', error)
      
      // Check if error is due to missing tables
      if (error?.code === 'PGRST106' || error?.message?.includes('relation') || error?.message?.includes('table')) {
        setTablesExist(false)
        toast({ 
          type: 'error', 
          title: 'User management tables not found',
          description: 'Please run the database migration first'
        })
      } else {
        toast({ type: 'error', title: 'Failed to load permission data' })
      }
    } finally {
      setLoading(false)
    }
  }

  // Select a role and load its permissions
  const selectRole = async (role: UserRole) => {
    try {
      setSelectedRole(role)
      const permissions = await userManagementService.getUserPermissionsByRole(role.id)
      setRolePermissions(permissions)
    } catch (error) {
      console.error('Error loading role permissions:', error)
      toast({ type: 'error', title: 'Failed to load role permissions' })
    }
  }

  // Toggle permission for selected role
  const togglePermission = async (permission: UserPermission, enabled: boolean) => {
    if (!selectedRole) return

    try {
      if (enabled) {
        // Add permission - insert into role_permissions
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role_id: selectedRole.id,
            permission_id: permission.id
          })
        
        if (error && !error.message?.includes('duplicate')) {
          throw error
        }
      } else {
        // Remove permission - delete from role_permissions
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', selectedRole.id)
          .eq('permission_id', permission.id)
        
        if (error) throw error
      }

      // Refresh role permissions
      await selectRole(selectedRole)
      
      toast({ 
        type: 'success', 
        title: `Permission ${enabled ? 'granted' : 'revoked'} successfully` 
      })
    } catch (error) {
      console.error('Error updating permission:', error)
      toast({ type: 'error', title: 'Failed to update permission' })
    }
  }

  // Create new role
  const createRole = async () => {
    try {
      await userManagementService.createUserRole({
        ...newRole,
        permission_ids: []
      })
      
      setIsCreateRoleOpen(false)
      setNewRole({ role_name: '', role_description: '', is_active: true })
      await loadData()
      
      toast({ type: 'success', title: 'Role created successfully' })
    } catch (error) {
      console.error('Error creating role:', error)
      toast({ type: 'error', title: 'Failed to create role' })
    }
  }

  // Copy permissions from another role
  const copyPermissions = async (fromRoleId: string) => {
    if (!selectedRole) return

    try {
      const sourcePermissions = await userManagementService.getUserPermissionsByRole(fromRoleId)
      const permissionIds = sourcePermissions.map(p => p.id)

      await userManagementService.updateUserRole({
        id: selectedRole.id,
        permission_ids: permissionIds
      })

      await selectRole(selectedRole)
      toast({ type: 'success', title: 'Permissions copied successfully' })
    } catch (error) {
      console.error('Error copying permissions:', error)
      toast({ type: 'error', title: 'Failed to copy permissions' })
    }
  }

  // Check if role has specific permission
  const hasPermission = (permissionId: string): boolean => {
    return rolePermissions.some(p => p.id === permissionId)
  }

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module_name
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(permission)
    return acc
  }, {} as Record<string, UserPermission[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading permissions...</div>
      </div>
    )
  }

  if (!tablesExist) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">User Management Tables Not Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The user roles and permissions tables haven't been created yet. 
            Please run the database migration to set up the RBAC system.
          </p>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-left max-w-2xl mx-auto">
              <h4 className="font-medium mb-2">To set up user management:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to your Supabase Dashboard → SQL Editor</li>
                <li>Copy the SQL from <code>lib/database/migrations/add-user-management-tables.sql</code></li>
                <li>Paste and execute the SQL query</li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permission Management</h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new user role with custom permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={newRole.role_name}
                  onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
                  placeholder="e.g., HR Coordinator"
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={newRole.role_description}
                  onChange={(e) => setNewRole({ ...newRole, role_description: e.target.value })}
                  placeholder="Role description..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createRole}>Create Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Roles
            </CardTitle>
            <CardDescription>
              Select a role to manage its permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole?.id === role.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => selectRole(role)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{role.role_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {role.role_description}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={role.is_active ? "default" : "secondary"}>
                      {role.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {role.is_system_role && (
                      <Badge variant="outline" className="text-xs">
                        System
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Permissions for {selectedRole?.role_name}
                </CardTitle>
                <CardDescription>
                  Manage what this role can access and perform
                </CardDescription>
              </div>
              {selectedRole && !selectedRole.is_system_role && (
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy From
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Copy Permissions</DialogTitle>
                        <DialogDescription>
                          Copy permissions from another role to {selectedRole.role_name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        {roles
                          .filter(r => r.id !== selectedRole.id)
                          .map((role) => (
                            <Button
                              key={role.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => copyPermissions(role.id)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Copy from {role.role_name}
                            </Button>
                          ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <div className="space-y-6">
                {Object.entries(PERMISSION_MODULES).map(([moduleKey, moduleInfo]) => {
                  const modulePermissions = groupedPermissions[moduleKey] || []
                  
                  return (
                    <div key={moduleKey} className="space-y-3">
                      <div>
                        <h4 className="font-medium">{moduleInfo.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {moduleInfo.description}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {moduleInfo.actions.map((action) => {
                          const permission = modulePermissions.find(p => p.action_type === action)
                          const isEnabled = permission ? hasPermission(permission.id) : false
                          const isDisabled = selectedRole.is_system_role
                          
                          return (
                            <div
                              key={`${moduleKey}-${action}`}
                              className="flex items-center space-x-2 p-2 rounded border"
                            >
                              <Checkbox
                                id={`${moduleKey}-${action}`}
                                checked={isEnabled}
                                disabled={isDisabled || !permission}
                                onCheckedChange={(checked) => {
                                  if (permission) {
                                    togglePermission(permission, !!checked)
                                  }
                                }}
                              />
                              <label
                                htmlFor={`${moduleKey}-${action}`}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                  !permission ? 'text-muted-foreground' : ''
                                }`}
                              >
                                {action}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                
                {selectedRole.is_system_role && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <Shield className="h-4 w-4 inline mr-1" />
                      This is a system role. Permissions cannot be modified.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a role to manage its permissions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}