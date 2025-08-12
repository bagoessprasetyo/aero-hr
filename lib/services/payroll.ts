import { createClient } from '@/lib/supabase/client'
import type { 
  Payroll, 
  PayrollItem, 
  PayrollWithItems, 
  PayrollItemWithEmployee,
  Employee,
  SalaryComponent 
} from '@/lib/types/database'
import { 
  calculateEmployeePayroll, 
  toPayrollItem, 
  calculatePayrollTotals,
  type PayrollCalculationInput 
} from '@/lib/calculations/payroll'
import { EmployeeService } from './employees'

export class PayrollService {
  private supabase = createClient()
  private employeeService = new EmployeeService()

  // Create new payroll period
  async createPayrollPeriod(month: number, year: number) {
    // Check if payroll period already exists
    const { data: existing } = await this.supabase
      .from('payrolls')
      .select('id')
      .eq('period_month', month)
      .eq('period_year', year)
      .single()

    if (existing) {
      throw new Error(`Payroll period for ${month}/${year} already exists`)
    }

    const { data, error } = await this.supabase
      .from('payrolls')
      .insert([{
        period_month: month,
        period_year: year,
        status: 'draft' as const,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get all payroll periods with optional filtering
  async getPayrollPeriods(filters: {
    status?: string
    year?: number
    limit?: number
  } = {}) {
    let query = this.supabase
      .from('payrolls')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.year) {
      query = query.eq('period_year', filters.year)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Get payroll period by ID with items
  async getPayrollById(id: string): Promise<PayrollWithItems | null> {
    const { data: payroll, error: payrollError } = await this.supabase
      .from('payrolls')
      .select('*')
      .eq('id', id)
      .single()

    if (payrollError) throw payrollError
    if (!payroll) return null

    const { data: items, error: itemsError } = await this.supabase
      .from('payroll_items')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('payroll_id', id)
      // .order('employee.full_name')

    if (itemsError) throw itemsError

    return {
      ...payroll,
      payroll_items: (items || []) as PayrollItemWithEmployee[]
    }
  }

  // Calculate payroll for all active employees in a period
  async calculatePayroll(payrollId: string, variableData?: Record<string, {
    bonus?: number
    overtime_pay?: number
    other_allowances?: number
    other_deductions?: number
  }>) {
    // Get payroll period
    const { data: payroll, error: payrollError } = await this.supabase
      .from('payrolls')
      .select('*')
      .eq('id', payrollId)
      .single()

    if (payrollError) throw payrollError
    if (!payroll) throw new Error('Payroll period not found')

    if (payroll.status === 'finalized') {
      throw new Error('Cannot recalculate finalized payroll')
    }

    // Get all active employees
    const { employees } = await this.employeeService.getEmployees({
      status: 'active'
    })

    const calculations = []
    const payrollItems = []

    // Calculate payroll for each employee
    for (const employee of employees) {
      const salaryComponents = await this.employeeService.getSalaryComponents(employee.id)
      
      const variableComponents = variableData?.[employee.id] || {
        bonus: 0,
        overtime_pay: 0,
        other_allowances: 0,
        other_deductions: 0
      }

      const input: PayrollCalculationInput = {
        employee,
        salaryComponents,
        variableComponents
      }

      const calculation = calculateEmployeePayroll(input)
      calculations.push(calculation)

      const payrollItem = toPayrollItem(payrollId, calculation)
      payrollItems.push(payrollItem)
    }

    // Delete existing payroll items for this period
    await this.supabase
      .from('payroll_items')
      .delete()
      .eq('payroll_id', payrollId)

    // Insert new payroll items
    const { error: itemsError } = await this.supabase
      .from('payroll_items')
      .insert(payrollItems)

    if (itemsError) throw itemsError

    // Calculate totals
    const totals = calculatePayrollTotals(calculations)

    // Update payroll summary
    const { data: updatedPayroll, error: updateError } = await this.supabase
      .from('payrolls')
      .update({
        status: 'calculated' as const,
        total_employees: totals.totalEmployees,
        total_gross_salary: totals.totalGrossSalary,
        total_pph21: totals.totalPph21,
        total_bpjs_company: totals.totalBpjsCompany,
        total_bpjs_employee: totals.totalBpjsEmployee,
        total_net_salary: totals.totalNetSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', payrollId)
      .select()
      .single()

    if (updateError) throw updateError

    return {
      payroll: updatedPayroll,
      calculations,
      totals
    }
  }

  // Update variable components for specific employees
  async updateVariableComponents(payrollId: string, employeeVariables: Array<{
    employee_id: string
    bonus?: number
    overtime_pay?: number
    other_allowances?: number
    other_deductions?: number
  }>) {
    const { data: payroll } = await this.supabase
      .from('payrolls')
      .select('status')
      .eq('id', payrollId)
      .single()

    if (payroll?.status === 'finalized') {
      throw new Error('Cannot modify finalized payroll')
    }

    // Update each employee's variable components
    for (const variables of employeeVariables) {
      const { error } = await this.supabase
        .from('payroll_items')
        .upsert({
          payroll_id: payrollId,
          employee_id: variables.employee_id,
          bonus: variables.bonus || 0,
          overtime_pay: variables.overtime_pay || 0,
          other_allowances: variables.other_allowances || 0,
          other_deductions: variables.other_deductions || 0,
          // Set minimal required fields - will be overwritten by full calculation
          basic_salary: 0,
          gross_salary: 0,
          net_salary: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'payroll_id,employee_id'
        })

      if (error) throw error
    }

    return true
  }

  // Finalize payroll (lock calculations)
  async finalizePayroll(payrollId: string) {
    const { data: payroll } = await this.supabase
      .from('payrolls')
      .select('status')
      .eq('id', payrollId)
      .single()

    if (payroll?.status === 'finalized') {
      throw new Error('Payroll is already finalized')
    }

    if (payroll?.status !== 'calculated') {
      throw new Error('Payroll must be calculated before finalization')
    }

    const { data, error } = await this.supabase
      .from('payrolls')
      .update({
        status: 'finalized' as const,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payrollId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete payroll period (only if draft)
  async deletePayroll(payrollId: string) {
    const { data: payroll } = await this.supabase
      .from('payrolls')
      .select('status')
      .eq('id', payrollId)
      .single()

    if (payroll?.status !== 'draft') {
      throw new Error('Can only delete draft payrolls')
    }

    const { error } = await this.supabase
      .from('payrolls')
      .delete()
      .eq('id', payrollId)

    if (error) throw error
    return true
  }

  // Get payroll statistics
  async getPayrollStats() {
    const { data, error } = await this.supabase
      .from('payrolls')
      .select('status')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      draft: data?.filter(p => p.status === 'draft').length || 0,
      calculated: data?.filter(p => p.status === 'calculated').length || 0,
      finalized: data?.filter(p => p.status === 'finalized').length || 0,
    }

    // Get current year total cost
    const currentYear = new Date().getFullYear()
    const { data: yearlyData, error: yearlyError } = await this.supabase
      .from('payrolls')
      .select('total_net_salary')
      .eq('period_year', currentYear)
      .eq('status', 'finalized')

    if (yearlyError) throw yearlyError

    const yearlyTotal = yearlyData?.reduce((sum, p) => sum + (p.total_net_salary || 0), 0) || 0

    return {
      ...stats,
      yearlyTotal
    }
  }

  // Get employees without payroll items for a specific period
  async getMissingEmployees(payrollId: string) {
    const { data: allEmployees } = await this.supabase
      .from('employees')
      .select('id, employee_id, full_name')
      .eq('employee_status', 'active')

    const { data: payrollItems } = await this.supabase
      .from('payroll_items')
      .select('employee_id')
      .eq('payroll_id', payrollId)

    if (!allEmployees || !payrollItems) return []

    const processedEmployeeIds = new Set(payrollItems.map(item => item.employee_id))
    
    return allEmployees.filter(emp => !processedEmployeeIds.has(emp.id))
  }

  // Validate payroll before finalization
  async validatePayroll(payrollId: string) {
    const missingEmployees = await this.getMissingEmployees(payrollId)
    
    const { data: items } = await this.supabase
      .from('payroll_items')
      .select('net_salary, employee_id')
      .eq('payroll_id', payrollId)

    const issues = []

    if (missingEmployees.length > 0) {
      issues.push({
        type: 'missing_employees',
        message: `${missingEmployees.length} active employees not processed`,
        employees: missingEmployees
      })
    }

    // Check for zero or negative net salaries
    const problematicSalaries = items?.filter(item => item.net_salary <= 0) || []
    if (problematicSalaries.length > 0) {
      issues.push({
        type: 'invalid_salaries',
        message: `${problematicSalaries.length} employees have zero or negative net salary`,
        count: problematicSalaries.length
      })
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}