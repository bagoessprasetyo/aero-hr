import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
import type { PayrollCalculationResult } from '@/lib/calculations/payroll'
import type { Employee } from '@/lib/types/database'

export interface CalculationAuditEntry {
  id: string
  employee_id: string
  employee_name: string
  employee_nik: string
  calculation_type: 'payroll' | 'salary_adjustment' | 'tax_calculation' | 'bpjs_calculation'
  calculation_date: string
  period_month: number
  period_year: number
  
  // Input parameters
  input_data: {
    basic_salary: number
    allowances: Record<string, number>
    deductions: Record<string, number>
    variable_components: {
      bonus?: number
      overtime_pay?: number
      other_allowances?: number
      other_deductions?: number
    }
    tax_settings: {
      ptkp_status: string
      ptkp_amount: number
      tax_brackets: any
    }
    bpjs_settings: {
      health_rate: number
      employment_rates: any
      max_salary: number
    }
  }
  
  // Calculation results
  calculation_results: {
    gross_salary: number
    taxable_income: number
    pph21: number
    bpjs_employee: {
      health: number
      jht: number
      jp: number
    }
    bpjs_company: {
      health: number
      jht: number
      jp: number
      jkk: number
      jkm: number
    }
    total_deductions: number
    net_salary: number
    company_cost: number
  }
  
  // Calculation breakdown for transparency
  calculation_steps: {
    step: string
    description: string
    input_value: number
    calculation: string
    result: number
  }[]
  
  // Compliance information
  compliance_info: {
    regulations_applied: string[]
    tax_bracket_used: string
    ptkp_deduction: number
    occupational_cost: number
  }
  
  // Audit trail
  created_by: string
  created_at: string
  payroll_id?: string
  is_finalized: boolean
  finalized_at?: string
  finalized_by?: string
}

export interface AuditFilters {
  employee_id?: string
  calculation_type?: string
  start_date?: string
  end_date?: string
  period_month?: number
  period_year?: number
  is_finalized?: boolean
}

export class AuditService {
  async recordCalculationAudit(data: {
    employee: Employee
    calculation: PayrollCalculationResult
    period: { month: number; year: number }
    payroll_id?: string
    created_by: string
  }): Promise<{ success: boolean; audit_id?: string; error?: string }> {
    try {
      const auditEntry: Omit<CalculationAuditEntry, 'id' | 'created_at'> = {
        employee_id: data.employee.id,
        employee_name: data.employee.full_name,
        employee_nik: data.employee.employee_id,
        calculation_type: 'payroll',
        calculation_date: new Date().toISOString(),
        period_month: data.period.month,
        period_year: data.period.year,
        
        input_data: {
          basic_salary: data.calculation.basicSalary,
          allowances: { fixed_allowances: data.calculation.fixedAllowances },
          deductions: {},
          variable_components: data.calculation.variableComponents,
          tax_settings: {
            ptkp_status: data.employee.ptkp_status,
            ptkp_amount: data.calculation.pph21Calculation.ptkpAmount,
            tax_brackets: {}
          },
          bpjs_settings: {
            health_rate: 0.01, // This should come from tax config service
            employment_rates: {
              jht: { employee: 0.02, company: 0.037 },
              jp: { employee: 0.01, company: 0.02 }
            },
            max_salary: 12000000 // This should come from tax config service
          }
        },
        
        calculation_results: {
          gross_salary: data.calculation.grossSalary,
          taxable_income: data.calculation.pph21Calculation.taxableIncome,
          pph21: data.calculation.pph21Calculation.pph21Monthly,
          bpjs_employee: {
            health: data.calculation.bpjsCalculation.healthEmployee,
            jht: data.calculation.bpjsCalculation.jhtEmployee,
            jp: data.calculation.bpjsCalculation.jpEmployee
          },
          bpjs_company: {
            health: data.calculation.bpjsCalculation.healthCompany,
            jht: data.calculation.bpjsCalculation.jhtCompany,
            jp: data.calculation.bpjsCalculation.jpCompany,
            jkk: data.calculation.bpjsCalculation.jkkCompany,
            jkm: data.calculation.bpjsCalculation.jkmCompany
          },
          total_deductions: data.calculation.totalDeductions,
          net_salary: data.calculation.netSalary,
          company_cost: data.calculation.grossSalary + data.calculation.bpjsCalculation.totalCompanyContribution
        },
        
        calculation_steps: this.generateCalculationSteps(data.calculation),
        
        compliance_info: {
          regulations_applied: [
            'UU No. 36 Tahun 2008 (PPh)',
            'UU No. 24 Tahun 2011 (BPJS)',
            'Peraturan Pemerintah terkait PTKP',
            'Keputusan Menteri Keuangan tentang Tarif PPh'
          ],
          tax_bracket_used: this.determineTaxBracket(data.calculation.pph21Calculation.taxableIncome),
          ptkp_deduction: data.calculation.pph21Calculation.ptkpAmount,
          occupational_cost: data.calculation.pph21Calculation.occupationalCost || 0
        },
        
        created_by: data.created_by,
        payroll_id: data.payroll_id,
        is_finalized: false
      }

      const { data: insertedData, error } = await supabase
        .from('calculation_audit_log')
        .insert(auditEntry)
        .select('id')
        .single()

      if (error) throw error

      return { 
        success: true, 
        audit_id: insertedData.id 
      }
    } catch (error: any) {
      console.error('Error recording calculation audit:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
  }

  private generateCalculationSteps(calculation: PayrollCalculationResult) {
    const steps = [
      {
        step: '1',
        description: 'Calculate Gross Salary',
        input_value: calculation.basicSalary,
        calculation: `Basic Salary + Allowances`,
        result: calculation.grossSalary
      },
      {
        step: '2',
        description: 'Calculate BPJS Employee Deductions',
        input_value: calculation.grossSalary,
        calculation: `Health: ${calculation.grossSalary} × 1%, JHT: ${calculation.grossSalary} × 2%, JP: ${calculation.grossSalary} × 1%`,
        result: calculation.bpjsCalculation.totalEmployeeContribution
      },
      {
        step: '3',
        description: 'Calculate Taxable Income',
        input_value: calculation.grossSalary,
        calculation: `Gross - Occupational Cost - BPJS Employee - BPJS Company`,
        result: calculation.pph21Calculation.taxableIncome
      },
      {
        step: '4',
        description: 'Apply PTKP Deduction',
        input_value: calculation.pph21Calculation.taxableIncome,
        calculation: `Taxable Income - PTKP (${calculation.pph21Calculation.ptkpAmount})`,
        result: Math.max(0, calculation.pph21Calculation.taxableIncome - calculation.pph21Calculation.ptkpAmount)
      },
      {
        step: '5',
        description: 'Calculate PPh 21',
        input_value: Math.max(0, calculation.pph21Calculation.taxableIncome - calculation.pph21Calculation.ptkpAmount),
        calculation: 'Apply progressive tax brackets',
        result: calculation.pph21Calculation.pph21Monthly
      },
      {
        step: '6',
        description: 'Calculate Net Salary',
        input_value: calculation.grossSalary,
        calculation: `Gross - BPJS Employee - PPh21 - Other Deductions`,
        result: calculation.netSalary
      }
    ]

    return steps
  }

  private determineTaxBracket(taxableIncome: number): string {
    if (taxableIncome <= 60000000) return '5% (0 - 60M)'
    if (taxableIncome <= 250000000) return '15% (60M - 250M)'
    if (taxableIncome <= 500000000) return '25% (250M - 500M)'
    if (taxableIncome <= 5000000000) return '30% (500M - 5B)'
    return '35% (> 5B)'
  }

  async getAuditTrail(filters: AuditFilters = {}, limit: number = 100): Promise<CalculationAuditEntry[]> {
    try {
      let query = supabase
        .from('calculation_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id)
      }
      
      if (filters.calculation_type) {
        query = query.eq('calculation_type', filters.calculation_type)
      }
      
      if (filters.start_date) {
        query = query.gte('calculation_date', filters.start_date)
      }
      
      if (filters.end_date) {
        query = query.lte('calculation_date', filters.end_date)
      }
      
      if (filters.period_month) {
        query = query.eq('period_month', filters.period_month)
      }
      
      if (filters.period_year) {
        query = query.eq('period_year', filters.period_year)
      }
      
      if (filters.is_finalized !== undefined) {
        query = query.eq('is_finalized', filters.is_finalized)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      return []
    }
  }

  async getAuditById(auditId: string): Promise<CalculationAuditEntry | null> {
    try {
      const { data, error } = await supabase
        .from('calculation_audit_log')
        .select('*')
        .eq('id', auditId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching audit entry:', error)
      return null
    }
  }

  async finalizeAuditEntries(auditIds: string[], finalizedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calculation_audit_log')
        .update({
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          finalized_by: finalizedBy
        })
        .in('id', auditIds)

      if (error) throw error
      return { success: true }
    } catch (error: any) {
      console.error('Error finalizing audit entries:', error)
      return { success: false, error: error.message }
    }
  }

  async getAuditSummary(filters: AuditFilters = {}): Promise<{
    total_calculations: number
    total_employees: number
    total_gross_salary: number
    total_pph21: number
    total_bpjs_employee: number
    total_net_salary: number
    finalized_count: number
    pending_count: number
  }> {
    try {
      let query = supabase
        .from('calculation_audit_log')
        .select('employee_id, calculation_results, is_finalized')

      // Apply filters
      if (filters.start_date) {
        query = query.gte('calculation_date', filters.start_date)
      }
      
      if (filters.end_date) {
        query = query.lte('calculation_date', filters.end_date)
      }
      
      if (filters.period_month) {
        query = query.eq('period_month', filters.period_month)
      }
      
      if (filters.period_year) {
        query = query.eq('period_year', filters.period_year)
      }

      const { data, error } = await query

      if (error) throw error

      const summary = {
        total_calculations: data.length,
        total_employees: new Set(data.map(item => item.employee_id)).size,
        total_gross_salary: 0,
        total_pph21: 0,
        total_bpjs_employee: 0,
        total_net_salary: 0,
        finalized_count: 0,
        pending_count: 0
      }

      data.forEach(item => {
        const results = item.calculation_results
        summary.total_gross_salary += results.gross_salary
        summary.total_pph21 += results.pph21
        summary.total_bpjs_employee += results.bpjs_employee.health + results.bpjs_employee.jht + results.bpjs_employee.jp
        summary.total_net_salary += results.net_salary
        
        if (item.is_finalized) {
          summary.finalized_count++
        } else {
          summary.pending_count++
        }
      })

      return summary
    } catch (error) {
      console.error('Error calculating audit summary:', error)
      return {
        total_calculations: 0,
        total_employees: 0,
        total_gross_salary: 0,
        total_pph21: 0,
        total_bpjs_employee: 0,
        total_net_salary: 0,
        finalized_count: 0,
        pending_count: 0
      }
    }
  }

  async exportAuditTrail(
    filters: AuditFilters = {}, 
    format: 'csv' | 'excel' = 'excel'
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const auditEntries = await this.getAuditTrail(filters, 10000) // Large limit for export

      const exportData = auditEntries.map(entry => ({
        'Audit ID': entry.id,
        'Employee NIK': entry.employee_nik,
        'Employee Name': entry.employee_name,
        'Calculation Type': entry.calculation_type,
        'Period': `${entry.period_month}/${entry.period_year}`,
        'Calculation Date': new Date(entry.calculation_date).toLocaleDateString('id-ID'),
        'Gross Salary': entry.calculation_results.gross_salary,
        'PPh 21': entry.calculation_results.pph21,
        'BPJS Employee': entry.calculation_results.bpjs_employee.health + entry.calculation_results.bpjs_employee.jht + entry.calculation_results.bpjs_employee.jp,
        'Net Salary': entry.calculation_results.net_salary,
        'Tax Bracket': entry.compliance_info.tax_bracket_used,
        'PTKP Status': entry.input_data.tax_settings.ptkp_status,
        'PTKP Amount': entry.input_data.tax_settings.ptkp_amount,
        'Is Finalized': entry.is_finalized ? 'Yes' : 'No',
        'Created By': entry.created_by,
        'Created At': new Date(entry.created_at).toLocaleString('id-ID')
      }))

      return { success: true, data: exportData }
    } catch (error: any) {
      console.error('Error exporting audit trail:', error)
      return { success: false, error: error.message }
    }
  }

  async recordConfigurationChange(data: {
    change_type: 'ptkp' | 'tax_brackets' | 'bpjs_rates' | 'occupational_cost'
    old_values: any
    new_values: any
    changed_by: string
    effective_date: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('configuration_audit_log')
        .insert({
          change_type: data.change_type,
          old_values: data.old_values,
          new_values: data.new_values,
          changed_by: data.changed_by,
          effective_date: data.effective_date,
          created_at: new Date().toISOString()
        })

      if (error) throw error
      return { success: true }
    } catch (error: any) {
      console.error('Error recording configuration change:', error)
      return { success: false, error: error.message }
    }
  }
}