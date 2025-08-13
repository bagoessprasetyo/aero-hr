"use client"

import { useState } from 'react'
import { TaxConfig } from '@/components/admin/tax-config'
import { DepartmentManagement } from '@/components/admin/department-management'
import { PositionManagement } from '@/components/admin/position-management'
import { BankManagement } from '@/components/admin/bank-management'
import { UserManagement } from '@/components/admin/user-management'
import { PermissionManager } from '@/components/rbac/permission-manager'
import { ProtectedRoute } from '@/components/rbac/protected-route'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  Briefcase, 
  Landmark, 
  Settings, 
  UserCog,
  Database,
  Shield
} from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    // <ProtectedRoute permission="admin.read">
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground">
            Manage master data, user accounts, and system configuration
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Database className="h-4 w-4 mr-1" />
          Master Data System
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="banks" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Banks
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Master Data</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3 Tables</div>
                <p className="text-xs text-muted-foreground">
                  Departments, Positions, Banks
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RBAC Ready</div>
                <p className="text-xs text-muted-foreground">
                  Role-based access control
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('departments')}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Manage Departments</div>
                        <div className="text-sm text-muted-foreground">Add, edit, organize departments</div>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserCog className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">User Administration</div>
                        <div className="text-sm text-muted-foreground">Create accounts, assign roles</div>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('positions')}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Position Management</div>
                        <div className="text-sm text-muted-foreground">Define job positions and levels</div>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Current system status and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <Badge variant="outline" className="text-green-600">Connected</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Master Data</span>
                    <Badge variant="outline" className="text-blue-600">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">User Management</span>
                    <Badge variant="outline" className="text-blue-600">RBAC Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Audit Trail</span>
                    <Badge variant="outline" className="text-green-600">Logging</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="positions">
          <PositionManagement />
        </TabsContent>

        <TabsContent value="banks">
          <BankManagement />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionManager />
        </TabsContent>

        <TabsContent value="system">
          <TaxConfig />
        </TabsContent>
      </Tabs>
      </div>
    // </ProtectedRoute>
  )
}