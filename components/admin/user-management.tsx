"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ProfessionalCard,
  ActionButton,
  EmptyState,
  StatusBadge
} from '@/components/ui/professional'
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
  RefreshCw,
  Download,
  Upload,
  X,
  ArrowUpDown,
  BarChart3,
  TrendingUp,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Star,
  Zap,
  Globe,
  Monitor,
  Smartphone,
  ChevronRight,
  Copy,
  Check,
  Building2
} from 'lucide-react'
import { Label } from '../ui/label'

const userManagementService = new UserManagementService()

interface ActivityLogEntry {
  id: string
  user_id: string
  action: string
  resource: string
  details: Record<string, any>
  created_at: string
  user: {
    full_name: string
    email: string
  }
}

interface EnhancedUserStats extends UserStats {
  user_growth: {
    monthly: number
    weekly: number
    daily: number
  }
  login_analytics: {
    today: number
    this_week: number
    this_month: number
    avg_session_duration: number
  }
  role_distribution: {
    [key: string]: {
      count: number
      percentage: number
      active_count: number
    }
  }
  device_analytics: {
    desktop: number
    mobile: number
    tablet: number
  }
}

export function UserManagement() {
  const { toast } = useToast()
  
  // State
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [stats, setStats] = useState<EnhancedUserStats>({
    total_users: 0,
    active_users: 0,
    users_by_role: {},
    recent_logins: 0,
    inactive_users: 0,
    user_growth: {
      monthly: 0,
      weekly: 0,
      daily: 0
    },
    login_analytics: {
      today: 0,
      this_week: 0,
      this_month: 0,
      avg_session_duration: 0
    },
    role_distribution: {},
    device_analytics: {
      desktop: 0,
      mobile: 0,
      tablet: 0
    }
  })
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // Enhanced filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [lastLoginFilter, setLastLoginFilter] = useState<string>('all')
  
  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Sort state
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'last_login' | 'created_at'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Dialog states
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [viewUserOpen, setViewUserOpen] = useState(false)

  // Enhanced filtering and sorting with useMemo for performance
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users]

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role_id === roleFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.is_active === (statusFilter === 'active'))
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department_id === departmentFilter)
    }

    if (lastLoginFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(user => {
        if (!user.last_login_at) return lastLoginFilter === 'never'
        
        const lastLogin = new Date(user.last_login_at)
        const diffInDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (lastLoginFilter) {
          case 'today': return diffInDays === 0
          case 'week': return diffInDays <= 7
          case 'month': return diffInDays <= 30
          case 'never': return !user.last_login_at
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.full_name.toLowerCase()
          bValue = b.full_name.toLowerCase()
          break
        case 'role':
          aValue = a.role?.role_name?.toLowerCase() || ''
          bValue = b.role?.role_name?.toLowerCase() || ''
          break
        case 'last_login':
          aValue = a.last_login_at ? new Date(a.last_login_at).getTime() : 0
          bValue = b.last_login_at ? new Date(b.last_login_at).getTime() : 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [users, searchTerm, roleFilter, statusFilter, departmentFilter, lastLoginFilter, sortBy, sortOrder])

  // Load data
  useEffect(() => {
    loadUsers()
    loadRoles()
    loadStats()
    loadActivityLog()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const filters: UserFilters = {}
      
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
      setStats(prevStats => ({
        ...prevStats,
        ...statsData,
        // Enhanced mock data for demo
        user_growth: {
          monthly: 12,
          weekly: 3,
          daily: 1
        },
        login_analytics: {
          today: 24,
          this_week: 89,
          this_month: 156,
          avg_session_duration: 45 // minutes
        },
        role_distribution: Object.keys(statsData.users_by_role).reduce((acc, roleName) => {
          const count = statsData.users_by_role[roleName]
          acc[roleName] = {
            count,
            percentage: statsData.total_users > 0 ? Math.round((count / statsData.total_users) * 100) : 0,
            active_count: Math.floor(count * 0.85) // Mock active count
          }
          return acc
        }, {} as any),
        device_analytics: {
          desktop: Math.floor(statsData.active_users * 0.6),
          mobile: Math.floor(statsData.active_users * 0.3),
          tablet: Math.floor(statsData.active_users * 0.1)
        }
      }))
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadActivityLog = async () => {
    try {
      // Mock activity log data
      const mockActivityLog: ActivityLogEntry[] = [
        {
          id: '1',
          user_id: 'user1',
          action: 'login',
          resource: 'system',
          details: { ip_address: '192.168.1.100', user_agent: 'Chrome/91.0' },
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          user: { full_name: 'John Doe', email: 'john@example.com' }
        },
        {
          id: '2',
          user_id: 'user2',
          action: 'update',
          resource: 'employee',
          details: { employee_id: 'EMP001', fields: ['salary', 'position'] },
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          user: { full_name: 'Jane Smith', email: 'jane@example.com' }
        },
        {
          id: '3',
          user_id: 'user3',
          action: 'create',
          resource: 'payroll',
          details: { period: '2024-01', employees_count: 45 },
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          user: { full_name: 'Bob Johnson', email: 'bob@example.com' }
        }
      ]
      setActivityLog(mockActivityLog)
    } catch (error) {
      console.error('Error loading activity log:', error)
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
          await userManagementService.resetUserPassword(userId, 'temp123456')
          toast({ type: 'success', title: 'Password reset successfully' })
          break
        case 'view':
          if (user) {
            setSelectedUser(user)
            setViewUserOpen(true)
          }
          return
        case 'edit':
          if (user) {
            setSelectedUser(user)
            setEditUserOpen(true)
          }
          return
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

  // Bulk operations
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'reset-password') => {
    if (selectedUsers.length === 0) return
    
    const actionText = {
      activate: 'activate',
      deactivate: 'deactivate',
      delete: 'delete',
      'reset-password': 'reset passwords for'
    }[action]
    
    if (!confirm(`Are you sure you want to ${actionText} ${selectedUsers.length} users?`)) return

    try {
      setActionLoading('bulk')
      
      for (const userId of selectedUsers) {
        switch (action) {
          case 'activate':
            await userManagementService.reactivateUser(userId)
            break
          case 'deactivate':
            await userManagementService.deactivateUser(userId)
            break
          case 'reset-password':
            await userManagementService.resetUserPassword(userId, 'temp123456')
            break
          // Note: bulk delete would require additional confirmation
        }
      }
      
      toast({ 
        type: 'success', 
        title: `Successfully ${actionText} ${selectedUsers.length} users` 
      })
      
      setSelectedUsers([])
      setShowBulkActions(false)
      await loadUsers()
      await loadStats()
    } catch (error) {
      console.error(`Error ${action} users:`, error)
      toast({ type: 'error', title: `Failed to ${action} users` })
    } finally {
      setActionLoading(null)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
      
      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  const toggleAllUsers = () => {
    const allSelected = selectedUsers.length === filteredAndSortedUsers.length
    const newSelection = allSelected ? [] : filteredAndSortedUsers.map(u => u.id)
    setSelectedUsers(newSelection)
    setShowBulkActions(newSelection.length > 0)
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setStatusFilter('all')
    setDepartmentFilter('all')
    setLastLoginFilter('all')
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({ type: 'success', title: 'Copied to clipboard' })
    } catch (err) {
      toast({ type: 'error', title: 'Failed to copy' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    User Management
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage user accounts, roles, and system access
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <StatusBadge status="success">
                  <Users className="h-3 w-3 mr-1" />
                  {stats.total_users} Total Users
                </StatusBadge>
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {stats.login_analytics.today} Active Today
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.user_growth.monthly} This Month
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ActionButton variant="secondary" size="sm" onClick={() => loadUsers()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </ActionButton>
              <ActionButton variant="primary" size="sm" onClick={() => setCreateUserOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </ActionButton>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Enhanced Analytics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.total_users}</div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600 font-medium">{stats.active_users} Active</span>
              <span className="text-red-500">{stats.inactive_users} Inactive</span>
            </div>
            <Progress value={(stats.active_users / stats.total_users) * 100} className="h-1 mt-2" />
            <div className="flex items-center text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.user_growth.monthly} this month
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Login Activity</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.login_analytics.today}</div>
            </div>
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>This week: {stats.login_analytics.this_week}</div>
              <div>This month: {stats.login_analytics.this_month}</div>
              <div>Avg session: {stats.login_analytics.avg_session_duration}min</div>
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">User Roles</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{roles.length}</div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {Object.entries(stats.role_distribution).slice(0, 2).map(([roleName, data]) => (
                <div key={roleName} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{roleName}:</span>
                  <span>{data.count} users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Device Access</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.device_analytics.desktop + stats.device_analytics.mobile + stats.device_analytics.tablet}</div>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Monitor className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="flex items-center"><Monitor className="h-3 w-3 mr-1" />Desktop:</span>
                <span>{stats.device_analytics.desktop}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center"><Smartphone className="h-3 w-3 mr-1" />Mobile:</span>
                <span>{stats.device_analytics.mobile}</span>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Enhanced Filters */}
          <ProfessionalCard>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Search & Filters</CardTitle>
                </div>
                {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all' || lastLoginFilter !== 'all') && (
                  <ActionButton variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </ActionButton>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
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
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {/* Add departments dynamically */}
                  </SelectContent>
                </Select>

                <Select value={lastLoginFilter} onValueChange={setLastLoginFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Last Login" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="never">Never Logged In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <ProfessionalCard className="bg-blue-50 border-blue-200">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">
                      {selectedUsers.length} users selected
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <ActionButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleBulkAction('activate')}
                        disabled={actionLoading === 'bulk'}
                      >
                        Activate Selected
                      </ActionButton>
                      <ActionButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={actionLoading === 'bulk'}
                      >
                        Deactivate Selected
                      </ActionButton>
                      <ActionButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleBulkAction('reset-password')}
                        disabled={actionLoading === 'bulk'}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Reset Passwords
                      </ActionButton>
                    </div>
                  </div>
                  <ActionButton 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedUsers([])
                      setShowBulkActions(false)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </ActionButton>
                </div>
              </CardContent>
            </ProfessionalCard>
          )}

          {/* Enhanced Users Table */}
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Users</span>
                  </CardTitle>
                  <CardDescription>
                    {filteredAndSortedUsers.length} users found
                    {filteredAndSortedUsers.length !== users.length && (
                      <span> (filtered from {users.length} total)</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    Showing {filteredAndSortedUsers.length} of {users.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAndSortedUsers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No users found"
                  description={searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all' || lastLoginFilter !== 'all'
                    ? "No users match your current filters. Try adjusting your search criteria."
                    : "Start by creating your first user account."
                  }
                  action={
                    searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all' || lastLoginFilter !== 'all' ? {
                      label: "Clear Filters",
                      onClick: clearFilters
                    } : {
                      label: "Create User",
                      onClick: () => setCreateUserOpen(true)
                    }
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                          onCheckedChange={toggleAllUsers}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>User</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('role')}>
                        <div className="flex items-center space-x-1">
                          <span>Role</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('last_login')}>
                        <div className="flex items-center space-x-1">
                          <span>Last Login</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedUsers.map((user) => (
                      <TableRow key={user.id} className={selectedUsers.includes(user.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                              {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center space-x-2">
                                {user.full_name}
                                {user.employee_id && (
                                  <Badge variant="outline" className="text-xs">
                                    {user.employee_id}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center space-x-2">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                                >
                                  {copiedField === `email-${user.id}` ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">
                              {user.role?.role_name || 'No Role'}
                            </Badge>
                            {user.role?.is_system_role && (
                              <Badge variant="outline" className="text-xs">
                                System
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm flex items-center space-x-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span>{user.department?.department_name || 'No Department'}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.is_active ? "success" : "inactive"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{formatLastLogin(user.last_login_at)}</span>
                            </div>
                            {user.last_login_at && (
                              <div className="text-xs text-muted-foreground flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>IP: 192.168.1.100</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUserAction('view', user.id, user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction('edit', user.id, user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('reset-password', user.id)}
                                disabled={actionLoading === user.id}
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.is_active ? (
                                <DropdownMenuItem 
                                  onClick={() => handleUserAction('deactivate', user.id)}
                                  disabled={actionLoading === user.id}
                                  className="text-orange-600"
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
          </ProfessionalCard>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          {/* Enhanced Roles Management */}
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>User Roles</span>
                  </CardTitle>
                  <CardDescription>
                    Define and manage user roles with specific permissions
                  </CardDescription>
                </div>
                <ActionButton variant="secondary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </ActionButton>
              </div>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No roles found"
                  description="Create roles to manage user permissions effectively."
                  action={{
                    label: "Create First Role",
                    onClick: () => {}
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => {
                      const roleStats = stats.role_distribution[role.role_name] || { count: 0, percentage: 0, active_count: 0 }
                      
                      return (
                        <ProfessionalCard key={role.id} variant="interactive" className="group">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Badge className={role.is_system_role 
                                    ? 'bg-red-100 text-red-800 border-red-200' 
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                  }>
                                    {role.role_name}
                                  </Badge>
                                  {role.is_system_role && (
                                    <Badge variant="outline" className="text-xs">
                                      System
                                    </Badge>
                                  )}
                                </div>
                                <StatusBadge status={role.is_active ? "success" : "inactive"}>
                                  {role.is_active ? "Active" : "Inactive"}
                                </StatusBadge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled={role.is_system_role}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem disabled={role.is_system_role} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Role
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Total Users</div>
                                  <div className="font-semibold">{roleStats.count}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Active Users</div>
                                  <div className="font-semibold text-green-600">{roleStats.active_count}</div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span>Usage Distribution</span>
                                  <span>{roleStats.percentage}%</span>
                                </div>
                                <Progress value={roleStats.percentage} className="h-1" />
                              </div>

                              {role.role_description && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground">{role.role_description}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </ProfessionalCard>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Permissions Matrix</span>
              </CardTitle>
              <CardDescription>
                Comprehensive role-based permission management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Permission Management</h3>
                <p className="text-muted-foreground mb-6">
                  Fine-grained access control with role-based permissions
                </p>
                <div className="grid gap-2 text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-between">
                    <span>✓ Module-level access control</span>
                    <Badge variant="outline" className="text-xs">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✓ Permission matrix management</span>
                    <Badge variant="outline" className="text-xs">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✓ Role inheritance support</span>
                    <Badge variant="outline" className="text-xs">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✓ System role protection</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                </div>
                <ActionButton>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Permissions
                </ActionButton>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Enhanced Activity Log */}
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>User Activity Timeline</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time monitoring of user actions and system events
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </Badge>
                  <ActionButton variant="secondary" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Log
                  </ActionButton>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityLog.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No recent activity"
                  description="User activity will appear here as users interact with the system."
                />
              ) : (
                <div className="space-y-4">
                  {activityLog.map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                          {activity.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            <span className="text-blue-600">{activity.user.full_name}</span>
                            <span className="text-muted-foreground"> {activity.action}d </span>
                            <span className="font-semibold">{activity.resource}</span>
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.user.email}
                        </div>
                        {activity.details && (
                          <div className="text-xs bg-white/50 rounded p-2 mt-2">
                            {activity.details.ip_address && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3" />
                                <span>IP: {activity.details.ip_address}</span>
                              </div>
                            )}
                            {activity.details.user_agent && (
                              <div className="flex items-center space-x-2 mt-1">
                                <Monitor className="h-3 w-3" />
                                <span>{activity.details.user_agent}</span>
                              </div>
                            )}
                            {activity.details.employee_id && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span>Employee ID: {activity.details.employee_id}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  <div className="text-center py-4">
                    <ActionButton variant="outline">
                      Load More Activity
                    </ActionButton>
                  </div>
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
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

      {/* Enhanced User View Dialog */}
      <Dialog open={viewUserOpen} onOpenChange={setViewUserOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedUser.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(selectedUser.email, 'modal-email')}
                    >
                      {copiedField === 'modal-email' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {selectedUser.employee_id && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{selectedUser.employee_id}</Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{selectedUser.role?.role_name || 'No Role'}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser.department?.department_name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedUser.is_active ? "success" : "inactive"}>
                        {selectedUser.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatLastLogin(selectedUser.last_login_at)}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(selectedUser.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedUser.updated_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Quick Actions</Label>
                <div className="flex space-x-2 mt-2">
                  <ActionButton variant="outline" size="sm" onClick={() => handleUserAction('edit', selectedUser.id, selectedUser)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </ActionButton>
                  <ActionButton variant="outline" size="sm" onClick={() => handleUserAction('reset-password', selectedUser.id)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Reset Password
                  </ActionButton>
                  <ActionButton 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleUserAction(selectedUser.is_active ? 'deactivate' : 'activate', selectedUser.id)}
                  >
                    {selectedUser.is_active ? (
                      <><XCircle className="h-4 w-4 mr-2" />Deactivate</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-2" />Activate</>
                    )}
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}