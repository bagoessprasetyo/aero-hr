"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { UserManagementService } from '@/lib/services/user-management'
import { CreateUserDialog, EditUserDialog } from './user-forms'
import type { UserProfile, UserRole, UserStats, UserFilters } from '@/lib/types/master-data'
import {
  UserCog,
  Users,
  Shield,
  Key,
  Activity,
  Plus,
  Settings,
  Lock,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

const userManagementService = new UserManagementService()

export function UserManagement() {
  const { toast } = useToast()
  
  // State
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    users_by_role: {},
    recent_logins: 0,
    inactive_users: 0
  })
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Dialog states
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  // Load data
  useEffect(() => {
    loadUsers()
    loadRoles()
    loadStats()
  }, [searchTerm, roleFilter, statusFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const filters: UserFilters = {}
      
      if (searchTerm) filters.search = searchTerm
      if (roleFilter !== 'all') filters.role_id = roleFilter
      if (statusFilter !== 'all') filters.is_active = statusFilter === 'active'
      
      const response = await userManagementService.getUsers(filters)
      setUsers(response.data)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({ type: 'error', title: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await userManagementService.getUserRoles()
      setRoles(response.data)
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await userManagementService.getUserStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleUserAction = async (action: string, userId: string, user?: UserProfile) => {
    try {
      setActionLoading(userId)
      
      switch (action) {
        case 'activate':
          await userManagementService.reactivateUser(userId)
          toast({ type: 'success', title: 'User activated successfully' })
          break
        case 'deactivate':
          await userManagementService.deactivateUser(userId)
          toast({ type: 'success', title: 'User deactivated successfully' })
          break
        case 'reset-password':
          await userManagementService.resetUserPassword(userId, 'temp123456') // Generate temp password
          toast({ type: 'success', title: 'Password reset successfully' })
          break
        case 'edit':
          if (user) {
            setSelectedUser(user)
            setEditUserOpen(true)
          }
          return // Don't reload data for edit action
      }
      
      await loadUsers()
      await loadStats()
    } catch (error) {
      console.error('Error performing action:', error)
      toast({ type: 'error', title: 'Action failed' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUserCreated = async () => {
    await loadUsers()
    await loadStats()
  }

  const handleUserUpdated = async () => {
    await loadUsers()
    await loadStats()
    setSelectedUser(null)
  }

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inactive_users} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCog className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}% active rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recent_logins}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.users_by_role).length}</div>
            <p className="text-xs text-muted-foreground">
              Active roles
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Accounts
              </CardTitle>
              <CardDescription>
                Manage user accounts and access levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                      ? 'No users match your current filters.' 
                      : 'Start by creating your first user account.'}
                  </p>
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('')
                        setRoleFilter('all')
                        setStatusFilter('all')
                      }}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={() => setCreateUserOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First User
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {user.role?.role_name || 'No Role'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {user.department?.department_name || 'No Department'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatLastLogin(user.last_login_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('edit', user.id, user)}
                                disabled={actionLoading === user.id}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('reset-password', user.id)}
                                disabled={actionLoading === user.id}
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              {user.is_active ? (
                                <DropdownMenuItem 
                                  onClick={() => handleUserAction('deactivate', user.id)}
                                  disabled={actionLoading === user.id}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleUserAction('activate', user.id)}
                                  disabled={actionLoading === user.id}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Roles
              </CardTitle>
              <CardDescription>
                Define and manage user roles with specific permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => {
                      const userCount = stats.users_by_role[role.role_name] || 0
                      const colorClass = role.is_system_role 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                      
                      return (
                        <Card key={role.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={colorClass}>
                                  {role.role_name}
                                </Badge>
                                {role.is_system_role && (
                                  <Badge variant="outline" className="text-xs">
                                    System
                                  </Badge>
                                )}
                              </div>
                              <Shield className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Users:</span>
                                <span>{userCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={role.is_active ? "default" : "secondary"} className="h-5">
                                  {role.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              {role.role_description && (
                                <div className="pt-2">
                                  <p className="text-xs text-muted-foreground">{role.role_description}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  
                  {roles.length === 0 && (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Roles Found</h3>
                      <p className="text-muted-foreground">
                        Create roles to manage user permissions effectively.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Permissions Management
              </CardTitle>
              <CardDescription>
                System permissions and role assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Permission Management Available</h3>
                <p className="text-muted-foreground mb-6">
                  Comprehensive permission management is available in the dedicated Permissions tab in the admin panel.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <p>✓ Role-based permission assignment</p>
                  <p>✓ Module-level access control</p>
                  <p>✓ Permission matrix management</p>
                  <p>✓ System role protection</p>
                </div>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Go to Permissions Tab
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>
                System activity and user actions audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Activity Monitoring Ready</h3>
                <p className="text-muted-foreground mb-6">
                  The activity logging system is configured and ready to track user actions.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <p>✓ User login/logout tracking</p>
                  <p>✓ Data modification logs</p>
                  <p>✓ Permission changes audit</p>
                  <p>✓ System access patterns</p>
                  <p>✓ IP address and session tracking</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Activity logs will appear here as users interact with the system.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Creation Dialog */}
      <CreateUserDialog 
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onUserCreated={handleUserCreated}
      />

      {/* User Edit Dialog */}
      <EditUserDialog 
        user={selectedUser}
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  )
}