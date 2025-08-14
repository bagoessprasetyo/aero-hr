"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Edit, 
  Save, 
  X, 
  DollarSign, 
  AlertCircle,
  Search,
  Filter,
  Users,
  TrendingUp,
  Clock,
  Calculator,
  CheckCircle,
  Plus,
  Minus,
  RotateCcw,
  Download,
  Upload,
  Target,
  Zap,
  Eye,
  EyeOff
} from "lucide-react"
import { EmployeeService } from "@/lib/services/employees"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { Employee } from "@/lib/types/database"
import { 
  ProfessionalCard, 
  DashboardWidget, 
  StatusBadge, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton 
} from "@/components/ui/professional"
import { cn } from "@/lib/utils"

interface VariableComponentData {
  employee_id: string
  bonus: number
  overtime_pay: number
  other_allowances: number
  other_deductions: number
}

interface VariableInputFormProps {
  payrollId: string
  onVariablesUpdated: () => void
}

const employeeService = new EmployeeService()
const payrollService = new PayrollService()

export function VariableInputForm({ payrollId, onVariablesUpdated }: VariableInputFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [variableData, setVariableData] = useState<Record<string, VariableComponentData>>({})
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"all" | "with-variables" | "zero-only">("all")
  const [autoSave, setAutoSave] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [editForm, setEditForm] = useState({
    bonus: 0,
    overtime_pay: 0,
    other_allowances: 0,
    other_deductions: 0
  })

  useEffect(() => {
    loadData()
  }, [payrollId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load active employees
      const { employees } = await employeeService.getEmployees({ status: 'active' })
      setEmployees(employees)

      // Initialize variable data for all employees
      const initialData: Record<string, VariableComponentData> = {}
      employees.forEach(employee => {
        initialData[employee.id] = {
          employee_id: employee.id,
          bonus: 0,
          overtime_pay: 0,
          other_allowances: 0,
          other_deductions: 0
        }
      })
      setVariableData(initialData)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditEmployee = (employeeId: string) => {
    const data = variableData[employeeId]
    setEditForm({
      bonus: data.bonus,
      overtime_pay: data.overtime_pay,
      other_allowances: data.other_allowances,
      other_deductions: data.other_deductions
    })
    setEditingEmployee(employeeId)
  }

  const handleSaveEmployee = () => {
    if (!editingEmployee) return

    setVariableData(prev => ({
      ...prev,
      [editingEmployee]: {
        ...prev[editingEmployee],
        ...editForm
      }
    }))
    setEditingEmployee(null)
  }

  const handleCancelEdit = () => {
    setEditingEmployee(null)
    setEditForm({ bonus: 0, overtime_pay: 0, other_allowances: 0, other_deductions: 0 })
  }

  const handleBulkUpdate = async () => {
    try {
      setSaving(true)
      
      // Convert to array format for service
      const updates = Object.values(variableData)
      
      await payrollService.updateVariableComponents(payrollId, updates)
      
      onVariablesUpdated()
      
    } catch (error: any) {
      alert(`Error updating variables: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getTotalVariables = (employeeId: string) => {
    const data = variableData[employeeId]
    if (!data) return 0
    
    return data.bonus + data.overtime_pay + data.other_allowances - data.other_deductions
  }

  const hasVariables = (employeeId: string) => {
    return getTotalVariables(employeeId) !== 0
  }

  // Enhanced filtering and data processing
  const filteredEmployees = useMemo(() => {
    let filtered = employees
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(emp => 
        emp.full_name.toLowerCase().includes(term) ||
        emp.employee_id.toLowerCase().includes(term) ||
        emp.department_id?.toLowerCase().includes(term)
      )
    }
    
    // Apply department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter(emp => emp.department_id === filterDepartment)
    }
    
    // Apply view mode filter
    switch (viewMode) {
      case "with-variables":
        filtered = filtered.filter(emp => hasVariables(emp.id))
        break
      case "zero-only":
        filtered = filtered.filter(emp => !hasVariables(emp.id))
        break
    }
    
    return filtered
  }, [employees, searchTerm, filterDepartment, viewMode, variableData])
  
  const availableDepartments = useMemo(() => {
    const departments = new Set(employees.map(emp => emp.department_id).filter(Boolean))
    return Array.from(departments)
  }, [employees])

  const getOverallStats = () => {
    const totalBonus = Object.values(variableData).reduce((sum, data) => sum + data.bonus, 0)
    const totalOvertime = Object.values(variableData).reduce((sum, data) => sum + data.overtime_pay, 0)
    const totalAllowances = Object.values(variableData).reduce((sum, data) => sum + data.other_allowances, 0)
    const totalDeductions = Object.values(variableData).reduce((sum, data) => sum + data.other_deductions, 0)
    const employeesWithVariables = Object.keys(variableData).filter(id => hasVariables(id)).length
    const processedEmployees = filteredEmployees.length

    return {
      totalBonus,
      totalOvertime,
      totalAllowances,
      totalDeductions,
      employeesWithVariables,
      processedEmployees,
      netTotal: totalBonus + totalOvertime + totalAllowances - totalDeductions
    }
  }

  const stats = getOverallStats()
  
  const clearAllVariables = () => {
    const clearedData: Record<string, VariableComponentData> = {}
    employees.forEach(employee => {
      clearedData[employee.id] = {
        employee_id: employee.id,
        bonus: 0,
        overtime_pay: 0,
        other_allowances: 0,
        other_deductions: 0
      }
    })
    setVariableData(clearedData)
  }
  
  const presetBonusAmount = (amount: number) => {
    const updatedData = { ...variableData }
    filteredEmployees.forEach(employee => {
      updatedData[employee.id] = {
        ...updatedData[employee.id],
        bonus: amount
      }
    })
    setVariableData(updatedData)
  }
  
  // Auto-save functionality  
  useEffect(() => {
    if (!autoSave) return
    
    const timer = setTimeout(() => {
      const hasChanges = Object.values(variableData).some(data => 
        data.bonus > 0 || data.overtime_pay > 0 || data.other_allowances > 0 || data.other_deductions > 0
      )
      
      if (hasChanges) {
        handleBulkUpdate()
      }
    }, 3000) // Auto-save after 3 seconds of inactivity
    
    return () => clearTimeout(timer)
  }, [variableData, autoSave])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))}
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardWidget
          title="Total Bonus"
          value={formatCurrency(stats.totalBonus)}
          subtitle={`Across ${stats.employeesWithVariables} employees`}
          icon={TrendingUp}
          trend={stats.totalBonus > 0 ? {
            value: 100,
            isPositive: true,
            label: "performance rewards"
          } : undefined}
        />
        
        <DashboardWidget
          title="Overtime Pay"
          value={formatCurrency(stats.totalOvertime)}
          subtitle="Extra hours compensation"
          icon={Clock}
          trend={stats.totalOvertime > 0 ? {
            value: 85,
            isPositive: true,
            label: "productive hours"
          } : undefined}
        />
        
        <DashboardWidget
          title="Net Adjustments"
          value={formatCurrency(stats.totalAllowances - stats.totalDeductions)}
          subtitle="Allowances minus deductions"
          icon={Calculator}
          trend={{
            value: stats.totalAllowances > stats.totalDeductions ? 12.5 : -8.2,
            isPositive: stats.totalAllowances >= stats.totalDeductions,
            label: "net impact"
          }}
        />
        
        <DashboardWidget
          title="Affected Employees"
          value={`${stats.employeesWithVariables}/${stats.processedEmployees}`}
          subtitle="Employees with variable pay"
          icon={Users}
          trend={stats.employeesWithVariables > 0 ? {
            value: (stats.employeesWithVariables / stats.processedEmployees) * 100,
            isPositive: true,
            label: "coverage rate"
          } : undefined}
        />
      </div>

      {/* Enhanced Controls & Filters */}
      <ProfessionalCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Variable Components Management</span>
              </CardTitle>
              <CardDescription>
                Add and manage bonus, overtime, allowances, and deductions for employees
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {lastSaved && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Saved {lastSaved.toLocaleTimeString('id-ID')}</span>
                </div>
              )}
              
              <StatusBadge 
                status={autoSave ? "success" : "inactive"}
                className="cursor-pointer"
                onClick={() => setAutoSave(!autoSave)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Auto-save {autoSave ? "ON" : "OFF"}
              </StatusBadge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {availableDepartments.map(dept => (
                  <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🧑‍💼 All Employees</SelectItem>
                <SelectItem value="with-variables">💰 With Variables</SelectItem>
                <SelectItem value="zero-only">📝 Zero Values Only</SelectItem>
              </SelectContent>
            </Select>
            
            <ActionButton
              variant={showPreview ? "primary" : "secondary"}
              onClick={() => setShowPreview(!showPreview)}
              className="w-full"
            >
              {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showPreview ? "Hide" : "Show"} Preview
            </ActionButton>
          </div>
          
          {/* Quick Action Presets */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Quick Actions</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              <ActionButton variant="secondary" size="sm" onClick={() => presetBonusAmount(500000)}>
                <Plus className="mr-1 h-3 w-3" />
                Rp 500K Bonus
              </ActionButton>
              <ActionButton variant="secondary" size="sm" onClick={() => presetBonusAmount(1000000)}>
                <Plus className="mr-1 h-3 w-3" />
                Rp 1M Bonus
              </ActionButton>
              <ActionButton variant="secondary" size="sm" onClick={clearAllVariables}>
                <RotateCcw className="mr-1 h-3 w-3" />
                Clear All
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Upload className="mr-1 h-3 w-3" />
                Import CSV
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Download className="mr-1 h-3 w-3" />
                Export
              </ActionButton>
            </div>
          </div>

          {/* Enhanced Data Grid */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="font-medium text-gray-900">Employee Variable Data</h3>
                  <Badge variant="outline">
                    {filteredEmployees.length} of {employees.length} employees
                  </Badge>
                </div>
                <ActionButton 
                  variant="primary" 
                  onClick={handleBulkUpdate} 
                  disabled={saving}
                  size="sm"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </ActionButton>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Other Allowances</TableHead>
                  <TableHead>Other Deductions</TableHead>
                  <TableHead>Net Variable</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState
                        icon={Search}
                        title="No employees found"
                        description="Try adjusting your search or filter criteria"
                        className="py-12"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => {
                  const data = variableData[employee.id] || {
                    employee_id: employee.id,
                    bonus: 0,
                    overtime_pay: 0,
                    other_allowances: 0,
                    other_deductions: 0
                  }
                  const isEditing = editingEmployee === employee.id
                  const netVariable = getTotalVariables(employee.id)

                  return (
                    <TableRow 
                      key={employee.id}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        hasVariables(employee.id) && "bg-blue-50/50",
                        isEditing && "bg-yellow-50 border-l-4 border-yellow-400"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Users className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{employee.full_name}</div>
                            <div className="text-sm text-gray-500">{employee.department_id || 'No Department'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {employee.employee_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={editForm.bonus}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))}
                            className="w-24"
                          />
                        ) : (
                          <span className={data.bonus > 0 ? "font-medium text-green-600" : "text-muted-foreground"}>
                            {data.bonus > 0 ? formatCurrency(data.bonus) : "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={editForm.overtime_pay}
                            onChange={(e) => setEditForm(prev => ({ ...prev, overtime_pay: parseFloat(e.target.value) || 0 }))}
                            className="w-24"
                          />
                        ) : (
                          <span className={data.overtime_pay > 0 ? "font-medium text-blue-600" : "text-muted-foreground"}>
                            {data.overtime_pay > 0 ? formatCurrency(data.overtime_pay) : "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={editForm.other_allowances}
                            onChange={(e) => setEditForm(prev => ({ ...prev, other_allowances: parseFloat(e.target.value) || 0 }))}
                            className="w-24"
                          />
                        ) : (
                          <span className={data.other_allowances > 0 ? "font-medium text-purple-600" : "text-muted-foreground"}>
                            {data.other_allowances > 0 ? formatCurrency(data.other_allowances) : "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={editForm.other_deductions}
                            onChange={(e) => setEditForm(prev => ({ ...prev, other_deductions: parseFloat(e.target.value) || 0 }))}
                            className="w-24"
                          />
                        ) : (
                          <span className={data.other_deductions > 0 ? "font-medium text-red-600" : "text-muted-foreground"}>
                            {data.other_deductions > 0 ? formatCurrency(data.other_deductions) : "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${
                          netVariable > 0 ? "text-green-600" : 
                          netVariable < 0 ? "text-red-600" : 
                          "text-muted-foreground"
                        }`}>
                          {netVariable !== 0 ? formatCurrency(netVariable) : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex space-x-1">
                            <ActionButton 
                              variant="primary" 
                              size="sm" 
                              onClick={handleSaveEmployee}
                            >
                              <Save className="h-3 w-3" />
                            </ActionButton>
                            <ActionButton 
                              variant="secondary" 
                              size="sm" 
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </ActionButton>
                          </div>
                        ) : (
                          <ActionButton 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleEditEmployee(employee.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </ActionButton>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
                )}
              </TableBody>
            </Table>
          </div>
          
        </CardContent>
      </ProfessionalCard>
      
      {/* Enhanced Summary and Impact Preview */}
      {showPreview && stats.netTotal !== 0 && (
        <ProfessionalCard variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-gray-600" />
              <span>Variable Impact Preview</span>
            </CardTitle>
            <CardDescription>
              Real-time calculation of variable components impact on payroll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Impact Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Component Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Total Bonus</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(stats.totalBonus)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total Overtime</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(stats.totalOvertime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Allowances</span>
                    </div>
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(stats.totalAllowances)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Deductions</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(stats.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Net Impact */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Payroll Impact</h4>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Net Variable Impact</p>
                    <p className={cn(
                      "text-3xl font-bold",
                      stats.netTotal > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {stats.netTotal > 0 ? "+" : ""}{formatCurrency(stats.netTotal)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Affecting {stats.employeesWithVariables} employees
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Impact on Final Payroll</p>
                      <p>
                        This amount will be {stats.netTotal > 0 ? "added to" : "deducted from"} the 
                        gross salary calculation when payroll is processed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}
    </div>
  )
}