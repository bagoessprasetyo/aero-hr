import type { Employee, SalaryComponent, PayrollItem } from "@/lib/types/database"
import { calculateBPJS, type BPJSCalculationResult } from "./bpjs"
import { calculatePPh21, type PPh21CalculationResult } from "./pph21"

// Payroll Calculation Engine
// Combines salary components, BPJS, and PPh 21 calculations

export interface PayrollCalculationInput {
  employee: Employee
  salaryComponents: SalaryComponent[]
  variableComponents: {
    bonus?: number
    overtimePay?: number
    otherAllowances?: number
    otherDeductions?: number
  }
}

export interface PayrollCalculationResult {
  employee: Employee
  basicSalary: number
  fixedAllowances: number
  variableComponents: {
    bonus: number
    overtimePay: number
    otherAllowances: number
    otherDeductions: number
  }
  grossSalary: number
  bpjsCalculation: BPJSCalculationResult
  pph21Calculation: PPh21CalculationResult
  totalDeductions: number
  netSalary: number
  calculationBreakdown: {
    step1_grossCalculation: string
    step2_bpjsCalculation: string
    step3_taxCalculation: string
    step4_netCalculation: string
  }
}

/**
 * Calculate complete payroll for an employee including BPJS and PPh 21
 */
export function calculateEmployeePayroll(
  input: PayrollCalculationInput
): PayrollCalculationResult {
  const { employee, salaryComponents, variableComponents } = input

  // Step 1: Calculate gross salary components
  const basicSalary = salaryComponents
    .filter(component => component.component_type === 'basic_salary' && component.is_active)
    .reduce((total, component) => total + component.amount, 0)

  const fixedAllowances = salaryComponents
    .filter(component => component.component_type === 'fixed_allowance' && component.is_active)
    .reduce((total, component) => total + component.amount, 0)

  const bonus = variableComponents.bonus || 0
  const overtimePay = variableComponents.overtimePay || 0
  const otherAllowances = variableComponents.otherAllowances || 0
  const otherDeductions = variableComponents.otherDeductions || 0

  const grossSalary = basicSalary + fixedAllowances + bonus + overtimePay + otherAllowances

  // Step 2: Calculate BPJS contributions
  const bpjsCalculation = calculateBPJS(
    grossSalary,
    employee.bpjs_health_enrolled,
    employee.bpjs_manpower_enrolled
  )

  // Step 3: Calculate PPh 21 tax
  const pph21Calculation = calculatePPh21(
    grossSalary,
    employee.ptkp_status,
    bpjsCalculation
  )

  // Step 4: Calculate final net salary
  const totalDeductions = 
    bpjsCalculation.totalEmployeeContribution + 
    pph21Calculation.pph21Monthly + 
    otherDeductions

  const netSalary = grossSalary - totalDeductions

  // Create calculation breakdown for transparency
  const calculationBreakdown = {
    step1_grossCalculation: `Basic: ${formatIDR(basicSalary)} + Fixed Allowances: ${formatIDR(fixedAllowances)} + Variables: ${formatIDR(bonus + overtimePay + otherAllowances)} = ${formatIDR(grossSalary)}`,
    step2_bpjsCalculation: `Health: ${formatIDR(bpjsCalculation.healthEmployee)} + JHT: ${formatIDR(bpjsCalculation.jhtEmployee)} + JP: ${formatIDR(bpjsCalculation.jpEmployee)} = ${formatIDR(bpjsCalculation.totalEmployeeContribution)}`,
    step3_taxCalculation: `PKP: ${formatIDR(pph21Calculation.pkpYearly / 12)}/month → PPh 21: ${formatIDR(pph21Calculation.pph21Monthly)}`,
    step4_netCalculation: `Gross: ${formatIDR(grossSalary)} - BPJS: ${formatIDR(bpjsCalculation.totalEmployeeContribution)} - PPh 21: ${formatIDR(pph21Calculation.pph21Monthly)} - Other: ${formatIDR(otherDeductions)} = ${formatIDR(netSalary)}`
  }

  return {
    employee,
    basicSalary,
    fixedAllowances,
    variableComponents: {
      bonus,
      overtimePay,
      otherAllowances,
      otherDeductions,
    },
    grossSalary,
    bpjsCalculation,
    pph21Calculation,
    totalDeductions,
    netSalary,
    calculationBreakdown,
  }
}

/**
 * Convert PayrollCalculationResult to PayrollItem for database storage
 */
export function toPayrollItem(
  payrollId: string,
  calculation: PayrollCalculationResult
): Omit<PayrollItem, 'id' | 'created_at' | 'updated_at'> {
  return {
    payroll_id: payrollId,
    employee_id: calculation.employee.id,
    
    // Variable components
    bonus: calculation.variableComponents.bonus,
    overtime_pay: calculation.variableComponents.overtimePay,
    other_allowances: calculation.variableComponents.otherAllowances,
    other_deductions: calculation.variableComponents.otherDeductions,
    
    // Calculated amounts
    basic_salary: calculation.basicSalary,
    fixed_allowances: calculation.fixedAllowances,
    gross_salary: calculation.grossSalary,
    
    // BPJS calculations
    bpjs_health_employee: calculation.bpjsCalculation.healthEmployee,
    bpjs_health_company: calculation.bpjsCalculation.healthCompany,
    bpjs_jht_employee: calculation.bpjsCalculation.jhtEmployee,
    bpjs_jht_company: calculation.bpjsCalculation.jhtCompany,
    bpjs_jp_employee: calculation.bpjsCalculation.jpEmployee,
    bpjs_jp_company: calculation.bpjsCalculation.jpCompany,
    bpjs_jkk_company: calculation.bpjsCalculation.jkkCompany,
    bpjs_jkm_company: calculation.bpjsCalculation.jkmCompany,
    
    // Tax calculations
    taxable_income: calculation.pph21Calculation.taxableIncome / 12, // Store monthly amount
    occupational_cost: calculation.pph21Calculation.occupationalCost / 12,
    ptkp_amount: calculation.pph21Calculation.ptkpAmount,
    pkp_yearly: calculation.pph21Calculation.pkpYearly,
    pph21_yearly: calculation.pph21Calculation.pph21Yearly,
    pph21_monthly: calculation.pph21Calculation.pph21Monthly,
    
    // Final amounts
    total_deductions: calculation.totalDeductions,
    net_salary: calculation.netSalary,
  }
}

/**
 * Calculate totals for a payroll period
 */
export function calculatePayrollTotals(calculations: PayrollCalculationResult[]) {
  return calculations.reduce(
    (totals, calc) => ({
      totalEmployees: totals.totalEmployees + 1,
      totalGrossSalary: totals.totalGrossSalary + calc.grossSalary,
      totalPph21: totals.totalPph21 + calc.pph21Calculation.pph21Monthly,
      totalBpjsCompany: totals.totalBpjsCompany + calc.bpjsCalculation.totalCompanyContribution,
      totalBpjsEmployee: totals.totalBpjsEmployee + calc.bpjsCalculation.totalEmployeeContribution,
      totalNetSalary: totals.totalNetSalary + calc.netSalary,
    }),
    {
      totalEmployees: 0,
      totalGrossSalary: 0,
      totalPph21: 0,
      totalBpjsCompany: 0,
      totalBpjsEmployee: 0,
      totalNetSalary: 0,
    }
  )
}

/**
 * Format number as Indonesian Rupiah
 */
function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}