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
  History,
  Calendar,
  Users,
  DollarSign,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Filter,
  RefreshCw
} from "lucide-react"
import { SalaryHistoryService } from "@/lib/services/salary-history"
import type { 
  BulkSalaryOperation, 
  BulkOperationType 
} from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

interface BulkOperationHistoryProps {
  className?: string
}

interface HistoryFilters {
  operation_type?: BulkOperationType
  start_date?: string
  end_date?: string
  status?: string
}

const salaryHistoryService = new SalaryHistoryService()

export function BulkOperationHistory({ className }: BulkOperationHistoryProps) {
  const [operations, setOperations] = useState<BulkSalaryOperation[]>([])
  const [selectedOperation, setSelectedOperation] = useState<BulkSalaryOperation | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    total_operations: 0,
    total_employees_affected: 0,
    total_cost_impact: 0,
    operations_by_type: {} as Record<string, number>,
    operations_by_status: {} as Record<string, number>
  })
  
  const [filters, setFilters] = useState<HistoryFilters>({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadOperationHistory()
    loadOperationStats()
  }, [filters])

  const loadOperationHistory = async () => {
    try {
      setLoading(true)
      const data = await salaryHistoryService.getBulkOperationHistory({
        ...filters,
        limit: 50
      })
      setOperations(data)
    } catch (error) {
      console.error('Error loading operation history:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOperationStats = async () => {
    try {
      const statsData = await salaryHistoryService.getBulkOperationStats({
        start_date: filters.start_date,
        end_date: filters.end_date
      })
      setStats(statsData)
    } catch (error) {
      console.error('Error loading operation stats:', error)
    }
  }

  const handleViewDetails = async (operationId: string) => {
    try {
      const operation = await salaryHistoryService.getBulkOperationById(operationId)
      setSelectedOperation(operation)
    } catch (error) {
      console.error('Error loading operation details:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'executing': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />
      case 'partially_completed': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'executing': return 'default'
      case 'failed': return 'destructive'
      case 'cancelled': return 'secondary'
      case 'partially_completed': return 'warning'
      default: return 'secondary'
    }
  }

  const getOperationTypeIcon = (type: BulkOperationType) => {
    switch (type) {
      case 'annual_review': return <Calendar className="h-4 w-4" />
      case 'mass_increase': return <DollarSign className="h-4 w-4" />
      case 'department_adjustment': return <Users className="h-4 w-4" />
      case 'promotion_batch': return <CheckCircle2 className="h-4 w-4" />
      case 'cost_of_living': return <RefreshCw className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const resetFilters = () => {
    setFilters({
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Bulk Operation History</span>
          </CardTitle>
          <CardDescription>
            View and manage past bulk salary operations
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_operations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_employees_affected} employees affected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_cost_impact)}</div>
            <p className="text-xs text-muted-foreground">Total monthly increase</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total_operations > 0 
                ? Math.round(((stats.operations_by_status.completed || 0) / stats.total_operations) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Operations completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {Object.entries(stats.operations_by_type).length > 0
                ? Object.entries(stats.operations_by_type)
                    .sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'None'
                : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">Operation type</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filters and Operations List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operation Type</Label>
                  <Select value={filters.operation_type || ''} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, operation_type: value as BulkOperationType || undefined }))
                  }>
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
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <ActionButton variant="primary" onClick={loadOperationHistory}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </ActionButton>
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Operations List */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle>Operations ({operations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <LoadingSkeleton key={i} lines={3} className="h-20" />
                  ))}
                </div>
              ) : operations.length === 0 ? (
                <EmptyState
                  icon={<History className="h-8 w-8" />}
                  title="No operations found"
                  description="No bulk operations match the selected filters"
                />
              ) : (
                <div className="space-y-3">
                  {operations.map(operation => (
                    <div key={operation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getOperationTypeIcon(operation.operation_type)}
                            <span className="font-medium">{operation.operation_name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {operation.operation_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={getStatusColor(operation.operation_status) as any}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(operation.operation_status)}
                              <span className="capitalize">{operation.operation_status.replace('_', ' ')}</span>
                            </div>
                          </StatusBadge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-gray-600">Employees</p>
                          <p className="font-medium">{operation.total_employees_affected}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost Impact</p>
                          <p className="font-medium">{formatCurrency(operation.total_cost_impact)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Created</p>
                          <p className="font-medium">
                            {new Date(operation.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Created by: {operation.created_by}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(operation.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </div>

        {/* Operation Details */}
        <div>
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Operation Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOperation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedOperation.operation_name}</h3>
                    <p className="text-sm text-gray-600">{selectedOperation.operation_description}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <span className="font-medium">{selectedOperation.operation_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <StatusBadge status={getStatusColor(selectedOperation.operation_status) as any}>
                        {selectedOperation.operation_status.replace('_', ' ')}
                      </StatusBadge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Employees:</span>
                      <span className="font-medium">{selectedOperation.total_employees_affected}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost Impact:</span>
                      <span className="font-medium">{formatCurrency(selectedOperation.total_cost_impact)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Effective Date:</span>
                      <span className="font-medium">
                        {new Date(selectedOperation.effective_date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    {selectedOperation.successful_items !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span>Success Rate:</span>
                        <span className="font-medium text-green-600">
                          {selectedOperation.successful_items} / {selectedOperation.total_employees_affected}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t">
                    <ActionButton variant="secondary" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Export Report
                    </ActionButton>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Eye className="h-8 w-8" />}
                  title="No operation selected"
                  description="Select an operation from the list to view details"
                />
              )}
            </CardContent>
          </ProfessionalCard>
        </div>
      </div>
    </div>
  )
}