"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Users, 
  RefreshCw,
  AlertTriangle,
  CheckCircle 
} from "lucide-react"
import { PayrollService } from "@/lib/services/payroll"
import { EmployeeService } from "@/lib/services/employees"
import { formatCurrency } from "@/lib/utils/validation"
import { 
  calculateEmployeePayroll, 
  calculatePayrollTotals,
  type PayrollCalculationInput,
  type PayrollCalculationResult 
} from "@/lib/calculations/payroll"
import type { Employee, SalaryComponent } from "@/lib/types/database"

interface CalculationPreviewProps {
  payrollId: string
  variableData?: Record<string, {
    bonus?: number
    overtime_pay?: number
    other_allowances?: number
    other_deductions?: number
  }>
  onCalculationComplete?: (results: PayrollCalculationResult[]) => void
}

const payrollService = new PayrollService()
const employeeService = new EmployeeService()

export function CalculationPreview({ payrollId, variableData = {}, onCalculationComplete }: CalculationPreviewProps) {
  const [calculations, setCalculations] = useState<PayrollCalculationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null)
  const [validationIssues, setValidationIssues] = useState<any[]>([])

  useEffect(() => {
    if (Object.keys(variableData).length > 0) {
      calculatePreview()
    }
  }, [variableData, payrollId])

  const calculatePreview = async () => {
    try {
      setLoading(true)
      
      // Get all active employees
      const { employees } = await employeeService.getEmployees({ status: 'active' })
      
      const calculationResults: PayrollCalculationResult[] = []
      const issues: any[] = []
      
      // Calculate for each employee
      for (const employee of employees) {
        try {
          const salaryComponents = await employeeService.getSalaryComponents(employee.id)
          
          // Check if employee has basic salary
          const hasBasicSalary = salaryComponents.some(
            component => component.component_type === 'basic_salary' && component.is_active
          )
          
          if (!hasBasicSalary) {
            issues.push({
              type: 'missing_basic_salary',
              employee: employee.full_name,
              employeeId: employee.employee_id,
              message: 'No active basic salary component'
            })
            continue
          }
          
          const variables = variableData[employee.id] || {
            bonus: 0,
            overtime_pay: 0,
            other_allowances: 0,
            other_deductions: 0
          }
          
          const input: PayrollCalculationInput = {
            employee,
            salaryComponents,
            variableComponents: variables
          }
          
          const result = calculateEmployeePayroll(input)
          calculationResults.push(result)
          
          // Check for potential issues
          if (result.netSalary <= 0) {
            issues.push({
              type: 'zero_net_salary',
              employee: employee.full_name,
              employeeId: employee.employee_id,
              netSalary: result.netSalary,
              message: 'Net salary is zero or negative'
            })
          }
          
        } catch (error: any) {
          issues.push({
            type: 'calculation_error',
            employee: employee.full_name,
            employeeId: employee.employee_id,
            message: error.message
          })
        }
      }
      
      setCalculations(calculationResults)
      setValidationIssues(issues)
      setLastCalculated(new Date())
      
      if (onCalculationComplete) {
        onCalculationComplete(calculationResults)
      }
      
    } catch (error) {
      console.error('Error calculating preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const totals = calculations.length > 0 ? calculatePayrollTotals(calculations) : {
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalPph21: 0,
    totalBpjsCompany: 0,
    totalBpjsEmployee: 0,
    totalNetSalary: 0,
  }

  const averageNetSalary = totals.totalEmployees > 0 ? totals.totalNetSalary / totals.totalEmployees : 0
  const totalCost = totals.totalNetSalary + totals.totalBpjsCompany
  
  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Calculation Preview</h3>
          <p className="text-sm text-muted-foreground">
            {lastCalculated 
              ? `Last calculated: ${lastCalculated.toLocaleTimeString()}`
              : 'Click calculate to preview payroll'}
          </p>
        </div>
        <Button onClick={calculatePreview} disabled={loading}>
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Calculating...' : 'Calculate Preview'}
        </Button>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Validation Issues ({validationIssues.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationIssues.slice(0, 5).map((issue, index) => (
                <div key={index} className="text-sm text-orange-800">
                  <span className="font-medium">{issue.employee} ({issue.employeeId}):</span>
                  <span className="ml-1">{issue.message}</span>
                </div>
              ))}
              {validationIssues.length > 5 && (
                <p className="text-sm text-orange-700">
                  ... and {validationIssues.length - 5} more issues
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Employees</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {validationIssues.length > 0 && `${validationIssues.length} with issues`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalGrossSalary)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(averageNetSalary)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalPph21 + totals.totalBpjsEmployee)}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>PPh 21: {formatCurrency(totals.totalPph21)}</div>
              <div>BPJS: {formatCurrency(totals.totalBpjsEmployee)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.totalNetSalary)}
            </div>
            <p className="text-xs text-muted-foreground">
              Company cost: {formatCurrency(totalCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Calculation Breakdown</span>
            </CardTitle>
            <CardDescription>
              Detailed analysis of payroll calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tax Analysis */}
              <div className="space-y-4">
                <h4 className="font-medium">Tax Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Gross Salary:</span>
                    <span className="font-mono">{formatCurrency(totals.totalGrossSalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total PPh 21:</span>
                    <span className="font-mono">{formatCurrency(totals.totalPph21)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax Rate (avg):</span>
                    <span className="font-mono">
                      {totals.totalGrossSalary > 0 
                        ? ((totals.totalPph21 / totals.totalGrossSalary) * 100).toFixed(2)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* BPJS Analysis */}
              <div className="space-y-4">
                <h4 className="font-medium">BPJS Contributions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Employee BPJS:</span>
                    <span className="font-mono">{formatCurrency(totals.totalBpjsEmployee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Company BPJS:</span>
                    <span className="font-mono">{formatCurrency(totals.totalBpjsCompany)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total BPJS:</span>
                    <span className="font-mono">
                      {formatCurrency(totals.totalBpjsEmployee + totals.totalBpjsCompany)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bars */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Net vs Gross Salary Ratio</span>
                  <span>{totals.totalGrossSalary > 0 ? ((totals.totalNetSalary / totals.totalGrossSalary) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={totals.totalGrossSalary > 0 ? (totals.totalNetSalary / totals.totalGrossSalary) * 100 : 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Company Cost vs Net Payroll</span>
                  <span>{totals.totalNetSalary > 0 ? ((totalCost / totals.totalNetSalary) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={totals.totalNetSalary > 0 ? (totalCost / totals.totalNetSalary) * 100 : 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Calculation Status */}
      {calculations.length > 0 && validationIssues.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Calculations Complete</p>
                <p className="text-sm text-green-700">
                  All {totals.totalEmployees} employees processed successfully. Ready for finalization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}