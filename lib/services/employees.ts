import { createClient } from '@/lib/supabase/client'
import type { Employee, SalaryComponent, EmployeeWithSalaryComponents } from '@/lib/types/database'

export class EmployeeService {
  private supabase = createClient()

  // Get all employees with optional filtering
  async getEmployees(filters: {
    search?: string
    department?: string
    status?: string
    limit?: number
    offset?: number
  } = {}) {
    let query = this.supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%,nik.ilike.%${filters.search}%,npwp.ilike.%${filters.search}%`)
    }

    // Apply department filter
    if (filters.department) {
      query = query.eq('department', filters.department)
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq('employee_status', filters.status)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error
    return { employees: data || [], total: count || 0 }
  }

  // Get employee by ID with salary components
  async getEmployeeById(id: string): Promise<EmployeeWithSalaryComponents | null> {
    const { data: employee, error: employeeError } = await this.supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (employeeError) throw employeeError
    if (!employee) return null

    const { data: salaryComponents, error: salaryError } = await this.supabase
      .from('salary_components')
      .select('*')
      .eq('employee_id', id)
      .eq('is_active', true)
      .order('component_type', { ascending: true })

    if (salaryError) throw salaryError

    return {
      ...employee,
      salary_components: salaryComponents || []
    }
  }

  // Create new employee
  async createEmployee(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update employee
  async updateEmployee(id: string, employeeData: Partial<Employee>) {
    const { data, error } = await this.supabase
      .from('employees')
      .update({
        ...employeeData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete employee (soft delete by changing status)
  async deleteEmployee(id: string) {
    const { data, error } = await this.supabase
      .from('employees')
      .update({ 
        employee_status: 'terminated',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get salary components for an employee
  async getSalaryComponents(employeeId: string) {
    const { data, error } = await this.supabase
      .from('salary_components')
      .select('*')
      .eq('employee_id', employeeId)
      .order('component_type', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Add salary component
  async addSalaryComponent(salaryComponent: Omit<SalaryComponent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('salary_components')
      .insert([salaryComponent])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update salary component
  async updateSalaryComponent(id: string, salaryComponent: Partial<SalaryComponent>) {
    const { data, error } = await this.supabase
      .from('salary_components')
      .update({
        ...salaryComponent,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete salary component
  async deleteSalaryComponent(id: string) {
    const { data, error } = await this.supabase
      .from('salary_components')
      .delete()
      .eq('id', id)

    if (error) throw error
    return data
  }

  // Get unique departments for filtering
  async getDepartments() {
    const { data, error } = await this.supabase
      .from('employees')
      .select('department')
      .not('department', 'is', null)

    if (error) throw error
    
    const departments = data?.map(item => item.department) || []
    const uniqueDepartments = Array.from(new Set(departments))
    return uniqueDepartments.sort()
  }

  // Get employee count by status
  async getEmployeeStats() {
    const { data, error } = await this.supabase
      .from('employees')
      .select('employee_status')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      active: data?.filter(emp => emp.employee_status === 'active').length || 0,
      resigned: data?.filter(emp => emp.employee_status === 'resigned').length || 0,
      terminated: data?.filter(emp => emp.employee_status === 'terminated').length || 0,
    }

    return stats
  }

  // Validate employee ID uniqueness
  async validateEmployeeId(employeeId: string, excludeId?: string) {
    let query = this.supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data?.length === 0
  }

  // Validate NIK uniqueness
  async validateNIK(nik: string, excludeId?: string) {
    let query = this.supabase
      .from('employees')
      .select('id')
      .eq('nik', nik)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data?.length === 0
  }
}