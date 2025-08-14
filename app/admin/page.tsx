"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminCard } from '@/components/admin/admin-card'
import { ProtectedRoute } from '@/components/rbac/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ProfessionalCard,
  ActionButton
} from '@/components/ui/professional'
import { 
  Building2, 
  Users, 
  Briefcase, 
  Landmark, 
  Settings, 
  UserCog,
  Database,
  Shield,
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Server,
  HardDrive,
  Globe,
  Cpu,
  Calendar,
  FileText,
  Key,
  Zap,
  ChevronRight,
  Plus,
  RefreshCw,
  Calculator,
  Loader2,
  Search,
  ArrowRight
} from 'lucide-react'

interface AdminStats {
  departments: { total: number; active: number; inactive: number }
  positions: { total: number; active: number; inactive: number }
  banks: { total: number; active: number; branches: number }
  users: { total: number; active: number; roles: number; lastActivity: string }
  system: { 
    uptime: string 
    performance: number
    storage: number
    backups: number
    lastBackup: string
  }
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  
  const [stats, setStats] = useState<AdminStats>({
    departments: { total: 0, active: 0, inactive: 0 },
    positions: { total: 0, active: 0, inactive: 0 },
    banks: { total: 0, active: 0, branches: 0 },
    users: { total: 0, active: 0, roles: 0, lastActivity: '' },
    system: { 
      uptime: '99.9%', 
      performance: 95,
      storage: 67,
      backups: 14,
      lastBackup: '2 hours ago'
    }
  })

  // Memoize expensive calculations
  const computedMetrics = useMemo(() => {
    const totalEntities = stats.departments.total + stats.positions.total + stats.banks.total + stats.users.total
    const totalActive = stats.departments.active + stats.positions.active + stats.banks.active + stats.users.active
    const overallHealthScore = totalEntities > 0 ? Math.round((totalActive / totalEntities) * 100) : 0
    
    return {
      totalEntities,
      totalActive,
      overallHealthScore,
      systemEfficiency: Math.round((stats.system.performance + (100 - stats.system.storage)) / 2)
    }
  }, [stats])

  // Admin module configuration
  const adminModules = useMemo(() => [
    {
      id: 'departments',
      title: 'Departments',
      description: 'Manage organizational structure and hierarchy',
      icon: Building2,
      href: '/admin/departments',
      gradient: 'from-blue-500 to-indigo-600',
      stats: {
        primary: stats.departments.total.toString(),
        secondary: `${stats.departments.active} Active`,
        status: stats.departments.inactive > 0 ? 'warning' as const : 'healthy' as const,
        statusText: stats.departments.inactive > 0 ? `${stats.departments.inactive} Inactive` : 'All Active'
      }
    },
    {
      id: 'positions',
      title: 'Positions',
      description: 'Define job roles and responsibilities',
      icon: Briefcase,
      href: '/admin/positions',
      gradient: 'from-purple-500 to-pink-600',
      stats: {
        primary: stats.positions.total.toString(),
        secondary: `${stats.positions.active} Active`,
        status: stats.positions.inactive > 2 ? 'warning' as const : 'healthy' as const,
        statusText: stats.positions.inactive > 0 ? `${stats.positions.inactive} Inactive` : 'All Active'
      }
    },
    {
      id: 'banks',
      title: 'Banks',
      description: 'Configure payment and banking systems',
      icon: Landmark,
      href: '/admin/banks',
      gradient: 'from-green-500 to-teal-600',
      stats: {
        primary: stats.banks.total.toString(),
        secondary: `${stats.banks.branches} Branches`,
        status: 'healthy' as const,
        statusText: 'All Connected'
      }
    },
    {
      id: 'users',
      title: 'Users',
      description: 'Manage user accounts and access control',
      icon: UserCog,
      href: '/admin/users',
      gradient: 'from-orange-500 to-red-600',
      stats: {
        primary: stats.users.total.toString(),
        secondary: `${stats.users.active} Active`,
        status: 'healthy' as const,
        statusText: `${stats.users.roles} Roles`
      }
    },
    {
      id: 'permissions',
      title: 'Permissions',
      description: 'Configure role-based access control',
      icon: Shield,
      href: '/admin/permissions',
      gradient: 'from-red-500 to-pink-600',
      stats: {
        primary: stats.users.roles.toString(),
        secondary: 'RBAC Active',
        status: 'healthy' as const,
        statusText: 'Secured'
      }
    },
    {
      id: 'audit',
      title: 'Audit & Compliance',
      description: 'Monitor compliance and audit trails',
      icon: FileText,
      href: '/admin/audit',
      gradient: 'from-indigo-500 to-purple-600',
      stats: {
        primary: '87%',
        secondary: 'Compliance Score',
        status: 'warning' as const,
        statusText: '2 Issues'
      }
    },
    {
      id: 'tax-config',
      title: 'Tax Configuration',
      description: 'Configure tax rates and BPJS settings',
      icon: Calculator,
      href: '/admin/tax-config',
      gradient: 'from-cyan-500 to-blue-600',
      stats: {
        primary: 'PPh 21',
        secondary: 'Tax Ready',
        status: 'healthy' as const,
        statusText: 'Compliant'
      }
    },
    {
      id: 'system-config',
      title: 'System Config',
      description: 'System settings and performance monitoring',
      icon: Server,
      href: '/admin/system-config',
      gradient: 'from-gray-500 to-gray-700',
      stats: {
        primary: `${stats.system.performance}%`,
        secondary: 'Performance',
        status: stats.system.performance < 90 ? 'warning' as const : 'healthy' as const,
        statusText: stats.system.uptime
      }
    }
  ], [stats])

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery) return adminModules
    return adminModules.filter(module => 
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [adminModules, searchQuery])

  // Navigation handler
  const handleModuleClick = useCallback((href: string) => {
    router.push(href)
  }, [router])

  useEffect(() => {
    const loadAdminStats = async () => {
      try {
        setLoading(true)
        
        // Check cache first (localStorage for demo - in production use proper cache)
        const cacheKey = 'admin_stats_cache'
        const cacheTimestamp = 'admin_stats_timestamp'
        const cachedData = localStorage.getItem(cacheKey)
        const cachedTime = localStorage.getItem(cacheTimestamp)
        
        // Cache for 5 minutes (300000ms)
        const cacheExpiry = 300000
        const now = Date.now()
        
        if (cachedData && cachedTime && (now - parseInt(cachedTime)) < cacheExpiry) {
          // Use cached data
          setStats(JSON.parse(cachedData))
          setLoading(false)
          return
        }
        
        // Simulate loading admin statistics (in production, this would be API calls)
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const newStats = {
          departments: { total: 12, active: 10, inactive: 2 },
          positions: { total: 28, active: 25, inactive: 3 },
          banks: { total: 8, active: 8, branches: 45 },
          users: { total: 156, active: 142, roles: 6, lastActivity: '5 minutes ago' },
          system: { 
            uptime: '99.9%', 
            performance: 95,
            storage: 67,
            backups: 14,
            lastBackup: '2 hours ago'
          }
        }
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(newStats))
        localStorage.setItem(cacheTimestamp, now.toString())
        
        setStats(newStats)
      } catch (error) {
        console.error('Error loading admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAdminStats()
  }, [])

  // Optimized refresh function with cache invalidation
  const refreshStats = useCallback(async () => {
    // Clear cache
    localStorage.removeItem('admin_stats_cache')
    localStorage.removeItem('admin_stats_timestamp')
    
    setLoading(true)
    try {
      // Reload stats
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const newStats = {
        departments: { total: 12, active: 10, inactive: 2 },
        positions: { total: 28, active: 25, inactive: 3 },
        banks: { total: 8, active: 8, branches: 45 },
        users: { total: 156, active: 142, roles: 6, lastActivity: 'Just now' },
        system: { 
          uptime: '99.9%', 
          performance: Math.floor(Math.random() * 10) + 90,
          storage: Math.floor(Math.random() * 20) + 60,
          backups: 14,
          lastBackup: 'Just now'
        }
      }
      
      // Cache the new data
      const now = Date.now()
      localStorage.setItem('admin_stats_cache', JSON.stringify(newStats))
      localStorage.setItem('admin_stats_timestamp', now.toString())
      
      setStats(newStats)
    } catch (error) {
      console.error('Error refreshing admin stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    // <ProtectedRoute permission="admin.read">
      <div className="container mx-auto py-6 space-y-8">
        {/* Enhanced Header */}
        <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      System Administration
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Comprehensive management dashboard for Aero HR system
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-4">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>System Healthy</span>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {stats.users.total} Total Users
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Last Activity: {stats.users.lastActivity}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right space-y-2">
                <div className="flex items-center space-x-2">
                  <ActionButton variant="secondary" size="sm" onClick={refreshStats} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </ActionButton>
                  <ActionButton variant="primary" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Setup
                  </ActionButton>
                </div>
                <div className="text-sm text-muted-foreground">
                  System Uptime: <span className="font-medium text-green-600">{stats.system.uptime}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Efficiency: <span className="font-medium text-blue-600">{computedMetrics.systemEfficiency}%</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </ProfessionalCard>

        {/* Admin Search */}
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search admin modules..."
              className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{filteredModules.length} of {adminModules.length} modules</span>
          </div>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredModules.map((module) => (
            <AdminCard
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              stats={module.stats}
              gradient={module.gradient}
              onClick={() => handleModuleClick(module.href)}
            />
          ))}
        </div>

        {/* Quick System Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">System Health</CardTitle>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Score</span>
                  <span className="font-medium">{computedMetrics.overallHealthScore}%</span>
                </div>
                <Progress value={computedMetrics.overallHealthScore} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>System Efficiency</span>
                  <span className="font-medium">{computedMetrics.systemEfficiency}%</span>
                </div>
                <Progress value={computedMetrics.systemEfficiency} className="h-2" />
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uptime: {stats.system.uptime}</span>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>

          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="p-1 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">System backup completed</p>
                    <p className="text-xs text-green-600">{stats.system.lastBackup}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <Users className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800">User activity logged</p>
                    <p className="text-xs text-blue-600">{stats.users.lastActivity}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>

          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionButton 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleModuleClick('/admin/users')}
              >
                <UserCog className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">User Management</div>
                  <div className="text-xs text-muted-foreground">Manage accounts & roles</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </ActionButton>
              
              <ActionButton 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleModuleClick('/admin/audit')}
              >
                <FileText className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Audit Trail</div>
                  <div className="text-xs text-muted-foreground">View compliance logs</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </ActionButton>
              
              <ActionButton 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleModuleClick('/admin/system-config')}
              >
                <Settings className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">System Config</div>
                  <div className="text-xs text-muted-foreground">Configure system settings</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </ActionButton>
            </CardContent>
          </ProfessionalCard>
        </div>
      </div>
    // </ProtectedRoute>
  )
}