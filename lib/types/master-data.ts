// Master Data Types for Aero HR System

export interface Department {
  id: string
  department_code: string
  department_name: string
  department_description?: string
  parent_department_id?: string
  department_head_employee_id?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  
  // Relations (for joined queries)
  parent_department?: Department
  child_departments?: Department[]
  department_head?: Employee
  positions?: Position[]
}

export interface Position {
  id: string
  position_code: string
  position_title: string
  position_description?: string
  department_id: string
  position_level: number
  min_salary?: number
  max_salary?: number
  required_skills?: string[]
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  
  // Relations
  department?: Department
  employees?: Employee[]
}

export interface Bank {
  id: string
  bank_code: string
  bank_name: string
  bank_short_name?: string
  swift_code?: string
  bank_address?: string
  phone?: string
  website?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  
  // Relations
  branches?: BankBranch[]
}

export interface BankBranch {
  id: string
  bank_id: string
  branch_code: string
  branch_name: string
  branch_address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  bank?: Bank
}

// User Management Types
export interface UserRole {
  id: string
  role_name: string
  role_description?: string
  is_system_role: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  permissions?: UserPermission[]
  users?: UserProfile[]
}

export interface UserPermission {
  id: string
  permission_name: string
  permission_description?: string
  module_name: string
  action_type: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export'
  is_active: boolean
  created_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  granted_at: string
  granted_by?: string
  
  // Relations
  role?: UserRole
  permission?: UserPermission
}

export interface UserProfile {
  id: string // References auth.users.id
  employee_id?: string
  role_id: string
  full_name: string
  email: string
  phone?: string
  department_id?: string
  is_active: boolean
  last_login_at?: string
  password_changed_at: string
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relations
  employee?: Employee
  role?: UserRole
  department?: Department
  created_by_user?: UserProfile
}

export interface UserActivityLog {
  id: string
  user_id: string
  activity_type: string
  activity_description: string
  module_name?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  created_at: string
  
  // Relations
  user?: UserProfile
}

// Form Types for CRUD Operations
export interface CreateDepartmentRequest {
  department_code: string
  department_name: string
  department_description?: string
  parent_department_id?: string
  department_head_employee_id?: string
  is_active?: boolean
  display_order?: number
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
  id: string
}

export interface CreatePositionRequest {
  position_code: string
  position_title: string
  position_description?: string
  department_id: string
  position_level?: number
  min_salary?: number
  max_salary?: number
  required_skills?: string[]
  is_active?: boolean
  display_order?: number
}

export interface UpdatePositionRequest extends Partial<CreatePositionRequest> {
  id: string
}

export interface CreateBankRequest {
  bank_code: string
  bank_name: string
  bank_short_name?: string
  swift_code?: string
  bank_address?: string
  phone?: string
  website?: string
  is_active?: boolean
  display_order?: number
}

export interface UpdateBankRequest extends Partial<CreateBankRequest> {
  id: string
}

export interface CreateBankBranchRequest {
  bank_id: string
  branch_code: string
  branch_name: string
  branch_address?: string
  phone?: string
  is_active?: boolean
}

export interface UpdateBankBranchRequest extends Partial<CreateBankBranchRequest> {
  id: string
}

export interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  role_id: string
  employee_id?: string
  phone?: string
  department_id?: string
  is_active?: boolean
}

export interface UpdateUserRequest {
  id: string
  full_name?: string
  role_id?: string
  employee_id?: string
  phone?: string
  department_id?: string
  is_active?: boolean
}

export interface CreateUserRoleRequest {
  role_name: string
  role_description?: string
  is_system_role?: boolean
  is_active?: boolean
  permission_ids?: string[]
}

export interface UpdateUserRoleRequest extends Partial<CreateUserRoleRequest> {
  id: string
}

// Filter and Query Types
export interface DepartmentFilters {
  search?: string
  is_active?: boolean
  parent_department_id?: string
  has_employees?: boolean
  limit?: number
  offset?: number
}

export interface PositionFilters {
  search?: string
  department_id?: string
  is_active?: boolean
  position_level?: number
  salary_range_min?: number
  salary_range_max?: number
  limit?: number
  offset?: number
}

export interface BankFilters {
  search?: string
  is_active?: boolean
  has_branches?: boolean
  limit?: number
  offset?: number
}

export interface UserFilters {
  search?: string
  role_id?: string
  department_id?: string
  is_active?: boolean
  last_login_days?: number
  limit?: number
  offset?: number
}

export interface UserActivityFilters {
  user_id?: string
  activity_type?: string
  module_name?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

// Response Types
export interface MasterDataResponse<T> {
  data: T[]
  total: number
  page?: number
  limit?: number
  has_more?: boolean
}

export interface MasterDataSingleResponse<T> {
  data: T
  success: boolean
  message?: string
}

// Statistics and Analytics Types
export interface DepartmentStats {
  total_departments: number
  active_departments: number
  departments_with_employees: number
  largest_department: {
    name: string
    employee_count: number
  }
  hierarchy_levels: number
}

export interface PositionStats {
  total_positions: number
  active_positions: number
  positions_by_level: Record<number, number>
  salary_ranges: {
    min: number
    max: number
    average: number
  }
}

export interface UserStats {
  total_users: number
  active_users: number
  users_by_role: Record<string, number>
  recent_logins: number
  inactive_users: number
}

// Navigation and UI Types
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: any
  permission?: string
  children?: NavigationItem[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

// Export all types from existing database types that are still relevant
export type { Employee } from './database'

// Re-export commonly used types
export type MasterDataTable = 'departments' | 'positions' | 'banks' | 'bank_branches'
export type UserManagementTable = 'user_roles' | 'user_permissions' | 'role_permissions' | 'user_profiles' | 'user_activity_log'
export type ActionType = UserPermission['action_type']
export type ModuleName = 'system' | 'employees' | 'payroll' | 'bulk_operations' | 'reports' | 'admin'