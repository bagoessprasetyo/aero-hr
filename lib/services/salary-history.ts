import { createClient } from '@/lib/supabase/client'
import type { 
  SalaryComponentHistory,
  EmployeeChangeLog,
  SalaryChangeSummary,
  SalaryReviewSchedule,
  BulkSalaryOperation,
  BulkSalaryOperationItem,
  ComplianceAuditLog,
  SalaryHistoryTimeline,
  SalaryComparisonData,
  EmployeeWithSalaryHistory,
  SalaryActionType,
  ApprovalStatus,
  ReviewType,
  BulkOperationType,
  AdjustmentType
} from '@/lib/types/database'

export interface SalaryHistoryFilters {
  startDate?: string
  endDate?: string
  actionTypes?: SalaryActionType[]
  approvalStatus?: ApprovalStatus[]
  componentType?: 'basic_salary' | 'fixed_allowance'
  changedBy?: string
  limit?: number
  offset?: number
}

export interface BulkSalaryAdjustment {
  employeeIds?: string[]
  departmentFilter?: string
  positionFilter?: string
  salaryRangeMin?: number
  salaryRangeMax?: number
  adjustmentType: AdjustmentType
  adjustmentValue: number
  operationName: string
  operationDescription?: string
  effectiveDate: string
  changeReason?: string
}

export interface SalaryChangeProposal {
  employeeId: string
  componentChanges: Array<{
    componentId?: string
    componentName: string
    componentType: 'basic_salary' | 'fixed_allowance'
    currentAmount?: number
    newAmount: number
    changeReason?: string
  }>
  effectiveDate: string
  changeReason: string
  changeNotes?: string
  requestedBy: string
}

export class SalaryHistoryService {
  private supabase = createClient()

  // Get comprehensive salary history for an employee
  async getSalaryHistory(
    employeeId: string, 
    filters: SalaryHistoryFilters = {}
  ): Promise<SalaryComponentHistory[]> {
    let query = this.supabase
      .from('salary_component_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('change_date', { ascending: false })

    // Apply filters
    if (filters.startDate) {
      query = query.gte('change_date', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('change_date', filters.endDate)
    }
    if (filters.actionTypes?.length) {
      query = query.in('action_type', filters.actionTypes)
    }
    if (filters.approvalStatus?.length) {
      query = query.in('approval_status', filters.approvalStatus)
    }
    if (filters.componentType) {
      query = query.eq('component_type', filters.componentType)
    }
    if (filters.changedBy) {
      query = query.eq('changed_by', filters.changedBy)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Get salary history timeline view
  async getSalaryHistoryTimeline(
    employeeId: string,
    filters: SalaryHistoryFilters = {}
  ): Promise<SalaryHistoryTimeline[]> {
    let query = this.supabase
      .from('employee_salary_timeline')
      .select('*')
      .eq('employee_id', employeeId)
      .order('change_date', { ascending: false })

    // Apply similar filters as getSalaryHistory
    if (filters.startDate) {
      query = query.gte('change_date', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('change_date', filters.endDate)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Get employee with complete salary history
  async getEmployeeWithSalaryHistory(employeeId: string): Promise<EmployeeWithSalaryHistory | null> {
    // Get employee with current salary components
    const { data: employee, error: empError } = await this.supabase
      .from('employees')
      .select(`
        *,
        salary_components (*)
      `)
      .eq('id', employeeId)
      .single()

    if (empError) throw empError
    if (!employee) return null

    // Get salary history
    const salaryHistory = await this.getSalaryHistory(employeeId, { limit: 50 })

    // Get recent change log
    const { data: changeLog, error: logError } = await this.supabase
      .from('employee_change_log')
      .select('*')
      .eq('employee_id', employeeId)
      .order('change_date', { ascending: false })
      .limit(20)

    if (logError) throw logError

    // Get upcoming reviews
    const { data: upcomingReviews, error: reviewError } = await this.supabase
      .from('salary_review_schedule')
      .select('*')
      .eq('employee_id', employeeId)
      .in('review_status', ['scheduled', 'in_progress'])
      .order('scheduled_date', { ascending: true })

    if (reviewError) throw reviewError

    return {
      ...employee,
      salary_history: salaryHistory,
      change_log: changeLog || [],
      upcoming_reviews: upcomingReviews || []
    }
  }

  // Create manual salary change record (for tracking purposes)
  async logSalaryChange(
    employeeId: string,
    changes: Array<{
      componentId?: string
      componentName: string
      componentType: 'basic_salary' | 'fixed_allowance'
      previousAmount?: number
      newAmount: number
      previousStatus?: boolean
      newStatus: boolean
      actionType: SalaryActionType
    }>,
    metadata: {
      changeReason?: string
      changeNotes?: string
      effectiveDate: string
      changedBy: string
      approvalStatus?: ApprovalStatus
    }
  ): Promise<SalaryComponentHistory[]> {
    const historyRecords = changes.map(change => ({
      salary_component_id: change.componentId,
      employee_id: employeeId,
      action_type: change.actionType,
      component_name: change.componentName,
      component_type: change.componentType,
      previous_amount: change.previousAmount,
      new_amount: change.newAmount,
      previous_status: change.previousStatus,
      new_status: change.newStatus,
      effective_date: metadata.effectiveDate,
      change_reason: metadata.changeReason,
      change_notes: metadata.changeNotes,
      changed_by: metadata.changedBy,
      approval_status: metadata.approvalStatus || 'pending'
    }))

    const { data, error } = await this.supabase
      .from('salary_component_history')
      .insert(historyRecords)
      .select()

    if (error) throw error
    return data || []
  }

  // Get salary changes by period for reporting
  async getSalaryChangesByPeriod(
    startDate: string,
    endDate: string,
    filters: {
      departments?: string[]
      employeeIds?: string[]
      minSalaryChange?: number
    } = {}
  ): Promise<SalaryHistoryTimeline[]> {
    let query = this.supabase
      .from('employee_salary_timeline')
      .select('*')
      .gte('effective_date', startDate)
      .lte('effective_date', endDate)
      .order('change_date', { ascending: false })

    if (filters.employeeIds?.length) {
      query = query.in('employee_id', filters.employeeIds)
    }

    const { data, error } = await query

    if (error) throw error

    let results = data || []

    // Apply client-side filters for complex queries
    if (filters.minSalaryChange !== undefined) {
      results = results.filter(item => 
        item.change_amount !== null && Math.abs(item.change_amount) >= filters.minSalaryChange!
      )
    }

    return results
  }

  // Compare salary structures between two dates
  async getSalaryComparison(
    employeeId: string,
    fromDate: string,
    toDate: string
  ): Promise<{
    employee: any
    fromSalary: { basic: number; allowances: number; gross: number; components: any[] }
    toSalary: { basic: number; allowances: number; gross: number; components: any[] }
    changes: SalaryComponentHistory[]
  }> {
    // Get employee info
    const { data: employee, error: empError } = await this.supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (empError) throw empError

    // Get salary changes between dates
    const changes = await this.getSalaryHistory(employeeId, {
      startDate: fromDate,
      endDate: toDate
    })

    // Get current salary components
    const { data: currentComponents, error: compError } = await this.supabase
      .from('salary_components')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)

    if (compError) throw compError

    // Calculate current totals
    const toSalary = {
      basic: currentComponents?.filter(c => c.component_type === 'basic_salary').reduce((sum, c) => sum + c.amount, 0) || 0,
      allowances: currentComponents?.filter(c => c.component_type === 'fixed_allowance').reduce((sum, c) => sum + c.amount, 0) || 0,
      gross: currentComponents?.reduce((sum, c) => sum + c.amount, 0) || 0,
      components: currentComponents || []
    }

    // Calculate previous totals (this is a simplified version - in practice, you'd reconstruct historical state)
    const totalChange = changes.reduce((sum, change) => {
      if (change.action_type === 'CREATE' || change.action_type === 'UPDATE') {
        return sum + ((change.new_amount || 0) - (change.previous_amount || 0))
      }
      return sum
    }, 0)

    const fromSalary = {
      basic: Math.max(0, toSalary.basic - changes.filter(c => c.component_type === 'basic_salary').reduce((sum, c) => sum + ((c.new_amount || 0) - (c.previous_amount || 0)), 0)),
      allowances: Math.max(0, toSalary.allowances - changes.filter(c => c.component_type === 'fixed_allowance').reduce((sum, c) => sum + ((c.new_amount || 0) - (c.previous_amount || 0)), 0)),
      gross: Math.max(0, toSalary.gross - totalChange),
      components: [] // Would need more complex logic to reconstruct
    }

    return {
      employee,
      fromSalary,
      toSalary,
      changes
    }
  }

  // Create salary change proposal (for approval workflow)
  async createSalaryChangeProposal(proposal: SalaryChangeProposal): Promise<SalaryComponentHistory[]> {
    const historyRecords = proposal.componentChanges.map(change => ({
      salary_component_id: change.componentId,
      employee_id: proposal.employeeId,
      action_type: change.componentId ? 'UPDATE' : 'CREATE' as SalaryActionType,
      component_name: change.componentName,
      component_type: change.componentType,
      previous_amount: change.currentAmount,
      new_amount: change.newAmount,
      effective_date: proposal.effectiveDate,
      change_reason: proposal.changeReason,
      change_notes: proposal.changeNotes,
      changed_by: proposal.requestedBy,
      approval_status: 'pending' as ApprovalStatus
    }))

    const { data, error } = await this.supabase
      .from('salary_component_history')
      .insert(historyRecords)
      .select()

    if (error) throw error
    return data || []
  }

  // Approve/reject salary change proposals
  async processSalaryChangeApproval(
    historyIds: string[],
    action: 'approve' | 'reject',
    approvedBy: string,
    notes?: string
  ): Promise<void> {
    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    }

    if (action === 'reject' && notes) {
      updateData.rejection_reason = notes
    }

    const { error } = await this.supabase
      .from('salary_component_history')
      .update(updateData)
      .in('id', historyIds)

    if (error) throw error

    // If approved, apply the changes to actual salary components
    if (action === 'approve') {
      await this.applySalaryChanges(historyIds)
    }
  }

  // Apply approved salary changes to actual salary components
  private async applySalaryChanges(historyIds: string[]): Promise<void> {
    // Get approved changes
    const { data: changes, error: fetchError } = await this.supabase
      .from('salary_component_history')
      .select('*')
      .in('id', historyIds)
      .eq('approval_status', 'approved')

    if (fetchError) throw fetchError
    if (!changes?.length) return

    // Group changes by salary component
    const changesByComponent = changes.reduce((acc, change) => {
      const key = change.salary_component_id || `new_${change.component_name}`
      if (!acc[key]) acc[key] = []
      acc[key].push(change)
      return acc
    }, {} as Record<string, typeof changes>)

    // Apply changes
    for (const [key, componentChanges] of Object.entries(changesByComponent)) {
      const latestChange = (componentChanges as typeof changes)[0] // Assuming they're ordered

      if (latestChange.action_type === 'CREATE') {
        // Create new salary component
        const { error: createError } = await this.supabase
          .from('salary_components')
          .insert({
            employee_id: latestChange.employee_id,
            component_name: latestChange.component_name,
            component_type: latestChange.component_type,
            amount: latestChange.new_amount || 0,
            is_active: latestChange.new_status ?? true
          })

        if (createError) throw createError
      } else if (latestChange.action_type === 'UPDATE' && latestChange.salary_component_id) {
        // Update existing salary component
        const { error: updateError } = await this.supabase
          .from('salary_components')
          .update({
            amount: latestChange.new_amount || 0,
            is_active: latestChange.new_status ?? true,
            updated_at: new Date().toISOString()
          })
          .eq('id', latestChange.salary_component_id)

        if (updateError) throw updateError
      } else if (latestChange.action_type === 'DELETE' && latestChange.salary_component_id) {
        // Delete salary component (soft delete by setting inactive)
        const { error: deleteError } = await this.supabase
          .from('salary_components')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', latestChange.salary_component_id)

        if (deleteError) throw deleteError
      }
    }
  }

  // Get pending salary change approvals
  async getPendingSalaryApprovals(filters: {
    employeeIds?: string[]
    departments?: string[]
    requestedBy?: string
    limit?: number
  } = {}): Promise<SalaryComponentHistory[]> {
    let query = this.supabase
      .from('salary_component_history')
      .select(`
        *,
        employees!inner(id, full_name, department, position_title)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (filters.employeeIds?.length) {
      query = query.in('employee_id', filters.employeeIds)
    }
    if (filters.requestedBy) {
      query = query.eq('changed_by', filters.requestedBy)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Schedule salary review
  async scheduleSalaryReview(review: Omit<SalaryReviewSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<SalaryReviewSchedule> {
    const { data, error } = await this.supabase
      .from('salary_review_schedule')
      .insert(review)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get upcoming salary reviews
  async getUpcomingSalaryReviews(filters: {
    departments?: string[]
    reviewTypes?: ReviewType[]
    daysAhead?: number
  } = {}): Promise<SalaryReviewSchedule[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + (filters.daysAhead || 30))

    let query = this.supabase
      .from('salary_review_schedule')
      .select(`
        *,
        employees!inner(id, full_name, department, position_title)
      `)
      .eq('review_status', 'scheduled')
      .lte('scheduled_date', futureDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })

    if (filters.reviewTypes?.length) {
      query = query.in('review_type', filters.reviewTypes)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Create compliance audit log
  async createComplianceAuditLog(audit: Omit<ComplianceAuditLog, 'id' | 'generated_at'>): Promise<ComplianceAuditLog> {
    const { data, error } = await this.supabase
      .from('compliance_audit_log')
      .insert({
        ...audit,
        generated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Export salary history for compliance
  async exportSalaryHistoryForCompliance(
    periodStart: string,
    periodEnd: string,
    filters: {
      employeeIds?: string[]
      departments?: string[]
      includeInactive?: boolean
    } = {}
  ): Promise<{
    data: any[]
    auditLog: ComplianceAuditLog
  }> {
    // Get salary history data
    let query = this.supabase
      .from('employee_salary_timeline')
      .select('*')
      .gte('effective_date', periodStart)
      .lte('effective_date', periodEnd)
      .order('employee_id', { ascending: true })
      .order('change_date', { ascending: false })

    if (filters.employeeIds?.length) {
      query = query.in('employee_id', filters.employeeIds)
    }

    const { data, error } = await query

    if (error) throw error

    // Create audit log
    const auditLog = await this.createComplianceAuditLog({
      audit_type: 'salary_export',
      audit_description: `Salary history export for period ${periodStart} to ${periodEnd}`,
      period_start: periodStart,
      period_end: periodEnd,
      employee_ids: filters.employeeIds,
      departments: filters.departments,
      total_employees_audited: new Set(data?.map(d => d.employee_id)).size || 0,
      total_salary_components_reviewed: data?.length || 0,
      issues_found: 0,
      requested_by: 'system', // In real implementation, get from current user
      generated_by: 'system'
    })

    return {
      data: data || [],
      auditLog
    }
  }
}