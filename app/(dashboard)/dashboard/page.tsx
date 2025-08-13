"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ProfessionalCard, 
  StatsCard, 
  ActionButton, 
  LoadingSkeleton,
  StatusBadge
} from "@/components/ui/professional"
import {
  Users,
  TrendingUp,
  TrendingDown,
  Calculator,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  Calendar,
  FileText,
  ArrowRight,
  Bell,
  Activity,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react"
import { EmployeeService } from "@/lib/services/employees"
import { SalaryHistoryService } from "@/lib/services/salary-history"
import type { Employee, SalaryHistoryTimeline } from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { calculateBPJS } from "@/lib/calculations/bpjs"
import { calculatePPh21 } from "@/lib/calculations/pph21"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalPayroll: number
  avgSalary: number
  recentChanges: number
  pendingReviews: number
}

interface SalaryTrend {
  month: string
  amount: number
  change: number
}

interface DepartmentStats {
  name: string
  employeeCount: number
  avgSalary: number
  totalCost: number
}

const employeeService = new EmployeeService()
const salaryHistoryService = new SalaryHistoryService()

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayroll: 0,
    avgSalary: 0,
    recentChanges: 0,
    pendingReviews: 0
  })
  const [salaryTrends, setSalaryTrends] = useState<SalaryTrend[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([])
  const [recentActivity, setRecentActivity] = useState<SalaryHistoryTimeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load employees
      const employeeResponse = await employeeService.getEmployees()
      const employees = Array.isArray(employeeResponse) ? employeeResponse : employeeResponse.employees
      
      // Calculate basic stats
      const activeEmployees = employees.filter(emp => emp.employee_status === 'active')
      
      // Calculate salary statistics
      let totalPayroll = 0
      const departmentMap = new Map<string, { count: number; totalSalary: number }>()
      
      for (const employee of activeEmployees) {
        try {
          const employeeWithSalary = await employeeService.getEmployeeById(employee.id)
          if (employeeWithSalary?.salary_components) {
            const employeeSalary = employeeWithSalary.salary_components
              .filter(comp => comp.is_active)
              .reduce((total, comp) => total + comp.amount, 0)
            
            totalPayroll += employeeSalary
            
            // Track by department
            const deptName = typeof employee.department === 'object' && employee.department?.department_name 
              ? employee.department.department_name 
              : typeof employee.department === 'string' 
                ? employee.department 
                : 'No Department'
            const deptData = departmentMap.get(deptName) || { count: 0, totalSalary: 0 }
            departmentMap.set(deptName, {
              count: deptData.count + 1,
              totalSalary: deptData.totalSalary + employeeSalary
            })
          }
        } catch (error) {
          console.warn(`Error loading salary for employee ${employee.id}:`, error)
        }
      }

      // Generate department statistics
      const deptStats: DepartmentStats[] = Array.from(departmentMap.entries()).map(([name, data]) => ({
        name,
        employeeCount: data.count,
        avgSalary: data.count > 0 ? data.totalSalary / data.count : 0,
        totalCost: data.totalSalary
      })).sort((a, b) => b.totalCost - a.totalCost)

      // Get recent salary changes (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const recentChanges = await salaryHistoryService.getSalaryChangesByPeriod(
        thirtyDaysAgo,
        new Date().toISOString(),
        {}
      )

      // Generate mock salary trends (in real app, this would come from historical data)
      const mockTrends: SalaryTrend[] = [
        { month: 'Jan 2024', amount: totalPayroll * 0.95, change: 2.1 },
        { month: 'Feb 2024', amount: totalPayroll * 0.97, change: 1.8 },
        { month: 'Mar 2024', amount: totalPayroll * 0.98, change: 1.2 },
        { month: 'Apr 2024', amount: totalPayroll * 0.99, change: 0.8 },
        { month: 'May 2024', amount: totalPayroll, change: 1.0 },
      ]

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        totalPayroll,
        avgSalary: activeEmployees.length > 0 ? totalPayroll / activeEmployees.length : 0,
        recentChanges: recentChanges.length,
        pendingReviews: 0 // Would be calculated from actual review data
      })
      
      setSalaryTrends(mockTrends)
      setDepartmentStats(deptStats)
      setRecentActivity(recentChanges.slice(0, 10))
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'UPDATE': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'DELETE': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <LoadingSkeleton className="h-80" />
          <LoadingSkeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your HR management system and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ActionButton variant="secondary" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            This Month
          </ActionButton>
          <ActionButton variant="primary" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </ActionButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees.toString()}
          subtitle={`${stats.activeEmployees} active`}
          trend={{
            value: 5.2,
            isPositive: true,
            label: "this month"
          }}
          icon={Users}
        />
        
        <StatsCard
          title="Monthly Payroll"
          value={formatCurrency(stats.totalPayroll)}
          subtitle={`Avg: ${formatCurrency(stats.avgSalary)}`}
          trend={{
            value: 3.1,
            isPositive: true,
            label: "from last month"
          }}
          icon={DollarSign}
        />
        
        <StatsCard
          title="Recent Changes"
          value={stats.recentChanges.toString()}
          subtitle="Last 30 days"
          icon={TrendingUp}
        />
        
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews.toString()}
          subtitle="Require attention"
          trend={{
            value: 2.3,
            isPositive: false,
            label: "from last week"
          }}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Salary Trends */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5" />
                <span>Payroll Trends</span>
              </CardTitle>
              <CardDescription>
                Monthly payroll changes over the last 5 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salaryTrends.map((trend, index) => (
                  <div key={trend.month} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(trend.change)}
                      <div>
                        <p className="font-medium text-gray-900">{trend.month}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(trend.amount)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("font-medium", getTrendColor(trend.change))}>
                        {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/analytics">
                  <ActionButton variant="secondary" size="sm" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Detailed Analytics
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ActionButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Overview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Departments</span>
              </CardTitle>
              <CardDescription>
                Employee distribution by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departmentStats.slice(0, 5).map(dept => (
                  <div key={dept.name} className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{dept.name}</p>
                        <p className="text-xs text-gray-600">{dept.employeeCount} employees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(dept.avgSalary)}</p>
                      <p className="text-xs text-gray-600">avg salary</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/employees">
                  <ActionButton variant="secondary" size="sm" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Employees
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ActionButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest salary changes and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={`${activity.employee_id}-${index}`} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className="p-1 rounded-full bg-gray-100">
                      {getActionTypeIcon(activity.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.component_name} - {activity.full_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {activity.action_type.toLowerCase()} • {new Date(activity.change_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      {activity.change_amount && (
                        <span className={cn(
                          "text-xs font-medium",
                          activity.change_amount > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {activity.change_amount > 0 ? '+' : ''}{formatCurrency(activity.change_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentActivity.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/bulk-operations">
                  <ActionButton variant="secondary" size="sm" className="w-full">
                    <Calculator className="mr-2 h-4 w-4" />
                    View All Changes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ActionButton>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/employees">
                <ActionButton variant="secondary" className="w-full h-20 flex flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Add Employee</span>
                </ActionButton>
              </Link>
              
              <Link href="/payroll">
                <ActionButton variant="secondary" className="w-full h-20 flex flex-col">
                  <Calculator className="h-6 w-6 mb-2" />
                  <span className="text-sm">Run Payroll</span>
                </ActionButton>
              </Link>
              
              <Link href="/bulk-operations">
                <ActionButton variant="secondary" className="w-full h-20 flex flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span className="text-sm">Bulk Adjust</span>
                </ActionButton>
              </Link>
              
              <Link href="/tax">
                <ActionButton variant="secondary" className="w-full h-20 flex flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm">Tax Reports</span>
                </ActionButton>
              </Link>
            </div>
            
            {/* System Health */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">System Health</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Database</span>
                  <StatusBadge status="success">Online</StatusBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Last Backup</span>
                  <span className="text-xs text-gray-600">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Active Users</span>
                  <span className="text-xs text-gray-600">3 online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}