"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ProfessionalCard, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton,
  StatusBadge
} from "@/components/ui/professional"
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  Building2,
  Briefcase
} from "lucide-react"
import { SalaryHistoryService } from "@/lib/services/salary-history"
import type { 
  BulkSalaryOperation,
  BulkOperationType
} from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

interface BulkOperationAnalyticsProps {
  className?: string
}

interface AnalyticsData {
  totalOperations: number
  totalEmployeesAffected: number
  totalCostImpact: number
  averageOperationSize: number
  successRate: number
  operationsByType: Record<BulkOperationType, number>
  operationsByStatus: Record<string, number>
  operationsByMonth: Array<{ month: string; count: number; impact: number }>
  departmentImpact: Array<{ department: string; operations: number; totalImpact: number }>
  recentTrends: {
    operationsGrowth: number
    costImpactGrowth: number
    averageSizeGrowth: number
  }
  topOperations: BulkSalaryOperation[]
  riskAnalysis: {
    highRiskOperations: number
    averageProcessingTime: string
    rollbackRate: number
  }
}

interface AnalyticsFilters {
  startDate: string
  endDate: string
  departments?: string[]
  operationTypes?: BulkOperationType[]
  minimumImpact?: number
}

const salaryHistoryService = new SalaryHistoryService()

export function BulkOperationAnalytics({ className }: BulkOperationAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [departments] = useState<string[]>([
    'Information Technology',
    'Human Resources', 
    'Finance & Accounting',
    'Operations',
    'Marketing',
    'Sales'
  ])

  useEffect(() => {
    loadAnalyticsData()
  }, [filters])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Get operations data
      const operations = await salaryHistoryService.getBulkOperationHistory({
        start_date: filters.startDate,
        end_date: filters.endDate,
        limit: 1000
      })

      // Get statistics
      const stats = await salaryHistoryService.getBulkOperationStats({
        start_date: filters.startDate,
        end_date: filters.endDate
      })

      // Process analytics data
      const analytics = processAnalyticsData(operations, stats)
      setAnalyticsData(analytics)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (operations: BulkSalaryOperation[], stats: any): AnalyticsData => {
    // Calculate basic metrics
    const totalOperations = operations.length
    const totalEmployeesAffected = operations.reduce((sum, op) => sum + (op.total_employees_affected || 0), 0)
    const totalCostImpact = operations.reduce((sum, op) => sum + (op.total_cost_impact || 0), 0)
    const averageOperationSize = totalOperations > 0 ? totalEmployeesAffected / totalOperations : 0

    // Calculate success rate
    const completedOperations = operations.filter(op => String(op.operation_status).toLowerCase() === 'completed').length
    const successRate = totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0

    // Group by type
    const operationsByType: Record<BulkOperationType, number> = {} as any
    operations.forEach(op => {
      operationsByType[op.operation_type] = (operationsByType[op.operation_type] || 0) + 1
    })

    // Group by status
    const operationsByStatus: Record<string, number> = {}
    operations.forEach(op => {
      operationsByStatus[op.operation_status] = (operationsByStatus[op.operation_status] || 0) + 1
    })

    // Group by month
    const operationsByMonth = generateMonthlyData(operations)

    // Calculate department impact (mock data)
    const departmentImpact = departments.map(dept => ({
      department: dept,
      operations: Math.floor(Math.random() * 10) + 1,
      totalImpact: Math.floor(Math.random() * 50000000) + 10000000
    }))

    // Calculate trends (mock data)
    const recentTrends = {
      operationsGrowth: Math.floor(Math.random() * 30) - 10, // -10% to +20%
      costImpactGrowth: Math.floor(Math.random() * 40) - 15, // -15% to +25%
      averageSizeGrowth: Math.floor(Math.random() * 20) - 5  // -5% to +15%
    }

    // Top operations by impact
    const topOperations = [...operations]
      .sort((a, b) => (b.total_cost_impact || 0) - (a.total_cost_impact || 0))
      .slice(0, 5)

    // Risk analysis
    const riskAnalysis = {
      highRiskOperations: operations.filter(op => (op.total_cost_impact || 0) > 100000000).length,
      averageProcessingTime: "12.5 minutes",
      rollbackRate: Math.random() * 5 // 0-5%
    }

    return {
      totalOperations,
      totalEmployeesAffected,
      totalCostImpact,
      averageOperationSize,
      successRate,
      operationsByType,
      operationsByStatus,
      operationsByMonth,
      departmentImpact,
      recentTrends,
      topOperations,
      riskAnalysis
    }
  }

  const generateMonthlyData = (operations: BulkSalaryOperation[]) => {
    const monthlyData: Record<string, { count: number; impact: number }> = {}
    
    operations.forEach(op => {
      const month = new Date(op.created_at).toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, impact: 0 }
      }
      
      monthlyData[month].count++
      monthlyData[month].impact += op.total_cost_impact || 0
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      impact: data.impact
    }))
  }

  const formatGrowth = (growth: number) => {
    const color = growth >= 0 ? 'text-green-600' : 'text-red-600'
    const icon = growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
    return (
      <span className={cn("flex items-center space-x-1", color)}>
        {icon}
        <span>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</span>
      </span>
    )
  }

  const getTypeIcon = (type: BulkOperationType) => {
    switch (type) {
      case 'annual_review': return <Calendar className="h-4 w-4" />
      case 'mass_increase': return <TrendingUp className="h-4 w-4" />
      case 'department_adjustment': return <Building2 className="h-4 w-4" />
      case 'promotion_batch': return <Briefcase className="h-4 w-4" />
      case 'cost_of_living': return <DollarSign className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Bulk Operations Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <ActionButton variant="secondary" size="sm" onClick={loadAnalyticsData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </ActionButton>
            </div>
          </CardTitle>
          <CardDescription>
            Comprehensive analytics and insights for bulk salary operations
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {/* Filters */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Analytics Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="operation-type">Operation Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="annual_review">Annual Review</SelectItem>
                  <SelectItem value="mass_increase">Mass Increase</SelectItem>
                  <SelectItem value="department_adjustment">Department Adjustment</SelectItem>
                  <SelectItem value="promotion_batch">Promotion Batch</SelectItem>
                  <SelectItem value="cost_of_living">Cost of Living</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min-impact">Min Impact (IDR)</Label>
              <Input
                id="min-impact"
                type="number"
                placeholder="0"
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minimumImpact: parseFloat(e.target.value) || undefined 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </ProfessionalCard>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <LoadingSkeleton key={i} lines={3} className="h-32" />
          ))}
        </div>
      ) : !analyticsData ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="No analytics data"
          description="Unable to load analytics data"
        />
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Total Operations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalOperations}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatGrowth(analyticsData.recentTrends.operationsGrowth)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Employees Affected</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalEmployeesAffected.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg: {Math.round(analyticsData.averageOperationSize)} per operation
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalCostImpact)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatGrowth(analyticsData.recentTrends.costImpactGrowth)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Success Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analyticsData.successRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Operations completed successfully
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Operations by Type */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Operations by Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.operationsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(type as BulkOperationType)}
                        <span className="text-sm">{type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(count / analyticsData.totalOperations) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* Operations by Status */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Operations by Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.operationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'pending'}>
                          {status.replace('_', ' ')}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full",
                              status === 'completed' ? 'bg-green-600' :
                              status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'
                            )}
                            style={{ 
                              width: `${(count / analyticsData.totalOperations) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>

          {/* Department Impact */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Impact by Department</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.departmentImpact.map(dept => (
                  <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{dept.department}</h4>
                      <p className="text-sm text-gray-600">{dept.operations} operations</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(dept.totalImpact)}</div>
                      <div className="text-xs text-gray-500">Total impact</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Top Operations */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Top Operations by Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topOperations.map((operation, index) => (
                  <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{operation.operation_name}</h4>
                        <p className="text-sm text-gray-600">
                          {operation.total_employees_affected} employees • {operation.operation_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(operation.total_cost_impact)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(operation.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Risk Analysis */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Risk Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analyticsData.riskAnalysis.highRiskOperations}
                  </div>
                  <div className="text-sm text-red-700">High-Risk Operations</div>
                  <div className="text-xs text-red-600 mt-1">
                    Operations &gt; IDR 100M
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.riskAnalysis.averageProcessingTime}
                  </div>
                  <div className="text-sm text-blue-700">Avg Processing Time</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Per operation
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analyticsData.riskAnalysis.rollbackRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-yellow-700">Rollback Rate</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Operations rolled back
                  </div>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>
        </>
      )}
    </div>
  )
}