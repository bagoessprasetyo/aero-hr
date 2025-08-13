"use client"

import { useState, useEffect } from 'react'
import { 
  DashboardWidget, 
  InteractiveStatsCard, 
  QuickActionGrid, 
  EmptyState, 
  LoadingSkeleton 
} from '@/components/ui/professional'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  Download, 
  BarChart3,
  TrendingUp,
  Calendar,
  Building,
  MapPin,
  Clock,
  Plus,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react'
import { EmployeeService } from '@/lib/services/employees'
import type { Employee } from '@/lib/types/database'
import { EmployeeProfileCard } from './employee-profile-card'
import { useRouter } from 'next/navigation'

const employeeService = new EmployeeService()

interface EmployeeStats {
  total: number
  active: number
  resigned: number
  terminated: number
  recent_hires: number
  departments: Array<{
    name: string
    count: number
    color: string
  }>
  trends: {
    total_change: number
    active_change: number
    hire_rate: number
  }
}

interface ModernEmployeeDashboardProps {
  onAddEmployee: () => void
  onViewAllEmployees: () => void
  onFilterChange?: (filters: any) => void
}

export function ModernEmployeeDashboard({ 
  onAddEmployee, 
  onViewAllEmployees,
  onFilterChange 
}: ModernEmployeeDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    resigned: 0,
    terminated: 0,
    recent_hires: 0,
    departments: [],
    trends: {
      total_change: 0,
      active_change: 0,
      hire_rate: 0
    }
  })
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load employees and calculate stats
      const { employees } = await employeeService.getEmployees({ limit: 50 }) // Get more employees for display
      const employeeStats = calculateEmployeeStats(employees)
      setStats(employeeStats)
      setAllEmployees(employees)
      
      // Get recent hires (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentHires = employees
        .filter(emp => new Date(emp.join_date) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime())
        .slice(0, 5)
      
      setRecentEmployees(recentHires)
      
      // If there are no recent hires, show active employees instead
      if (recentHires.length === 0) {
        const activeEmployees = employees
          .filter(emp => emp.employee_status === 'active')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8)
        setRecentEmployees(activeEmployees)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateEmployeeStats = (employees: Employee[]): EmployeeStats => {
    const total = employees.length
    const active = employees.filter(emp => emp.employee_status === 'active').length
    const resigned = employees.filter(emp => emp.employee_status === 'resigned').length
    const terminated = employees.filter(emp => emp.employee_status === 'terminated').length
    
    // Calculate recent hires (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recent_hires = employees.filter(emp => 
      new Date(emp.join_date) >= thirtyDaysAgo
    ).length

    // Group by department
    const departmentCounts = employees.reduce((acc, emp) => {
      const dept = emp.department?.department_name || 'No Department'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const departments = Object.entries(departmentCounts)
      .map(([name, count], index) => ({
        label: name,
        value: count,
        color: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
          '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
        ][index % 8]
      }))
      .sort((a, b) => b.value - a.value)

    return {
      total,
      active,
      resigned,
      terminated,
      recent_hires,
      departments: departments.map(dept => ({
        name: dept.label,
        count: dept.value,
        color: dept.color
      })),
      trends: {
        total_change: 5.2, // Mock data - in real implementation, compare with previous period
        active_change: 3.1,
        hire_rate: recent_hires > 0 ? 12.5 : 0
      }
    }
  }

  const quickActions = [
    {
      icon: UserPlus,
      label: 'Add Employee',
      description: 'Create new profile',
      onClick: onAddEmployee,
      color: 'bg-blue-500'
    },
    {
      icon: Download,
      label: 'Export Data',
      description: 'Download reports',
      onClick: () => console.log('Export employees'),
      color: 'bg-green-500'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View insights',
      onClick: () => console.log('View analytics'),
      color: 'bg-purple-500'
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Manage options',
      onClick: () => console.log('Open settings'),
      color: 'bg-gray-500'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your workforce with comprehensive tools and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadDashboardData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={onAddEmployee} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget
          title="Total Employees"
          value={stats.total}
          subtitle="All registered employees"
          icon={Users}
          trend={{
            value: stats.trends.total_change,
            isPositive: stats.trends.total_change > 0,
            label: "from last month"
          }}
        />
        
        <DashboardWidget
          title="Active Employees"
          value={stats.active}
          subtitle={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          icon={UserCheck}
          trend={{
            value: stats.trends.active_change,
            isPositive: stats.trends.active_change > 0,
            label: "from last month"
          }}
        />
        
        <DashboardWidget
          title="Recent Hires"
          value={stats.recent_hires}
          subtitle="Last 30 days"
          icon={Calendar}
          trend={{
            value: stats.trends.hire_rate,
            isPositive: stats.trends.hire_rate > 0,
            label: "hiring rate"
          }}
        />
        
        <DashboardWidget
          title="Departments"
          value={stats.departments.length}
          subtitle="Active departments"
          icon={Building}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <QuickActionGrid actions={quickActions} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <div className="lg:col-span-2">
          <InteractiveStatsCard
            title="Department Distribution"
            stats={stats.departments.map(dept => ({
              label: dept.name,
              value: dept.count,
              color: dept.color
            }))}
            onItemClick={(dept) => {
              console.log('Filter by department:', dept.label)
              onFilterChange?.({ department: dept.label })
            }}
          />
        </div>

        {/* Recent Hires */}
        <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Hires</CardTitle>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {recentEmployees.length > 0 ? (
              <div className="space-y-4">
                {recentEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {employee.full_name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {employee.position?.position_title || 'N/A'} • {employee.department?.department_name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(employee.join_date).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={onViewAllEmployees}
                >
                  View All Employees
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={UserPlus}
                title="No Recent Hires"
                description="No new employees have joined in the last 30 days."
                action={{
                  label: "Add Employee",
                  onClick: onAddEmployee
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Employee Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.resigned}</div>
              <div className="text-sm text-gray-600">Resigned</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.resigned / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.terminated}</div>
              <div className="text-sm text-gray-600">Terminated</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.terminated / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.recent_hires}</div>
              <div className="text-sm text-gray-600">New Hires</div>
              <div className="text-xs text-gray-500 mt-2">Last 30 days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Directory Preview */}
      {allEmployees.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Employee Directory</h2>
              <p className="text-gray-600">Recent and active employees</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onViewAllEmployees}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              View All ({stats.total})
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {allEmployees
              .filter(emp => emp.employee_status === 'active')
              .slice(0, 8)
              .map((employee) => (
                <EmployeeProfileCard
                  key={employee.id}
                  employee={employee}
                  onViewDetails={(employeeId) => router.push(`/employees/${employeeId}`)}
                  onEdit={(employeeId) => router.push(`/employees/${employeeId}/edit`)}
                />
              ))}
          </div>
          
          {allEmployees.filter(emp => emp.employee_status === 'active').length > 8 && (
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={onViewAllEmployees}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                View {allEmployees.filter(emp => emp.employee_status === 'active').length - 8} More Employees
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}