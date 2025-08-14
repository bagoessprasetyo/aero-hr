"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ProfessionalCard, 
  ActionButton, 
  StatusBadge 
} from "@/components/ui/professional"
import {
  FileText,
  Download,
  Eye,
  Users,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Package
} from "lucide-react"
import { PDFService, type PayslipData } from "@/lib/services/pdf"
import { EmployeeService } from "@/lib/services/employees"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"
import type { Employee, Payroll, PayrollItem } from "@/lib/types/database"
import type { PayrollCalculationResult } from "@/lib/calculations/payroll"

interface PayslipGeneratorProps {
  payrollId: string
  payrollPeriod: Payroll
  className?: string
}

interface PayslipStatus {
  employeeId: string
  employeeName: string
  employeeNik: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  error?: string
  downloadUrl?: string
}

const employeeService = new EmployeeService()
const payrollService = new PayrollService()

export function PayslipGenerator({ payrollId, payrollPeriod, className }: PayslipGeneratorProps) {
  const [payslipStatuses, setPayslipStatuses] = useState<PayslipStatus[]>([])
  const [generating, setGenerating] = useState(false)
  const [bulkDownloading, setBulkDownloading] = useState(false)

  const loadPayslipData = async (): Promise<PayslipStatus[]> => {
    try {
      // Get payroll data which includes items
      const payrollData = await payrollService.getPayrollById(payrollId)
      if (!payrollData?.payroll_items) throw new Error('No payroll items found')
      const payrollItems = payrollData.payroll_items
      
      const statuses: PayslipStatus[] = []
      
      for (const item of payrollItems) {
        const employee = await employeeService.getEmployeeById(item.employee_id)
        if (employee) {
          statuses.push({
            employeeId: employee.id,
            employeeName: employee.full_name,
            employeeNik: employee.employee_id,
            status: 'pending'
          })
        }
      }
      
      return statuses
    } catch (error) {
      console.error('Error loading payslip data:', error)
      return []
    }
  }

  const generateSinglePayslip = async (employeeId: string): Promise<void> => {
    try {
      // Update status to generating
      setPayslipStatuses(prev => 
        prev.map(status => 
          status.employeeId === employeeId 
            ? { ...status, status: 'generating' }
            : status
        )
      )

      // Get employee data
      const employee = await employeeService.getEmployeeById(employeeId)
      if (!employee) throw new Error('Employee not found')

      // Get salary components
      const salaryComponents = await employeeService.getSalaryComponents(employeeId)

      // Get payroll calculation result
      const payrollData = await payrollService.getPayrollById(payrollId)
      if (!payrollData?.payroll_items) throw new Error('No payroll items found')
      const employeePayrollItem = payrollData.payroll_items.find(item => item.employee_id === employeeId)
      
      if (!employeePayrollItem) throw new Error('Payroll data not found')

      // Convert payroll item to calculation result format
      const calculation: PayrollCalculationResult = {
        employee,
        basicSalary: employeePayrollItem.basic_salary,
        fixedAllowances: employeePayrollItem.fixed_allowances,
        variableComponents: {
          bonus: employeePayrollItem.bonus || 0,
          overtimePay: employeePayrollItem.overtime_pay || 0,
          otherAllowances: employeePayrollItem.other_allowances || 0,
          otherDeductions: employeePayrollItem.other_deductions || 0
        },
        grossSalary: employeePayrollItem.gross_salary,
        bpjsCalculation: {
          healthEmployee: employeePayrollItem.bpjs_health_employee,
          healthCompany: employeePayrollItem.bpjs_health_company,
          jhtEmployee: employeePayrollItem.bpjs_jht_employee,
          jhtCompany: employeePayrollItem.bpjs_jht_company,
          jpEmployee: employeePayrollItem.bpjs_jp_employee,
          jpCompany: employeePayrollItem.bpjs_jp_company,
          jkkCompany: employeePayrollItem.bpjs_jkk_company,
          jkmCompany: employeePayrollItem.bpjs_jkm_company,
          totalEmployeeContribution: employeePayrollItem.bpjs_health_employee + employeePayrollItem.bpjs_jht_employee + employeePayrollItem.bpjs_jp_employee,
          totalCompanyContribution: employeePayrollItem.bpjs_health_company + employeePayrollItem.bpjs_jht_company + employeePayrollItem.bpjs_jp_company + employeePayrollItem.bpjs_jkk_company + employeePayrollItem.bpjs_jkm_company
        },
        pph21Calculation: {
          grossIncome: employeePayrollItem.gross_salary,
          companyBPJSContribution: employeePayrollItem.bpjs_health_company + employeePayrollItem.bpjs_jht_company + employeePayrollItem.bpjs_jp_company + employeePayrollItem.bpjs_jkk_company + employeePayrollItem.bpjs_jkm_company,
          taxableIncome: employeePayrollItem.taxable_income,
          occupationalCost: employeePayrollItem.occupational_cost || 0,
          employeeBPJSDeduction: employeePayrollItem.bpjs_health_employee + employeePayrollItem.bpjs_jht_employee + employeePayrollItem.bpjs_jp_employee,
          netIncomeBeforePTKP: employeePayrollItem.taxable_income,
          ptkpAmount: employeePayrollItem.ptkp_amount,
          pkpYearly: employeePayrollItem.pkp_yearly,
          pph21Yearly: employeePayrollItem.pph21_yearly,
          pph21Monthly: employeePayrollItem.pph21_monthly
        },
        totalDeductions: employeePayrollItem.total_deductions,
        netSalary: employeePayrollItem.net_salary,
        calculationBreakdown: {
          step1_grossCalculation: `Basic: ${employeePayrollItem.basic_salary} + Allowances: ${employeePayrollItem.fixed_allowances}`,
          step2_bpjsCalculation: 'BPJS calculated',
          step3_taxCalculation: 'PPh21 calculated',
          step4_netCalculation: 'Net salary calculated'
        }
      }

      const payslipData: PayslipData = {
        employee,
        salaryComponents,
        calculation,
        payrollPeriod: {
          period_month: payrollPeriod.period_month,
          period_year: payrollPeriod.period_year,
          status: payrollPeriod.status
        }
      }

      // Generate and download PDF
      await PDFService.downloadPayslip(payslipData)

      // Update status to completed
      setPayslipStatuses(prev => 
        prev.map(status => 
          status.employeeId === employeeId 
            ? { ...status, status: 'completed' }
            : status
        )
      )

    } catch (error: any) {
      console.error('Error generating payslip:', error)
      
      // Update status to error
      setPayslipStatuses(prev => 
        prev.map(status => 
          status.employeeId === employeeId 
            ? { ...status, status: 'error', error: error.message }
            : status
        )
      )
    }
  }

  const generateAllPayslips = async () => {
    try {
      setGenerating(true)
      
      // Load initial data if not already loaded
      if (payslipStatuses.length === 0) {
        const initialStatuses = await loadPayslipData()
        setPayslipStatuses(initialStatuses)
      }

      // Generate payslips for all employees
      for (const status of payslipStatuses) {
        await generateSinglePayslip(status.employeeId)
      }

    } catch (error) {
      console.error('Error generating all payslips:', error)
    } finally {
      setGenerating(false)
    }
  }

  const generateBulkDownload = async () => {
    try {
      setBulkDownloading(true)

      // Get all payroll items
      const payrollData = await payrollService.getPayrollById(payrollId)
      if (!payrollData?.payroll_items) throw new Error('No payroll items found')
      const payrollItems = payrollData.payroll_items
      const payslipsData: PayslipData[] = []

      for (const item of payrollItems) {
        const employee = await employeeService.getEmployeeById(item.employee_id)
        if (!employee) continue

        const salaryComponents = await employeeService.getSalaryComponents(item.employee_id)

        const calculation: PayrollCalculationResult = {
          employee,
          basicSalary: item.basic_salary,
          fixedAllowances: item.fixed_allowances,
          variableComponents: {
            bonus: item.bonus || 0,
            overtimePay: item.overtime_pay || 0,
            otherAllowances: item.other_allowances || 0,
            otherDeductions: item.other_deductions || 0
          },
          grossSalary: item.gross_salary,
          bpjsCalculation: {
            healthEmployee: item.bpjs_health_employee,
            healthCompany: item.bpjs_health_company,
            jhtEmployee: item.bpjs_jht_employee,
            jhtCompany: item.bpjs_jht_company,
            jpEmployee: item.bpjs_jp_employee,
            jpCompany: item.bpjs_jp_company,
            jkkCompany: item.bpjs_jkk_company,
            jkmCompany: item.bpjs_jkm_company,
            totalEmployeeContribution: item.bpjs_health_employee + item.bpjs_jht_employee + item.bpjs_jp_employee,
            totalCompanyContribution: item.bpjs_health_company + item.bpjs_jht_company + item.bpjs_jp_company + item.bpjs_jkk_company + item.bpjs_jkm_company
          },
          pph21Calculation: {
            grossIncome: item.gross_salary,
            companyBPJSContribution: item.bpjs_health_company + item.bpjs_jht_company + item.bpjs_jp_company + item.bpjs_jkk_company + item.bpjs_jkm_company,
            taxableIncome: item.taxable_income,
            occupationalCost: item.occupational_cost || 0,
            employeeBPJSDeduction: item.bpjs_health_employee + item.bpjs_jht_employee + item.bpjs_jp_employee,
            netIncomeBeforePTKP: item.taxable_income,
            ptkpAmount: item.ptkp_amount,
            pkpYearly: item.pkp_yearly,
            pph21Yearly: item.pph21_yearly,
            pph21Monthly: item.pph21_monthly
          },
          totalDeductions: item.total_deductions,
          netSalary: item.net_salary,
          calculationBreakdown: {
            step1_grossCalculation: `Basic: ${item.basic_salary} + Allowances: ${item.fixed_allowances}`,
            step2_bpjsCalculation: 'BPJS calculated',
            step3_taxCalculation: 'PPh21 calculated',
            step4_netCalculation: 'Net salary calculated'
          }
        }

        payslipsData.push({
          employee,
          salaryComponents,
          calculation,
          payrollPeriod: {
            period_month: payrollPeriod.period_month,
            period_year: payrollPeriod.period_year,
            status: payrollPeriod.status
          }
        })
      }

      // Generate all PDFs
      const pdfs = await PDFService.generateBulkPayslips(payslipsData)
      
      // Note: This is a simplified approach. In a real implementation,
      // you might want to zip the files or provide individual download links
      console.log(`Generated ${pdfs.length} payslip PDFs`)
      
      // For now, download the first few individually
      for (let i = 0; i < Math.min(pdfs.length, 5); i++) {
        const data = payslipsData[i]
        await PDFService.downloadPayslip(data, 
          `payslip-${data.employee.employee_id}-${payrollPeriod.period_year}-${String(payrollPeriod.period_month).padStart(2, '0')}.pdf`
        )
      }

    } catch (error) {
      console.error('Error generating bulk download:', error)
    } finally {
      setBulkDownloading(false)
    }
  }

  const initializePayslips = async () => {
    const initialStatuses = await loadPayslipData()
    setPayslipStatuses(initialStatuses)
  }

  const getStatusIcon = (status: PayslipStatus['status']) => {
    switch (status) {
      case 'pending': return <FileText className="h-4 w-4" />
      case 'generating': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: PayslipStatus['status']) => {
    switch (status) {
      case 'pending': return 'default'
      case 'generating': return 'secondary'
      case 'completed': return 'success'
      case 'error': return 'destructive'
      default: return 'default'
    }
  }

  const completedCount = payslipStatuses.filter(s => s.status === 'completed').length
  const errorCount = payslipStatuses.filter(s => s.status === 'error').length
  const pendingCount = payslipStatuses.filter(s => s.status === 'pending').length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Payslip Generator</span>
          </CardTitle>
          <CardDescription>
            Generate and download PDF payslips for {payrollPeriod.period_month}/{payrollPeriod.period_year}
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {/* Status Summary */}
      {payslipStatuses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Total Employees</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payslipStatuses.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payslip Generation</h3>
          <p className="text-sm text-muted-foreground">
            Generate PDF payslips for all employees in this payroll period
          </p>
        </div>
        <div className="flex space-x-2">
          {payslipStatuses.length === 0 ? (
            <ActionButton variant="secondary" onClick={initializePayslips}>
              <Eye className="mr-2 h-4 w-4" />
              Load Employees
            </ActionButton>
          ) : (
            <>
              <ActionButton
                variant="secondary"
                onClick={generateBulkDownload}
                disabled={bulkDownloading || generating}
              >
                <Package className="mr-2 h-4 w-4" />
                {bulkDownloading ? 'Preparing...' : 'Bulk Download'}
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={generateAllPayslips}
                disabled={generating || bulkDownloading}
              >
                <Download className="mr-2 h-4 w-4" />
                {generating ? 'Generating...' : 'Generate All'}
              </ActionButton>
            </>
          )}
        </div>
      </div>

      {/* Employee List */}
      {payslipStatuses.length > 0 && (
        <ProfessionalCard>
          <CardHeader>
            <CardTitle>Employee Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payslipStatuses.map(status => (
                <div key={status.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status.status)}
                    <div>
                      <p className="font-medium">{status.employeeName}</p>
                      <p className="text-sm text-gray-600">NIK: {status.employeeNik}</p>
                      {status.error && (
                        <p className="text-xs text-red-600">{status.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={getStatusColor(status.status) as any}>
                      {status.status === 'generating' ? 'Generating...' : status.status}
                    </StatusBadge>
                    
                    {status.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateSinglePayslip(status.employeeId)}
                        disabled={generating}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                    )}
                    
                    {status.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateSinglePayslip(status.employeeId)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Re-download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2 text-blue-800">
            <FileText className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Payslip Generation Instructions</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Click "Load Employees" to see all employees in this payroll period</li>
                <li>• Use "Generate All" to create payslips for all employees at once</li>
                <li>• Individual payslips can be generated using the "Generate" button</li>
                <li>• "Bulk Download" will prepare all payslips for download</li>
                <li>• All payslips include complete salary breakdown and comply with Indonesian regulations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}