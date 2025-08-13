"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ProfessionalCard, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton,
  StatusBadge
} from "@/components/ui/professional"
import {
  Users,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  DollarSign,
  Eye,
  Download,
  Play,
  XCircle,
  History,
  Settings,
  Bookmark,
  RotateCcw,
  BarChart3
} from "lucide-react"
import { EmployeeService } from "@/lib/services/employees"
import { SalaryHistoryService, type BulkSalaryAdjustment } from "@/lib/services/salary-history"
import type { 
  Employee, 
  BulkSalaryOperation, 
  BulkSalaryOperationItem,
  AdjustmentType,
  BulkOperationType 
} from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"
import { BulkOperationHistory } from "./bulk-operation-history"
import { BulkOperationTemplates } from "./bulk-operation-templates"
import { BulkOperationRollback } from "./bulk-operation-rollback"
import { BulkOperationAnalytics } from "./bulk-operation-analytics"

interface BulkOperationsProps {
  className?: string
}

interface BulkPreviewItem {
  employee: Employee
  currentSalary: number
  newSalary: number
  changeAmount: number
  changePercentage: number
}

const employeeService = new EmployeeService()
const salaryHistoryService = new SalaryHistoryService()

export function BulkOperations({ className }: BulkOperationsProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [bulkAdjustment, setBulkAdjustment] = useState<BulkSalaryAdjustment>({
    adjustmentType: 'percentage',
    adjustmentValue: 0,
    operationName: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    changeReason: ''
  })
  const [previewData, setPreviewData] = useState<BulkPreviewItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [executing, setExecuting] = useState(false)
  const [operationProgress, setOperationProgress] = useState({ completed: 0, total: 0, current: '' })
  const [operationId, setOperationId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'operations' | 'history' | 'templates' | 'rollback' | 'analytics'>('operations')

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const employeeResponse = await employeeService.getEmployees()
      const employeeData = Array.isArray(employeeResponse) ? employeeResponse : employeeResponse.employees
      setEmployees(employeeData.filter(emp => emp.employee_status === 'active'))
      
      // Extract unique departments and positions
      const uniqueDepts = [...new Set(employeeData.map(emp => emp.department))]
      const uniquePositions = [...new Set(employeeData.map(emp => emp.position_title))]
      setDepartments(uniqueDepts)
      setPositions(uniquePositions)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeSelection = (employeeId: string, selected: boolean) => {
    const newSelection = new Set(selectedEmployees)
    if (selected) {
      newSelection.add(employeeId)
    } else {
      newSelection.delete(employeeId)
    }
    setSelectedEmployees(newSelection)
  }

  const handleSelectAll = () => {
    setSelectedEmployees(new Set(employees.map(emp => emp.id)))
  }

  const handleDeselectAll = () => {
    setSelectedEmployees(new Set())
  }

  const filterEmployeesByDepartment = (department: string) => {
    const deptEmployees = employees.filter(emp => emp.department === department)
    setSelectedEmployees(new Set(deptEmployees.map(emp => emp.id)))
  }

  const filterEmployeesByPosition = (position: string) => {
    const posEmployees = employees.filter(emp => emp.position_title === position)
    setSelectedEmployees(new Set(posEmployees.map(emp => emp.id)))
  }

  const calculatePreview = async () => {
    if (selectedEmployees.size === 0 || !bulkAdjustment.adjustmentValue) return

    try {
      setLoading(true)
      const preview: BulkPreviewItem[] = []
      
      for (const employeeId of selectedEmployees) {
        const employee = employees.find(emp => emp.id === employeeId)
        if (!employee) continue

        // Get current salary components
        const employeeWithSalary = await employeeService.getEmployeeById(employeeId)
        if (!employeeWithSalary) continue

        const currentBasicSalary = employeeWithSalary.salary_components
          ?.filter(comp => comp.component_type === 'basic_salary' && comp.is_active)
          .reduce((total, comp) => total + comp.amount, 0) || 0

        const currentAllowances = employeeWithSalary.salary_components
          ?.filter(comp => comp.component_type === 'fixed_allowance' && comp.is_active)
          .reduce((total, comp) => total + comp.amount, 0) || 0

        const currentSalary = currentBasicSalary + currentAllowances

        let newSalary = currentSalary
        
        // Calculate adjustment
        switch (bulkAdjustment.adjustmentType) {
          case 'percentage':
            newSalary = currentSalary * (1 + bulkAdjustment.adjustmentValue / 100)
            break
          case 'fixed_amount':
            newSalary = currentSalary + bulkAdjustment.adjustmentValue
            break
          case 'new_structure':
            newSalary = bulkAdjustment.adjustmentValue
            break
        }

        const changeAmount = newSalary - currentSalary
        const changePercentage = currentSalary > 0 ? (changeAmount / currentSalary) * 100 : 0

        preview.push({
          employee,
          currentSalary,
          newSalary,
          changeAmount,
          changePercentage
        })
      }

      setPreviewData(preview)
      setShowPreview(true)
    } catch (error) {
      console.error('Error calculating preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeBulkOperation = async () => {
    if (!previewData.length) return
    
    try {
      setExecuting(true)
      setOperationProgress({ completed: 0, total: previewData.length, current: 'Creating bulk operation...' })

      // Create the bulk operation record
      const { success, operation_id, error } = await salaryHistoryService.createBulkSalaryOperation({
        operation_type: 'mass_increase', // This could be dynamic based on adjustment type
        operation_name: bulkAdjustment.operationName,
        operation_description: bulkAdjustment.changeReason,
        adjustment_type: bulkAdjustment.adjustmentType,
        adjustment_value: bulkAdjustment.adjustmentValue,
        effective_date: bulkAdjustment.effectiveDate,
        employee_ids: Array.from(selectedEmployees),
        preview_data: previewData.map(item => ({
          employee_id: item.employee.id,
          previous_gross_salary: item.currentSalary,
          new_gross_salary: item.newSalary,
          salary_change_amount: item.changeAmount,
          component_changes: {} // This could include specific component changes
        })),
        total_cost_impact: getTotalImpact(),
        created_by: 'current_user' // In real implementation, get from auth context
      })

      if (!success || !operation_id) {
        throw new Error(error || 'Failed to create bulk operation')
      }

      setOperationId(operation_id)
      setOperationProgress({ completed: 0, total: previewData.length, current: 'Executing salary changes...' })

      // Execute the bulk operation
      const { success: execSuccess, results, error: execError } = await salaryHistoryService.executeBulkSalaryOperation(
        operation_id,
        'current_user', // In real implementation, get from auth context
        (progress) => {
          setOperationProgress({
            completed: progress.completed,
            total: progress.total,
            current: progress.current || 'Processing...'
          })
        }
      )

      if (!execSuccess) {
        throw new Error(execError || 'Failed to execute bulk operation')
      }

      // Show success message
      console.log('Bulk operation completed successfully:', results)
      alert(`Bulk operation completed! ${results.successful} successful, ${results.failed} failed.`)

      // Reset form
      setShowPreview(false)
      setSelectedEmployees(new Set())
      setBulkAdjustment({
        adjustmentType: 'percentage',
        adjustmentValue: 0,
        operationName: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        changeReason: ''
      })
      setOperationId(null)

    } catch (error: any) {
      console.error('Error executing bulk operation:', error)
      alert(`Error executing bulk operation: ${error.message}`)
    } finally {
      setExecuting(false)
      setOperationProgress({ completed: 0, total: 0, current: '' })
    }
  }

  const getTotalImpact = () => {
    return previewData.reduce((total, item) => total + item.changeAmount, 0)
  }

  const getAverageIncrease = () => {
    if (previewData.length === 0) return 0
    const totalPercentage = previewData.reduce((total, item) => total + item.changePercentage, 0)
    return totalPercentage / previewData.length
  }

  const handleTemplateApply = (template: any) => {
    // Apply template values to the form
    setBulkAdjustment(prev => ({
      ...prev,
      adjustmentType: template.adjustment_type,
      adjustmentValue: template.adjustment_value || 0,
      operationName: template.template_name,
      changeReason: template.default_reason || ''
    }))

    // If template has department filter, apply it
    if (template.department_filter) {
      filterEmployeesByDepartment(template.department_filter)
    }

    // Switch to operations tab
    setActiveTab('operations')
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard module="payroll">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Bulk Salary Operations</span>
            </div>
            {/* Tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={activeTab === 'operations' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('operations')}
                className={cn(
                  "text-sm",
                  activeTab === 'operations' && "bg-white shadow-sm"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                Operations
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('history')}
                className={cn(
                  "text-sm",
                  activeTab === 'history' && "bg-white shadow-sm"
                )}
              >
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
              <Button
                variant={activeTab === 'templates' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('templates')}
                className={cn(
                  "text-sm",
                  activeTab === 'templates' && "bg-white shadow-sm"
                )}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Templates
              </Button>
              <Button
                variant={activeTab === 'rollback' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('rollback')}
                className={cn(
                  "text-sm",
                  activeTab === 'rollback' && "bg-white shadow-sm"
                )}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Rollback
              </Button>
              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  "text-sm",
                  activeTab === 'analytics' && "bg-white shadow-sm"
                )}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {activeTab === 'operations' 
              ? 'Perform mass salary adjustments across multiple employees with preview and approval workflow'
              : activeTab === 'history'
              ? 'View and manage past bulk salary operations with detailed analytics'
              : activeTab === 'templates'
              ? 'Create and manage reusable operation templates for common salary adjustments'
              : activeTab === 'rollback'
              ? 'Reverse completed bulk operations and restore previous salary states'
              : 'Comprehensive analytics and insights for bulk salary operations'
            }
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {/* Tab Content */}
      {activeTab === 'operations' ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Employee Selection */}
            <div className="lg:col-span-2 space-y-6">
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Select Employees</span>
              </CardTitle>
              <CardDescription>
                Choose employees for bulk salary adjustment ({selectedEmployees.size} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quick Selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                <ActionButton 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleSelectAll}
                >
                  Select All ({employees.length})
                </ActionButton>
                <ActionButton 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </ActionButton>
                
                {/* Department filters */}
                <Select onValueChange={filterEmployeesByDepartment}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="By Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-3 w-3" />
                          <span>{dept}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Position filters */}
                <Select onValueChange={filterEmployeesByPosition}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="By Position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos} value={pos}>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-3 w-3" />
                          <span>{pos}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee List */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <LoadingSkeleton key={i} lines={1} className="h-12" />
                  ))}
                </div>
              ) : employees.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-12 w-12" />}
                  title="No employees found"
                  description="No active employees available for bulk operations"
                />
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {employees.map(employee => (
                    <div 
                      key={employee.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedEmployees.has(employee.id)}
                        onCheckedChange={(checked) => 
                          handleEmployeeSelection(employee.id, checked === true)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{employee.full_name}</p>
                        <p className="text-sm text-gray-600">
                          {employee.position_title} • {employee.department}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {employee.employee_id}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </div>

        {/* Adjustment Settings */}
        <div className="space-y-6">
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Adjustment Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="operation-name">Operation Name</Label>
                <Input
                  id="operation-name"
                  value={bulkAdjustment.operationName}
                  onChange={(e) => setBulkAdjustment(prev => ({
                    ...prev,
                    operationName: e.target.value
                  }))}
                  placeholder="e.g., Annual Salary Review 2024"
                />
              </div>

              <div>
                <Label htmlFor="adjustment-type">Adjustment Type</Label>
                <Select 
                  value={bulkAdjustment.adjustmentType} 
                  onValueChange={(value: AdjustmentType) => 
                    setBulkAdjustment(prev => ({ ...prev, adjustmentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Increase</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="new_structure">New Salary Structure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adjustment-value">
                  {bulkAdjustment.adjustmentType === 'percentage' ? 'Percentage (%)' : 
                   bulkAdjustment.adjustmentType === 'fixed_amount' ? 'Amount (IDR)' : 'New Base Salary (IDR)'}
                </Label>
                <Input
                  id="adjustment-value"
                  type="number"
                  value={bulkAdjustment.adjustmentValue}
                  onChange={(e) => setBulkAdjustment(prev => ({
                    ...prev,
                    adjustmentValue: parseFloat(e.target.value) || 0
                  }))}
                  placeholder={bulkAdjustment.adjustmentType === 'percentage' ? '10' : '1000000'}
                />
              </div>

              <div>
                <Label htmlFor="effective-date">Effective Date</Label>
                <Input
                  id="effective-date"
                  type="date"
                  value={bulkAdjustment.effectiveDate}
                  onChange={(e) => setBulkAdjustment(prev => ({
                    ...prev,
                    effectiveDate: e.target.value
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="change-reason">Change Reason</Label>
                <Textarea
                  id="change-reason"
                  value={bulkAdjustment.changeReason || ''}
                  onChange={(e) => setBulkAdjustment(prev => ({
                    ...prev,
                    changeReason: e.target.value
                  }))}
                  placeholder="Annual performance review, market adjustment, etc."
                  rows={3}
                />
              </div>

              <ActionButton
                variant="primary"
                onClick={calculatePreview}
                disabled={selectedEmployees.size === 0 || !bulkAdjustment.adjustmentValue || !bulkAdjustment.operationName}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Changes ({selectedEmployees.size} employees)
              </ActionButton>
            </CardContent>
          </ProfessionalCard>
        </div>
      </div>

          {/* Progress Section */}
      {executing && (
        <ProfessionalCard>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 animate-spin" />
              <span>Operation in Progress</span>
            </CardTitle>
            <CardDescription>
              Executing bulk salary operation for {operationProgress.total} employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{operationProgress.completed} / {operationProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: operationProgress.total > 0 
                        ? `${(operationProgress.completed / operationProgress.total) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Current Action */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span>{operationProgress.current}</span>
              </div>

              {/* Operation ID */}
              {operationId && (
                <div className="text-xs text-gray-500">
                  Operation ID: {operationId}
                </div>
              )}
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

          {/* Preview Section */}
      {showPreview && previewData.length > 0 && (
        <ProfessionalCard>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Bulk Operation Preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <ActionButton variant="secondary" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Preview
                </ActionButton>
                <ActionButton 
                  variant="primary" 
                  size="sm"
                  onClick={executeBulkOperation}
                  disabled={executing}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {executing ? 'Executing...' : 'Execute Operation'}
                </ActionButton>
              </div>
            </CardTitle>
            <CardDescription>
              Review the impact before executing the bulk salary adjustment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{previewData.length}</p>
                <p className="text-sm text-blue-700">Employees Affected</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalImpact())}
                </p>
                <p className="text-sm text-green-700">Total Cost Impact</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {getAverageIncrease().toFixed(1)}%
                </p>
                <p className="text-sm text-purple-700">Average Increase</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(getTotalImpact() * 12)}
                </p>
                <p className="text-sm text-yellow-700">Annual Impact</p>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-700">Employee</th>
                    <th className="text-left p-3 font-medium text-gray-700">Department</th>
                    <th className="text-right p-3 font-medium text-gray-700">Current Salary</th>
                    <th className="text-right p-3 font-medium text-gray-700">New Salary</th>
                    <th className="text-right p-3 font-medium text-gray-700">Change</th>
                    <th className="text-right p-3 font-medium text-gray-700">%</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map(item => (
                    <tr key={item.employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.employee.full_name}</p>
                          <p className="text-xs text-gray-600">{item.employee.position_title}</p>
                        </div>
                      </td>
                      <td className="p-3 text-gray-700">{item.employee.department}</td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(item.currentSalary)}
                      </td>
                      <td className="p-3 text-right font-medium text-green-600">
                        {formatCurrency(item.newSalary)}
                      </td>
                      <td className="p-3 text-right">
                        <span className={cn(
                          "font-medium",
                          item.changeAmount > 0 ? "text-green-600" : 
                          item.changeAmount < 0 ? "text-red-600" : "text-gray-600"
                        )}>
                          {item.changeAmount > 0 ? '+' : ''}{formatCurrency(item.changeAmount)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={cn(
                          "font-medium",
                          item.changePercentage > 0 ? "text-green-600" : 
                          item.changePercentage < 0 ? "text-red-600" : "text-gray-600"
                        )}>
                          {item.changePercentage > 0 ? '+' : ''}{item.changePercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}
        </>
      ) : activeTab === 'history' ? (
        <BulkOperationHistory />
      ) : activeTab === 'templates' ? (
        <BulkOperationTemplates 
          onTemplateApply={handleTemplateApply}
        />
      ) : activeTab === 'rollback' ? (
        <BulkOperationRollback />
      ) : (
        <BulkOperationAnalytics />
      )}
    </div>
  )
}