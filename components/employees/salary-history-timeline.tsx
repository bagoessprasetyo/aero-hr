"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  ProfessionalCard, 
  StatusBadge, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton
} from "@/components/ui/professional"
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
  Download,
  Filter,
  Search,
  Eye
} from "lucide-react"
import { SalaryHistoryService } from "@/lib/services/salary-history"
import type { 
  SalaryHistoryTimeline, 
  SalaryComponentHistory, 
  Employee,
  SalaryActionType,
  ApprovalStatus 
} from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

interface SalaryHistoryTimelineProps {
  employee: Employee
  className?: string
}

interface TimelineFilters {
  startDate?: string
  endDate?: string
  actionTypes?: SalaryActionType[]
  approvalStatus?: ApprovalStatus[]
  componentType?: 'basic_salary' | 'fixed_allowance' | 'all'
  searchTerm?: string
}

const salaryHistoryService = new SalaryHistoryService()

export function SalaryHistoryTimelineComponent({ employee, className }: SalaryHistoryTimelineProps) {
  const [timeline, setTimeline] = useState<SalaryHistoryTimeline[]>([])
  const [history, setHistory] = useState<SalaryComponentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TimelineFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30d' | '90d' | '1y' | 'custom'>('90d')

  useEffect(() => {
    loadSalaryHistory()
  }, [employee.id, filters, selectedPeriod])

  const loadSalaryHistory = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on selected period
      const now = new Date()
      let startDate: string | undefined
      
      switch (selectedPeriod) {
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
          break
        case 'custom':
          startDate = filters.startDate
          break
      }

      // Get timeline view
      const timelineData = await salaryHistoryService.getSalaryHistoryTimeline(employee.id, {
        startDate: startDate || filters.startDate,
        endDate: filters.endDate,
        actionTypes: filters.actionTypes,
        approvalStatus: filters.approvalStatus,
        componentType: filters.componentType === 'all' ? undefined : filters.componentType,
        limit: 50
      })

      // Get detailed history
      const historyData = await salaryHistoryService.getSalaryHistory(employee.id, {
        startDate: startDate || filters.startDate,
        endDate: filters.endDate,
        actionTypes: filters.actionTypes,
        approvalStatus: filters.approvalStatus,
        componentType: filters.componentType === 'all' ? undefined : filters.componentType,
        limit: 50
      })

      setTimeline(timelineData)
      setHistory(historyData)
    } catch (error) {
      console.error('Error loading salary history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (actionType: SalaryActionType) => {
    switch (actionType) {
      case 'CREATE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'UPDATE':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'DELETE':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'ACTIVATE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'DEACTIVATE':
        return <Clock className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (actionType: SalaryActionType) => {
    switch (actionType) {
      case 'CREATE':
      case 'ACTIVATE':
        return 'border-l-green-500 bg-green-50'
      case 'UPDATE':
        return 'border-l-blue-500 bg-blue-50'
      case 'DELETE':
      case 'DEACTIVATE':
        return 'border-l-red-500 bg-red-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getApprovalStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
      case 'auto_approved':
        return <StatusBadge status="success">Approved</StatusBadge>
      case 'pending':
        return <StatusBadge status="warning">Pending</StatusBadge>
      case 'rejected':
        return <StatusBadge status="error">Rejected</StatusBadge>
      default:
        return <StatusBadge status="inactive">Unknown</StatusBadge>
    }
  }

  const calculateSalaryTrend = () => {
    const recentChanges = timeline.slice(0, 5)
    const positiveChanges = recentChanges.filter(c => (c.change_amount || 0) > 0).length
    const negativeChanges = recentChanges.filter(c => (c.change_amount || 0) < 0).length
    
    if (positiveChanges > negativeChanges) return { trend: 'up', color: 'text-green-600' }
    if (negativeChanges > positiveChanges) return { trend: 'down', color: 'text-red-600' }
    return { trend: 'stable', color: 'text-gray-600' }
  }

  const exportHistory = async () => {
    const startDate = filters.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = filters.endDate || new Date().toISOString().split('T')[0]
    
    try {
      const exportData = await salaryHistoryService.exportSalaryHistoryForCompliance(
        startDate,
        endDate,
        { employeeIds: [employee.id] }
      )
      
      // Create and download CSV
      const csvContent = exportData.data.map(row => Object.values(row).join(',')).join('\\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('hidden', '')
      a.setAttribute('href', url)
      a.setAttribute('download', `salary-history-${employee.employee_id}-${startDate}-${endDate}.csv`)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting history:', error)
    }
  }

  const salaryTrend = calculateSalaryTrend()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Summary */}
      <ProfessionalCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Salary History Timeline</span>
              </CardTitle>
              <CardDescription>
                Complete history of salary changes for {employee.full_name}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </ActionButton>
              <ActionButton
                variant="primary"
                size="sm"
                onClick={exportHistory}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </ActionButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{timeline.length}</p>
              <p className="text-sm text-gray-600">Total Changes</p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-bold", salaryTrend.color)}>
                {salaryTrend.trend === 'up' ? '↗️' : salaryTrend.trend === 'down' ? '↘️' : '→'}
              </p>
              <p className="text-sm text-gray-600">Recent Trend</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {timeline.filter(t => t.approval_status === 'approved').length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {timeline.filter(t => t.approval_status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-4 mb-4">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border rounded-lg p-4 mb-6 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Component Type</label>
                  <Select 
                    value={filters.componentType || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      componentType: value === 'all' ? undefined : value as 'basic_salary' | 'fixed_allowance'
                    }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="basic_salary">Basic Salary</SelectItem>
                      <SelectItem value="fixed_allowance">Fixed Allowance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </ProfessionalCard>

      {/* Timeline Content */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Change Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <LoadingSkeleton key={i}  className="p-4" />
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <EmptyState
              icon={History}
              title="No salary history found"
              description="No salary changes recorded for the selected period"
            />
          ) : (
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div
                  key={`${item.employee_id}-${item.change_date}-${index}`}
                  className={cn(
                    "relative border-l-4 p-4 rounded-lg",
                    getActionColor(item.action_type)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-full bg-white shadow-sm">
                        {getActionIcon(item.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {item.component_name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {item.component_type.replace('_', ' ')}
                          </Badge>
                          <Badge 
                            variant={item.action_type === 'CREATE' ? 'default' : 
                                   item.action_type === 'UPDATE' ? 'default' :
                                   item.action_type === 'DELETE' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {item.action_type}
                          </Badge>
                        </div>
                        
                        {/* Amount Changes */}
                        {item.change_amount !== null && item.change_amount !== undefined && (
                          <div className="flex items-center space-x-4 mb-2">
                            {item.previous_amount !== null && item.previous_amount !== undefined && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(item.previous_amount)}
                              </span>
                            )}
                            {item.new_amount !== null && item.new_amount !== undefined && (
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.new_amount)}
                              </span>
                            )}
                            {item.change_amount !== 0 && (
                              <span className={cn(
                                "text-sm font-medium flex items-center",
                                item.change_amount > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {item.change_amount > 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {item.change_amount > 0 ? '+' : ''}{formatCurrency(item.change_amount)}
                                {item.change_percentage !== null && item.change_percentage !== undefined && (
                                  <span className="ml-1">
                                    ({item.change_percentage > 0 ? '+' : ''}{item.change_percentage.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Change Details */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(item.effective_date).toLocaleDateString('id-ID')}
                          </span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {item.changed_by}
                          </span>
                          {item.change_reason && (
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {item.change_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getApprovalStatusBadge(item.approval_status)}
                      <span className="text-xs text-gray-500">
                        {new Date(item.change_date).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ProfessionalCard>
    </div>
  )
}