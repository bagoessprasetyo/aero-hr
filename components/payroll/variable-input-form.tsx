"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Edit, 
  Save, 
  X, 
  DollarSign, 
  AlertCircle
} from "lucide-react"
import { EmployeeService } from "@/lib/services/employees"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { Employee } from "@/lib/types/database"

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

  const getOverallStats = () => {
    const totalBonus = Object.values(variableData).reduce((sum, data) => sum + data.bonus, 0)
    const totalOvertime = Object.values(variableData).reduce((sum, data) => sum + data.overtime_pay, 0)
    const totalAllowances = Object.values(variableData).reduce((sum, data) => sum + data.other_allowances, 0)
    const totalDeductions = Object.values(variableData).reduce((sum, data) => sum + data.other_deductions, 0)
    const employeesWithVariables = Object.keys(variableData).filter(id => hasVariables(id)).length

    return {
      totalBonus,
      totalOvertime,
      totalAllowances,
      totalDeductions,
      employeesWithVariables,
      netTotal: totalBonus + totalOvertime + totalAllowances - totalDeductions
    }
  }

  const stats = getOverallStats()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bonus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBonus)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Overtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOvertime)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Allowances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAllowances - stats.totalDeductions)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employeesWithVariables}</div>
            <p className="text-xs text-muted-foreground">with variables</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Input Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Variable Components</span>
              </CardTitle>
              <CardDescription>
                Add bonus, overtime, allowances, and deductions for each employee
              </CardDescription>
            </div>
            <Button onClick={handleBulkUpdate} disabled={saving}>
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                {employees.map((employee) => {
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
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.full_name}</div>
                          <div className="text-sm text-muted-foreground">{employee.department_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{employee.employee_id}</span>
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
                            <Button size="sm" onClick={handleSaveEmployee}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditEmployee(employee.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {stats.netTotal !== 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">
                    Total Variable Impact: {formatCurrency(stats.netTotal)}
                  </p>
                  <p className="text-blue-700">
                    This will be added to the gross salary calculation for {stats.employeesWithVariables} employees
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}