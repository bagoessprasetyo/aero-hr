// Tax Reports Type Definitions for Indonesian Compliance

export interface PPh21ReportItem {
  employee_id: string
  employee_name: string
  nik: string
  npwp?: string
  ptkp_status: string
  
  // Monthly amounts
  gross_salary: number
  allowances: number
  bonus: number
  overtime: number
  total_gross: number
  
  // Deductions
  bpjs_health_employee: number
  bpjs_employment_employee: number
  occupational_cost: number
  total_deductions: number
  
  // Tax calculation
  taxable_income_monthly: number
  taxable_income_yearly: number
  ptkp_amount: number
  pkp_yearly: number
  pph21_yearly: number
  pph21_monthly: number
  pph21_paid_previous: number
  pph21_due: number
}

export interface PPh21Report {
  id: string
  company_name: string
  company_npwp: string
  report_period: {
    month: number
    year: number
    start_date: string
    end_date: string
  }
  
  // Summary totals
  total_employees: number
  total_gross_salary: number
  total_pph21: number
  total_tax_paid: number
  
  // Report items
  items: PPh21ReportItem[]
  
  // Metadata
  generated_at: string
  generated_by: string
  status: 'draft' | 'finalized' | 'submitted'
}

export interface BPJSHealthReportItem {
  employee_id: string
  employee_name: string
  nik: string
  bpjs_health_number?: string
  
  salary_subject_to_bpjs: number
  employee_contribution: number
  company_contribution: number
  total_contribution: number
}

export interface BPJSEmploymentReportItem {
  employee_id: string
  employee_name: string
  nik: string
  bpjs_employment_number?: string
  
  salary_base: number
  jht_employee: number
  jht_company: number
  jp_employee: number
  jp_company: number
  jkk_company: number
  jkm_company: number
  total_employee: number
  total_company: number
}

export interface BPJSReport {
  id: string
  type: 'health' | 'employment'
  company_name: string
  company_bpjs_number: string
  report_period: {
    month: number
    year: number
    start_date: string
    end_date: string
  }
  
  // Health-specific items
  health_items?: BPJSHealthReportItem[]
  health_summary?: {
    total_employees: number
    total_salary_base: number
    total_employee_contributions: number
    total_company_contributions: number
  }
  
  // Employment-specific items
  employment_items?: BPJSEmploymentReportItem[]
  employment_summary?: {
    total_employees: number
    total_salary_base: number
    total_jht_employee: number
    total_jht_company: number
    total_jp_employee: number
    total_jp_company: number
    total_jkk_company: number
    total_jkm_company: number
  }
  
  // Metadata
  generated_at: string
  generated_by: string
  status: 'draft' | 'finalized' | 'submitted'
}

export interface Form1721A1Item {
  employee_id: string
  employee_name: string
  nik: string
  npwp?: string
  ptkp_status: string
  
  // Annual amounts
  total_gross_income: number
  total_allowances: number
  total_bonus: number
  annual_gross: number
  
  // Annual deductions
  occupational_cost: number
  bpjs_health: number
  bpjs_employment: number
  other_deductions: number
  
  // Tax calculation
  net_income: number
  ptkp_amount: number
  pkp: number
  pph21_calculated: number
  pph21_paid: number
  pph21_overpaid: number
  pph21_underpaid: number
}

export interface Form1721A1 {
  id: string
  tax_year: number
  company_name: string
  company_npwp: string
  company_address: string
  
  // Summary
  total_employees: number
  total_gross_income: number
  total_pph21_calculated: number
  total_pph21_paid: number
  total_pph21_overpaid: number
  total_pph21_underpaid: number
  
  // Items
  items: Form1721A1Item[]
  
  // Metadata
  generated_at: string
  generated_by: string
  status: 'draft' | 'finalized' | 'submitted'
}

export interface BankTransferItem {
  employee_id: string
  employee_name: string
  bank_name: string
  bank_code: string
  account_number: string
  account_name: string
  transfer_amount: number
  description: string
}

export interface BankTransferFile {
  id: string
  file_name: string
  bank_format: 'mandiri' | 'bca' | 'bni' | 'bri' | 'generic'
  
  company_account: {
    bank_name: string
    account_number: string
    account_name: string
  }
  
  transfer_date: string
  total_transfers: number
  total_amount: number
  
  items: BankTransferItem[]
  
  // Metadata
  generated_at: string
  generated_by: string
  status: 'draft' | 'ready' | 'processed'
}

export interface TaxReportFilter {
  period: {
    start_date: string
    end_date: string
    month?: number
    year?: number
  }
  
  employees?: {
    employee_ids?: string[]
    department_ids?: string[]
    position_ids?: string[]
    employment_status?: string[]
  }
  
  tax_settings?: {
    ptkp_status?: string[]
    min_salary?: number
    max_salary?: number
  }
}

export interface ReportTemplate {
  id: string
  name: string
  type: 'pph21' | 'bpjs_health' | 'bpjs_employment' | 'form_1721a1' | 'bank_transfer'
  description?: string
  
  // Template configuration
  columns: ReportColumn[]
  filters: TaxReportFilter
  formatting: ReportFormatting
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
  is_default: boolean
}

export interface ReportColumn {
  key: string
  label: string
  type: 'string' | 'number' | 'currency' | 'date' | 'percentage'
  width?: number
  alignment?: 'left' | 'center' | 'right'
  format?: string
  required: boolean
}

export interface ReportFormatting {
  currency: 'IDR'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  number_format: 'id-ID'
  decimal_places: number
  thousands_separator: '.' | ','
  decimal_separator: ',' | '.'
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'txt'
  file_name?: string
  
  // CSV/Excel specific
  include_headers: boolean
  encoding: 'utf-8' | 'utf-8-bom'
  
  // PDF specific
  page_size: 'A4' | 'A3' | 'Letter'
  orientation: 'portrait' | 'landscape'
  
  // Indonesian specific
  locale: 'id-ID'
  currency_symbol: 'Rp'
}

export interface TaxAnalytics {
  period: {
    month: number
    year: number
  }
  
  // Overall metrics
  total_employees: number
  total_gross_salary: number
  total_pph21: number
  effective_tax_rate: number
  
  // Breakdown by PTKP status
  ptkp_breakdown: {
    [status: string]: {
      employee_count: number
      total_gross: number
      total_pph21: number
      average_tax_rate: number
    }
  }
  
  // Department breakdown
  department_breakdown: {
    department_id: string
    department_name: string
    employee_count: number
    total_gross: number
    total_pph21: number
    average_salary: number
  }[]
  
  // Salary ranges
  salary_range_analysis: {
    range: string
    employee_count: number
    total_gross: number
    total_pph21: number
    percentage_of_workforce: number
  }[]
  
  // Comparison with previous period
  comparison?: {
    previous_period: { month: number; year: number }
    gross_salary_change: number
    pph21_change: number
    employee_count_change: number
    effective_tax_rate_change: number
  }
}

export interface ComplianceStatus {
  period: { month: number; year: number }
  
  checks: {
    pph21_accuracy: {
      status: 'compliant' | 'warning' | 'non_compliant'
      message: string
      last_verified: string
    }
    
    ptkp_updates: {
      status: 'current' | 'outdated'
      message: string
      last_updated: string
    }
    
    bpjs_rates: {
      status: 'current' | 'outdated'
      message: string
      last_updated: string
    }
    
    form_1721a1_readiness: {
      status: 'ready' | 'incomplete' | 'not_ready'
      message: string
      missing_items?: string[]
    }
  }
  
  overall_score: number // 0-100
  recommendations: string[]
}