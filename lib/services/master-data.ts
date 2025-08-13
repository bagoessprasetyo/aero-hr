import { createClient } from '@/lib/supabase/client'
import type {
  Department,
  Position,
  Bank,
  BankBranch,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  CreateBankRequest,
  UpdateBankRequest,
  CreateBankBranchRequest,
  UpdateBankBranchRequest,
  DepartmentFilters,
  PositionFilters,
  BankFilters,
  MasterDataResponse,
  MasterDataSingleResponse,
  DepartmentStats,
  PositionStats
} from '@/lib/types/master-data'

export class MasterDataService {
  private supabase = createClient()

  // =============================================================================
  // DEPARTMENT METHODS
  // =============================================================================

  async getDepartments(filters: DepartmentFilters = {}): Promise<MasterDataResponse<Department>> {
    let query = this.supabase
      .from('departments')
      .select(`
        *,
        parent_department:departments!parent_department_id(id, department_name),
        child_departments:departments!parent_department_id(id, department_name),
        department_head:employees!department_head_employee_id(id, full_name)
      `)
      .order('display_order', { ascending: true })
      .order('department_name', { ascending: true })

    // Apply filters
    if (filters.search) {
      query = query.or(`department_name.ilike.%${filters.search}%,department_code.ilike.%${filters.search}%`)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.parent_department_id) {
      query = query.eq('parent_department_id', filters.parent_department_id)
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

    return {
      data: data || [],
      total: count || 0,
      has_more: filters.limit ? (data?.length || 0) === filters.limit : false
    }
  }

  async getDepartmentById(id: string): Promise<MasterDataSingleResponse<Department>> {
    const { data, error } = await this.supabase
      .from('departments')
      .select(`
        *,
        parent_department:departments!parent_department_id(id, department_name),
        child_departments:departments!parent_department_id(id, department_name, is_active),
        department_head:employees!department_head_employee_id(id, full_name, position_title),
        positions(id, position_title, is_active)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Department not found')

    return {
      data,
      success: true
    }
  }

  async createDepartment(department: CreateDepartmentRequest): Promise<MasterDataSingleResponse<Department>> {
    const { data, error } = await this.supabase
      .from('departments')
      .insert(department)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Department created successfully'
    }
  }

  async updateDepartment(department: UpdateDepartmentRequest): Promise<MasterDataSingleResponse<Department>> {
    const { id, ...updateData } = department
    const { data, error } = await this.supabase
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Department updated successfully'
    }
  }

  async deleteDepartment(id: string): Promise<{ success: boolean; message: string }> {
    // Check if department has employees or child departments
    const { data: employees } = await this.supabase
      .from('employees')
      .select('id')
      .eq('department', id)
      .limit(1)

    const { data: childDepts } = await this.supabase
      .from('departments')
      .select('id')
      .eq('parent_department_id', id)
      .limit(1)

    if (employees?.length || childDepts?.length) {
      return {
        success: false,
        message: 'Cannot delete department with employees or child departments. Deactivate instead.'
      }
    }

    const { error } = await this.supabase
      .from('departments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Department deleted successfully'
    }
  }

  async getDepartmentStats(): Promise<DepartmentStats> {
    // Get basic department counts
    const { data: departments, error: deptError } = await this.supabase
      .from('departments')
      .select('id, is_active, parent_department_id')

    if (deptError) throw deptError

    const total_departments = departments?.length || 0
    const active_departments = departments?.filter(d => d.is_active).length || 0

    // Calculate hierarchy levels
    const hierarchy_levels = this.calculateHierarchyLevels(departments || [])

    return {
      total_departments,
      active_departments,
      departments_with_employees: 0, // Would need to join with employees table
      largest_department: {
        name: 'Unknown',
        employee_count: 0
      },
      hierarchy_levels
    }
  }

  private calculateHierarchyLevels(departments: any[]): number {
    const deptsMap = new Map(departments.map(d => [d.id, d]))
    let maxLevel = 0

    for (const dept of departments) {
      if (!dept.parent_department_id) {
        const level = this.getDepthLevel(dept.id, deptsMap, 0)
        maxLevel = Math.max(maxLevel, level)
      }
    }

    return maxLevel + 1
  }

  private getDepthLevel(deptId: string, deptsMap: Map<string, any>, currentLevel: number): number {
    const children = Array.from(deptsMap.values()).filter(d => d.parent_department_id === deptId)
    if (children.length === 0) return currentLevel

    let maxChildLevel = currentLevel
    for (const child of children) {
      const childLevel = this.getDepthLevel(child.id, deptsMap, currentLevel + 1)
      maxChildLevel = Math.max(maxChildLevel, childLevel)
    }

    return maxChildLevel
  }

  // =============================================================================
  // POSITION METHODS
  // =============================================================================

  async getPositions(filters: PositionFilters = {}): Promise<MasterDataResponse<Position>> {
    let query = this.supabase
      .from('positions')
      .select(`
        *,
        department:departments(id, department_name)
      `)
      .order('display_order', { ascending: true })
      .order('position_title', { ascending: true })

    // Apply filters
    if (filters.search) {
      query = query.or(`position_title.ilike.%${filters.search}%,position_code.ilike.%${filters.search}%`)
    }
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.position_level) {
      query = query.eq('position_level', filters.position_level)
    }
    if (filters.salary_range_min) {
      query = query.gte('min_salary', filters.salary_range_min)
    }
    if (filters.salary_range_max) {
      query = query.lte('max_salary', filters.salary_range_max)
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

    return {
      data: data || [],
      total: count || 0,
      has_more: filters.limit ? (data?.length || 0) === filters.limit : false
    }
  }

  async getPositionById(id: string): Promise<MasterDataSingleResponse<Position>> {
    const { data, error } = await this.supabase
      .from('positions')
      .select(`
        *,
        department:departments(id, department_name, department_code)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Position not found')

    return {
      data,
      success: true
    }
  }

  async createPosition(position: CreatePositionRequest): Promise<MasterDataSingleResponse<Position>> {
    const { data, error } = await this.supabase
      .from('positions')
      .insert(position)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Position created successfully'
    }
  }

  async updatePosition(position: UpdatePositionRequest): Promise<MasterDataSingleResponse<Position>> {
    const { id, ...updateData } = position
    const { data, error } = await this.supabase
      .from('positions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Position updated successfully'
    }
  }

  async deletePosition(id: string): Promise<{ success: boolean; message: string }> {
    // Check if position has employees
    const { data: employees } = await this.supabase
      .from('employees')
      .select('id')
      .eq('position_title', id) // This would need to be updated when employees table uses position_id
      .limit(1)

    if (employees?.length) {
      return {
        success: false,
        message: 'Cannot delete position with active employees. Deactivate instead.'
      }
    }

    const { error } = await this.supabase
      .from('positions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Position deleted successfully'
    }
  }

  async getPositionStats(): Promise<PositionStats> {
    const { data: positions, error } = await this.supabase
      .from('positions')
      .select('id, is_active, position_level, min_salary, max_salary')

    if (error) throw error

    const total_positions = positions?.length || 0
    const active_positions = positions?.filter(p => p.is_active).length || 0

    // Calculate positions by level
    const positions_by_level: Record<number, number> = {}
    positions?.forEach(p => {
      positions_by_level[p.position_level] = (positions_by_level[p.position_level] || 0) + 1
    })

    // Calculate salary ranges
    const salaries = positions?.filter(p => p.min_salary && p.max_salary) || []
    const salary_ranges = {
      min: salaries.length ? Math.min(...salaries.map(p => p.min_salary!)) : 0,
      max: salaries.length ? Math.max(...salaries.map(p => p.max_salary!)) : 0,
      average: salaries.length ? salaries.reduce((sum, p) => sum + ((p.min_salary! + p.max_salary!) / 2), 0) / salaries.length : 0
    }

    return {
      total_positions,
      active_positions,
      positions_by_level,
      salary_ranges
    }
  }

  // =============================================================================
  // BANK METHODS
  // =============================================================================

  async getBanks(filters: BankFilters = {}): Promise<MasterDataResponse<Bank>> {
    let query = this.supabase
      .from('banks')
      .select(`
        *,
        branches:bank_branches(count)
      `)
      .order('display_order', { ascending: true })
      .order('bank_name', { ascending: true })

    // Apply filters
    if (filters.search) {
      query = query.or(`bank_name.ilike.%${filters.search}%,bank_code.ilike.%${filters.search}%,bank_short_name.ilike.%${filters.search}%`)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
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

    return {
      data: data || [],
      total: count || 0,
      has_more: filters.limit ? (data?.length || 0) === filters.limit : false
    }
  }

  async getBankById(id: string): Promise<MasterDataSingleResponse<Bank>> {
    const { data, error } = await this.supabase
      .from('banks')
      .select(`
        *,
        branches:bank_branches(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Bank not found')

    return {
      data,
      success: true
    }
  }

  async createBank(bank: CreateBankRequest): Promise<MasterDataSingleResponse<Bank>> {
    const { data, error } = await this.supabase
      .from('banks')
      .insert(bank)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Bank created successfully'
    }
  }

  async updateBank(bank: UpdateBankRequest): Promise<MasterDataSingleResponse<Bank>> {
    const { id, ...updateData } = bank
    const { data, error } = await this.supabase
      .from('banks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Bank updated successfully'
    }
  }

  async deleteBank(id: string): Promise<{ success: boolean; message: string }> {
    // Check if bank has branches or employees using it
    const { data: branches } = await this.supabase
      .from('bank_branches')
      .select('id')
      .eq('bank_id', id)
      .limit(1)

    if (branches?.length) {
      return {
        success: false,
        message: 'Cannot delete bank with branches. Delete branches first or deactivate the bank.'
      }
    }

    const { error } = await this.supabase
      .from('banks')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Bank deleted successfully'
    }
  }

  // =============================================================================
  // BANK BRANCH METHODS
  // =============================================================================

  async getBankBranches(bankId?: string): Promise<MasterDataResponse<BankBranch>> {
    let query = this.supabase
      .from('bank_branches')
      .select(`
        *,
        bank:banks(id, bank_name, bank_short_name)
      `)
      .order('branch_name', { ascending: true })

    if (bankId) {
      query = query.eq('bank_id', bankId)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      data: data || [],
      total: data?.length || 0
    }
  }

  async createBankBranch(branch: CreateBankBranchRequest): Promise<MasterDataSingleResponse<BankBranch>> {
    const { data, error } = await this.supabase
      .from('bank_branches')
      .insert(branch)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Bank branch created successfully'
    }
  }

  async updateBankBranch(branch: UpdateBankBranchRequest): Promise<MasterDataSingleResponse<BankBranch>> {
    const { id, ...updateData } = branch
    const { data, error } = await this.supabase
      .from('bank_branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'Bank branch updated successfully'
    }
  }

  async deleteBankBranch(id: string): Promise<{ success: boolean; message: string }> {
    const { error } = await this.supabase
      .from('bank_branches')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Bank branch deleted successfully'
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async getActiveDepartments(): Promise<Department[]> {
    const { data } = await this.getDepartments({ is_active: true })
    return data
  }

  async getActivePositions(departmentId?: string): Promise<Position[]> {
    const filters: PositionFilters = { is_active: true }
    if (departmentId) filters.department_id = departmentId
    
    const { data } = await this.getPositions(filters)
    return data
  }

  async getActiveBanks(): Promise<Bank[]> {
    const { data } = await this.getBanks({ is_active: true })
    return data
  }

  async validateDepartmentCode(code: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('departments')
      .select('id')
      .eq('department_code', code)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length || 0) === 0
  }

  async validatePositionCode(code: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('positions')
      .select('id')
      .eq('position_code', code)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length || 0) === 0
  }

  async validateBankCode(code: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('banks')
      .select('id')
      .eq('bank_code', code)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length || 0) === 0
  }
}