import type { PTKPStatus } from "@/lib/types/database"
import type { BPJSCalculationResult } from "./bpjs"

// PPh 21 Tax Calculation Utilities
// Based on Indonesian Income Tax Law

export interface PTKPAmounts {
  'TK/0': number
  'TK/1': number
  'TK/2': number
  'TK/3': number
  'K/0': number
  'K/1': number
  'K/2': number
  'K/3': number
}

export interface TaxBracket {
  min: number
  max: number | null
  rate: number
}

export interface PPh21CalculationResult {
  grossIncome: number
  companyBPJSContribution: number
  taxableIncome: number
  occupationalCost: number
  employeeBPJSDeduction: number
  netIncomeBeforePTKP: number
  ptkpAmount: number
  pkpYearly: number
  pph21Yearly: number
  pph21Monthly: number
}

// Default PTKP amounts for 2024 (yearly amounts)
export const DEFAULT_PTKP_AMOUNTS: PTKPAmounts = {
  'TK/0': 54000000,  // Single, no dependents
  'TK/1': 58500000,  // Single, 1 dependent
  'TK/2': 63000000,  // Single, 2 dependents
  'TK/3': 67500000,  // Single, 3 dependents
  'K/0': 58500000,   // Married, no dependents
  'K/1': 63000000,   // Married, 1 dependent
  'K/2': 67500000,   // Married, 2 dependents
  'K/3': 72000000,   // Married, 3 dependents
}

// Progressive tax brackets for 2024 (yearly amounts)
export const PPH21_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 60000000, rate: 5 },
  { min: 60000000, max: 250000000, rate: 15 },
  { min: 250000000, max: 500000000, rate: 25 },
  { min: 500000000, max: 5000000000, rate: 30 },
  { min: 5000000000, max: null, rate: 35 },
]

/**
 * Calculate PPh 21 income tax for an employee
 * @param grossMonthlySalary Employee's gross monthly salary
 * @param ptkpStatus Employee's PTKP status
 * @param bpjsCalculation BPJS calculation result
 * @param occupationalCostRate Occupational cost percentage (default 5%)
 * @param occupationalCostMax Maximum monthly occupational cost (default 500,000)
 * @param ptkpAmounts PTKP amounts (optional, uses defaults if not provided)
 * @returns Detailed PPh 21 calculation breakdown
 */
export function calculatePPh21(
  grossMonthlySalary: number,
  ptkpStatus: PTKPStatus,
  bpjsCalculation: BPJSCalculationResult,
  occupationalCostRate: number = 5,
  occupationalCostMax: number = 500000,
  ptkpAmounts: PTKPAmounts = DEFAULT_PTKP_AMOUNTS
): PPh21CalculationResult {
  // Step 1: Calculate yearly gross income
  const grossIncome = grossMonthlySalary * 12

  // Step 2: Add company BPJS contributions to taxable income
  const companyBPJSContribution = bpjsCalculation.totalCompanyContribution * 12
  const taxableIncome = grossIncome + companyBPJSContribution

  // Step 3: Calculate occupational cost deduction (5% of gross, max 500k/month)
  const occupationalCostMonthly = Math.min(
    grossMonthlySalary * occupationalCostRate / 100,
    occupationalCostMax
  )
  const occupationalCost = occupationalCostMonthly * 12

  // Step 4: Subtract employee BPJS contributions (JHT + JP only for tax calculation)
  const employeeBPJSDeduction = (bpjsCalculation.jhtEmployee + bpjsCalculation.jpEmployee) * 12

  // Step 5: Calculate net income before PTKP
  const netIncomeBeforePTKP = taxableIncome - occupationalCost - employeeBPJSDeduction

  // Step 6: Subtract PTKP amount
  const ptkpAmount = ptkpAmounts[ptkpStatus]
  const pkpYearly = Math.max(0, netIncomeBeforePTKP - ptkpAmount)

  // Step 7: Apply progressive tax brackets
  const pph21Yearly = calculateProgressiveTax(pkpYearly)
  const pph21Monthly = Math.round(pph21Yearly / 12)

  return {
    grossIncome,
    companyBPJSContribution,
    taxableIncome,
    occupationalCost,
    employeeBPJSDeduction,
    netIncomeBeforePTKP,
    ptkpAmount,
    pkpYearly,
    pph21Yearly,
    pph21Monthly,
  }
}

/**
 * Calculate progressive tax based on Indonesian tax brackets
 * @param pkp Penghasilan Kena Pajak (Taxable Income)
 * @param brackets Tax brackets (optional, uses defaults if not provided)
 * @returns Total tax amount
 */
export function calculateProgressiveTax(
  pkp: number,
  brackets: TaxBracket[] = PPH21_TAX_BRACKETS
): number {
  if (pkp <= 0) return 0

  let totalTax = 0
  let remainingIncome = pkp

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break

    const bracketMax = bracket.max || Infinity
    const taxableInThisBracket = Math.min(remainingIncome, bracketMax - bracket.min)

    if (taxableInThisBracket > 0) {
      totalTax += taxableInThisBracket * bracket.rate / 100
      remainingIncome -= taxableInThisBracket
    }
  }

  return Math.round(totalTax)
}

/**
 * Get PTKP amount for a given status
 */
export function getPTKPAmount(
  status: PTKPStatus,
  amounts: PTKPAmounts = DEFAULT_PTKP_AMOUNTS
): number {
  return amounts[status]
}

/**
 * Format currency in Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}