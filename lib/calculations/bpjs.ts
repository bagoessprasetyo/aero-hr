import type { PTKPStatus } from "@/lib/types/database"

// BPJS Contribution Calculation Utilities
// Based on Indonesian BPJS regulations

export interface BPJSRates {
  healthEmployeeRate: number // 1%
  healthCompanyRate: number // 4%
  healthMaxSalary: number // 12,000,000
  jhtEmployeeRate: number // 2%
  jhtCompanyRate: number // 3.7%
  jpEmployeeRate: number // 1%
  jpCompanyRate: number // 2%
  jkkCompanyRate: number // 0.24%
  jkmCompanyRate: number // 0.30%
}

export interface BPJSCalculationResult {
  healthEmployee: number
  healthCompany: number
  jhtEmployee: number
  jhtCompany: number
  jpEmployee: number
  jpCompany: number
  jkkCompany: number
  jkmCompany: number
  totalEmployeeContribution: number
  totalCompanyContribution: number
}

export const DEFAULT_BPJS_RATES: BPJSRates = {
  healthEmployeeRate: 1,
  healthCompanyRate: 4,
  healthMaxSalary: 12000000,
  jhtEmployeeRate: 2,
  jhtCompanyRate: 3.7,
  jpEmployeeRate: 1,
  jpCompanyRate: 2,
  jkkCompanyRate: 0.24,
  jkmCompanyRate: 0.30,
}

/**
 * Calculate BPJS contributions for an employee
 * @param grossSalary Employee's gross monthly salary
 * @param isHealthEnrolled Whether employee is enrolled in BPJS Health
 * @param isManpowerEnrolled Whether employee is enrolled in BPJS Manpower
 * @param rates BPJS contribution rates (optional, uses defaults if not provided)
 * @returns Detailed BPJS calculation breakdown
 */
export function calculateBPJS(
  grossSalary: number,
  isHealthEnrolled: boolean,
  isManpowerEnrolled: boolean,
  rates: BPJSRates = DEFAULT_BPJS_RATES
): BPJSCalculationResult {
  // BPJS Health calculations
  const healthBaseSalary = Math.min(grossSalary, rates.healthMaxSalary)
  const healthEmployee = isHealthEnrolled 
    ? Math.round(healthBaseSalary * rates.healthEmployeeRate / 100)
    : 0
  const healthCompany = isHealthEnrolled 
    ? Math.round(healthBaseSalary * rates.healthCompanyRate / 100)
    : 0

  // BPJS Manpower calculations (JHT, JP, JKK, JKM)
  const jhtEmployee = isManpowerEnrolled 
    ? Math.round(grossSalary * rates.jhtEmployeeRate / 100)
    : 0
  const jhtCompany = isManpowerEnrolled 
    ? Math.round(grossSalary * rates.jhtCompanyRate / 100)
    : 0
  const jpEmployee = isManpowerEnrolled 
    ? Math.round(grossSalary * rates.jpEmployeeRate / 100)
    : 0
  const jpCompany = isManpowerEnrolled 
    ? Math.round(grossSalary * rates.jpCompanyRate / 100)
    : 0
  const jkkCompany = isManpowerEnrolled 
    ? Math.round(grossSalary * rates.jkkCompanyRate / 100)
    : 0
  const jkmCompany = isManpowerEnrolled 
    ? Math.round(grossSalary * rates.jkmCompanyRate / 100)
    : 0

  return {
    healthEmployee,
    healthCompany,
    jhtEmployee,
    jhtCompany,
    jpEmployee,
    jpCompany,
    jkkCompany,
    jkmCompany,
    totalEmployeeContribution: healthEmployee + jhtEmployee + jpEmployee,
    totalCompanyContribution: healthCompany + jhtCompany + jpCompany + jkkCompany + jkmCompany,
  }
}

/**
 * Get the salary amount subject to BPJS Health contribution
 * (capped at maximum salary)
 */
export function getBPJSHealthBaseSalary(
  grossSalary: number,
  maxSalary: number = DEFAULT_BPJS_RATES.healthMaxSalary
): number {
  return Math.min(grossSalary, maxSalary)
}