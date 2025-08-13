import { createClient } from '@/lib/supabase/client'
import type { Employee, SalaryComponent, EmployeeWithSalaryComponents } from '@/lib/types/database'

// Enhanced employee service that works with migrated master data
export class MigratedEmployeeService {
  private supabase = createClient()

  // Get all employees with master data joins
  async getEmployees(filters: {
    search?: string
    department?: string
    position?: string
    status?: string
    limit?: number
    offset?: number
  } = {}) {
    let query = this.supabase
      .from('employee_details') // Use the new view
      .select('*')
      .order('created_at', { ascending: false })

    // Apply search filter (enhanced with master data)
    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%,nik.ilike.%${filters.search}%,department_name.ilike.%${filters.search}%,position_title.ilike.%${filters.search}%`
      )
    }

    // Apply department filter (works with both old and new schema)
    if (filters.department) {
      query = query.or(`department_name.eq.${filters.department},department_code.eq.${filters.department}`)
    }

    // Apply position filter
    if (filters.position) {
      query = query.eq('position_title', filters.position)
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

  // Get employee by ID with master data (migration-compatible)
  async getEmployeeById(id: string): Promise<EmployeeWithSalaryComponents | null> {
    try {
      // Try new employee_details view first
      const { data: employeeData, error: employeeError } = await this.supabase
        .from('employee_details')
        .select('*')
        .eq('id', id)
        .single()

      if (employeeError && employeeError.code !== 'PGRST116') {
        throw employeeError
      }

      // Fallback to old employees table if view doesn't exist yet
      let employee = employeeData
      if (!employee) {
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single()

        if (fallbackError) throw fallbackError
        employee = fallbackData
      }

      if (!employee) return null

      // Get salary components
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
    } catch (error) {
      console.error('Error fetching employee:', error)
      throw error
    }
  }

  // Create employee with master data support
  async createEmployee(employeeData: any) {
    try {
      // Convert master data names to IDs if needed
      const processedData = await this.processMasterDataReferences(employeeData)

      const { data, error } = await this.supabase
        .from('employees')
        .insert(processedData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating employee:', error)
      throw error
    }
  }

  // Update employee with master data support
  async updateEmployee(id: string, employeeData: any) {
    try {
      // Convert master data names to IDs if needed
      const processedData = await this.processMasterDataReferences(employeeData)

      const { data, error } = await this.supabase
        .from('employees')
        .update(processedData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating employee:', error)
      throw error
    }
  }

  // Helper function to convert master data names to IDs
  private async processMasterDataReferences(employeeData: any) {
    const processedData = { ...employeeData }

    try {
      // Convert department name to department_id
      if (employeeData.department && !employeeData.department_id) {
        const { data: department } = await this.supabase
          .from('departments')
          .select('id')
          .or(`department_name.eq.${employeeData.department},department_code.eq.${employeeData.department}`)
          .single()

        if (department) {
          processedData.department_id = department.id
        }
      }

      // Convert position title to position_id
      if (employeeData.position_title && !employeeData.position_id && processedData.department_id) {
        const { data: position } = await this.supabase
          .from('positions')
          .select('id')
          .eq('position_title', employeeData.position_title)
          .eq('department_id', processedData.department_id)
          .single()

        if (position) {
          processedData.position_id = position.id
        }
      }

      // Convert bank name to bank_id
      if (employeeData.bank_name && !employeeData.bank_id) {
        const { data: bank } = await this.supabase
          .from('banks')
          .select('id')
          .or(`bank_name.eq.${employeeData.bank_name},bank_code.eq.${employeeData.bank_name},bank_short_name.eq.${employeeData.bank_name}`)
          .single()

        if (bank) {
          processedData.bank_id = bank.id
        }
      }

      return processedData
    } catch (error) {
      console.error('Error processing master data references:', error)
      return processedData // Return original data if master data lookup fails
    }
  }

  // Get employees by department (works with both old and new schema)
  async getEmployeesByDepartment(departmentName: string) {
    const { data, error } = await this.supabase
      .from('employee_details')
      .select('*')
      .or(`department_name.eq.${departmentName},department_code.eq.${departmentName}`)
      .eq('employee_status', 'active')

    if (error) throw error
    return data || []
  }

  // Get employees by position
  async getEmployeesByPosition(positionTitle: string) {
    const { data, error } = await this.supabase
      .from('employee_details')
      .select('*')
      .eq('position_title', positionTitle)
      .eq('employee_status', 'active')

    if (error) throw error
    return data || []
  }

  // Get department statistics with master data
  async getDepartmentStatistics() {
    const { data, error } = await this.supabase
      .from('employee_details')
      .select('department_name, department_code, employee_status')

    if (error) throw error

    const stats = (data || []).reduce((acc: any, employee: any) => {
      const dept = employee.department_name
      if (!acc[dept]) {
        acc[dept] = {
          department_name: dept,
          department_code: employee.department_code,
          total: 0,
          active: 0,
          inactive: 0
        }
      }
      acc[dept].total++
      if (employee.employee_status === 'active') {
        acc[dept].active++
      } else {
        acc[dept].inactive++
      }
      return acc
    }, {})

    return Object.values(stats)
  }

  // Validation methods (enhanced with master data)
  async validateEmployeeId(employeeId: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length || 0) === 0
  }

  async validateNIK(nik: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('employees')
      .select('id')
      .eq('nik', nik)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length || 0) === 0
  }

  // Delete employee
  async deleteEmployee(id: string) {
    const { error } = await this.supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Migration status check
  async checkMigrationStatus() {
    try {
      // Check if foreign key columns exist
      const { data: employees } = await this.supabase
        .from('employees')
        .select('department_id, position_id, bank_id')
        .limit(1)

      const hasForeignKeys = employees && employees[0] && 
        ('department_id' in employees[0] || 'position_id' in employees[0] || 'bank_id' in employees[0])

      // Check if employee_details view exists
      const { data: viewData, error: viewError } = await this.supabase
        .from('employee_details')
        .select('id')
        .limit(1)

      const hasDetailView = !viewError

      return {
        hasForeignKeys,
        hasDetailView,
        migrationComplete: hasForeignKeys && hasDetailView
      }
    } catch (error) {
      return {
        hasForeignKeys: false,
        hasDetailView: false,
        migrationComplete: false
      }
    }
  }
}