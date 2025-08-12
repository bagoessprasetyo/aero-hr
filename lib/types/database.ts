export type EmploymentStatus = 'permanent' | 'contract'
export type EmployeeStatus = 'active' | 'resigned' | 'terminated'
export type PTKPStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3'
export type ComponentType = 'basic_salary' | 'fixed_allowance'
export type PayrollStatus = 'draft' | 'calculated' | 'finalized'

export interface AppConfiguration {
  id: string
  key: string
  value: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  employee_id: string
  full_name: string
  nik: string
  npwp?: string
  address?: string
  phone?: string
  email?: string
  
  // Employment Information
  position_title: string
  department: string
  join_date: string
  employment_status: EmploymentStatus
  employee_status: EmployeeStatus
  
  // Financial Information
  bank_name: string
  bank_account_number: string
  ptkp_status: PTKPStatus
  
  // BPJS Enrollment
  bpjs_health_enrolled: boolean
  bpjs_manpower_enrolled: boolean
  
  created_at: string
  updated_at: string
}

export interface SalaryComponent {
  id: string
  employee_id: string
  component_name: string
  component_type: ComponentType
  amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Payroll {
  id: string
  period_month: number
  period_year: number
  status: PayrollStatus
  total_employees: number
  total_gross_salary: number
  total_pph21: number
  total_bpjs_company: number
  total_bpjs_employee: number
  total_net_salary: number
  created_at: string
  updated_at: string
  finalized_at?: string
}

export interface PayrollItem {
  id: string
  payroll_id: string
  employee_id: string
  
  // Variable components (input)
  bonus: number
  overtime_pay: number
  other_allowances: number
  other_deductions: number
  
  // Calculated amounts
  basic_salary: number
  fixed_allowances: number
  gross_salary: number
  
  // BPJS calculations
  bpjs_health_employee: number
  bpjs_health_company: number
  bpjs_jht_employee: number
  bpjs_jht_company: number
  bpjs_jp_employee: number
  bpjs_jp_company: number
  bpjs_jkk_company: number
  bpjs_jkm_company: number
  
  // Tax calculations
  taxable_income: number
  occupational_cost: number
  ptkp_amount: number
  pkp_yearly: number
  pph21_yearly: number
  pph21_monthly: number
  
  // Final amounts
  total_deductions: number
  net_salary: number
  
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface EmployeeWithSalaryComponents extends Employee {
  salary_components: SalaryComponent[]
}

export interface PayrollItemWithEmployee extends PayrollItem {
  employee: Employee
}

export interface PayrollWithItems extends Payroll {
  payroll_items: PayrollItemWithEmployee[]
}