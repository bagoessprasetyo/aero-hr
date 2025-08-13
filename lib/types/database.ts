export type EmploymentStatus = 'permanent' | 'contract'
export type EmployeeStatus = 'active' | 'resigned' | 'terminated'
export type PTKPStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3'
export type ComponentType = 'basic_salary' | 'fixed_allowance' | 'deduction'
export type PayrollStatus = 'draft' | 'calculated' | 'finalized'

// Salary History Types
export type SalaryActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved'
export type EmployeeChangeType = 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'PROFILE_UPDATE'
export type ReviewType = 'annual' | 'probation_end' | 'promotion' | 'market_adjustment' | 'performance'
export type ReviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped'
export type BulkOperationType = 'mass_increase' | 'department_adjustment' | 'annual_review' | 'promotion_batch' | 'cost_of_living'
export type BulkOperationStatus = 'draft' | 'approved' | 'executed' | 'cancelled'
export type AdjustmentType = 'percentage' | 'fixed_amount' | 'new_structure'
export type AuditType = 'salary_export' | 'pph21_report' | 'bpjs_report' | 'government_inquiry' | 'internal_audit'

export interface AppConfiguration {
  id: string
  ptkp_amounts: any
  tax_brackets: any
  bpjs_rates: any
  occupational_cost: any
  effective_date: string
  updated_by?: string
  is_active: boolean
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

// Salary History and Audit Interfaces
export interface SalaryComponentHistory {
  id: string
  salary_component_id?: string
  employee_id: string
  
  // Change tracking
  action_type: SalaryActionType
  change_reason?: string
  change_notes?: string
  
  // Previous and new values
  previous_values?: Record<string, any>
  new_values?: Record<string, any>
  
  // Component details
  component_name: string
  component_type: ComponentType
  previous_amount?: number
  new_amount?: number
  previous_status?: boolean
  new_status?: boolean
  
  // Dates
  effective_date: string
  change_date: string
  
  // Approval workflow
  approval_status: ApprovalStatus
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  
  // Metadata
  changed_by: string
  created_at: string
}

export interface EmployeeChangeLog {
  id: string
  employee_id: string
  action_type: EmployeeChangeType
  field_changed: string
  previous_value?: string
  new_value?: string
  change_reason?: string
  change_notes?: string
  changed_by: string
  change_date: string
}

export interface SalaryChangeSummary {
  id: string
  employee_id: string
  change_period_start: string
  change_period_end: string
  previous_gross_salary: number
  new_gross_salary: number
  salary_change_amount: number
  salary_change_percentage: number
  basic_salary_change: number
  allowances_change: number
  total_changes: number
  change_types: string[]
  annual_cost_impact: number
  bpjs_impact: number
  pph21_impact: number
  summary_generated_at: string
  generated_by: string
}

export interface SalaryReviewSchedule {
  id: string
  employee_id: string
  review_type: ReviewType
  scheduled_date: string
  review_status: ReviewStatus
  current_gross_salary?: number
  recommended_new_salary?: number
  review_notes?: string
  reviewer?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface BulkSalaryOperation {
  id: string
  operation_type: BulkOperationType
  operation_name: string
  operation_description?: string
  affected_employees_count: number
  department_filter?: string
  position_filter?: string
  salary_range_filter?: Record<string, any>
  adjustment_type: AdjustmentType
  adjustment_value?: number
  effective_date?: string | number | Date
  successful_items?: string | number | Date
  total_cost_impact: number
  total_employees_affected: number
  operation_status: BulkOperationStatus
  created_by: string
  approved_by?: string
  executed_by?: string
  created_at: string
  approved_at?: string
  executed_at?: string
}

export interface BulkSalaryOperationItem {
  id: string
  bulk_operation_id: string
  employee_id: string
  previous_gross_salary: number
  new_gross_salary: number
  salary_change_amount: number
  component_changes?: Record<string, any>
  item_status: 'pending' | 'applied' | 'failed' | 'skipped'
  error_message?: string
  created_at: string
  applied_at?: string
}

export interface ComplianceAuditLog {
  id: string
  audit_type: AuditType
  audit_description: string
  period_start?: string
  period_end?: string
  employee_ids?: string[]
  departments?: string[]
  total_employees_audited: number
  total_salary_components_reviewed: number
  issues_found: number
  audit_findings?: Record<string, any>
  export_format?: string
  export_file_path?: string
  export_file_size?: number
  requested_by: string
  generated_by: string
  generated_at: string
}

// Extended interfaces with history
export interface EmployeeWithSalaryHistory extends EmployeeWithSalaryComponents {
  salary_history?: SalaryComponentHistory[]
  change_log?: EmployeeChangeLog[]
  latest_salary_changes?: SalaryChangeSummary[]
  upcoming_reviews?: SalaryReviewSchedule[]
}

export interface SalaryHistoryTimeline {
  employee_id: string
  full_name: string
  component_name: string
  component_type: ComponentType
  action_type: SalaryActionType
  previous_amount?: number
  new_amount?: number
  change_amount?: number
  change_percentage?: number
  effective_date: string
  change_date: string
  changed_by: string
  change_reason?: string
  approval_status: ApprovalStatus
}

export interface SalaryComparisonData {
  employee_id: string
  full_name: string
  current_basic: number
  current_allowances: number
  current_gross: number
  last_change_date?: string
  previous_values?: Record<string, any>
  new_values?: Record<string, any>
}