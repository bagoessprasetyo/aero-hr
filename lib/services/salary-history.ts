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
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
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
    try {
      let query = this.supabase
        .from('employee_change_log')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })

      // Apply similar filters as getSalaryHistory
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        // If table doesn't exist or has schema issues, return empty array
        console.warn('employee_change_log query failed:', error.message)
        return []
      }
      return data || []
    } catch (error) {
      console.warn('Error accessing employee_change_log table:', error)
      return []
    }
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
    let changeLog: any[] = []
    try {
      const { data, error: logError } = await this.supabase
        .from('employee_change_log')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (logError) {
        console.warn('employee_change_log query failed:', logError.message)
      } else {
        changeLog = data || []
      }
    } catch (error) {
      console.warn('Error accessing employee_change_log table:', error)
    }

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
    try {
      let query = this.supabase
        .from('employee_change_log')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (filters.employeeIds?.length) {
        query = query.in('employee_id', filters.employeeIds)
      }

      const { data, error } = await query

      if (error) {
        console.warn('employee_change_log query failed:', error.message)
        return []
      }

      let results = data || []

      // Apply client-side filters for complex queries
      if (filters.minSalaryChange !== undefined) {
        results = results.filter(item => 
          item.change_amount !== null && Math.abs(item.change_amount) >= filters.minSalaryChange!
        )
      }

      return results
    } catch (error) {
      console.warn('Error accessing employee_change_log table:', error)
      return []
    }
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

  // Create bulk salary operation record
  async createBulkSalaryOperation(operation: {
    operation_type: BulkOperationType
    operation_name: string
    operation_description?: string
    adjustment_type: AdjustmentType
    adjustment_value?: number
    effective_date: string
    department_filter?: string
    position_filter?: string
    salary_range_filter?: Record<string, any>
    employee_ids: string[]
    preview_data: Array<{
      employee_id: string
      previous_gross_salary: number
      new_gross_salary: number
      salary_change_amount: number
      component_changes: Record<string, any>
    }>
    total_cost_impact: number
    created_by: string
  }): Promise<{ success: boolean; operation_id?: string; error?: string }> {
    try {
      // Create main operation record
      const { data: bulkOp, error: opError } = await this.supabase
        .from('bulk_salary_operations')
        .insert({
          operation_type: operation.operation_type,
          operation_name: operation.operation_name,
          operation_description: operation.operation_description,
          affected_employees_count: operation.employee_ids.length,
          department_filter: operation.department_filter,
          position_filter: operation.position_filter,
          salary_range_filter: operation.salary_range_filter,
          adjustment_type: operation.adjustment_type,
          adjustment_value: operation.adjustment_value,
          total_cost_impact: operation.total_cost_impact,
          total_employees_affected: operation.employee_ids.length,
          effective_date: operation.effective_date,
          operation_status: 'draft',
          created_by: operation.created_by
        })
        .select('id')
        .single()

      if (opError) throw opError

      // Create individual operation items
      const operationItems = operation.preview_data.map(item => ({
        bulk_operation_id: bulkOp.id,
        employee_id: item.employee_id,
        previous_gross_salary: item.previous_gross_salary,
        new_gross_salary: item.new_gross_salary,
        salary_change_amount: item.salary_change_amount,
        component_changes: item.component_changes,
        item_status: 'pending' as const
      }))

      const { error: itemsError } = await this.supabase
        .from('bulk_salary_operation_items')
        .insert(operationItems)

      if (itemsError) throw itemsError

      return { success: true, operation_id: bulkOp.id }
    } catch (error: any) {
      console.error('Error creating bulk salary operation:', error)
      return { success: false, error: error.message }
    }
  }

  // Execute bulk salary operation
  async executeBulkSalaryOperation(
    operationId: string,
    executedBy: string,
    onProgress?: (progress: { completed: number; total: number; current?: string }) => void
  ): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      // Get operation details
      const { data: operation, error: opError } = await this.supabase
        .from('bulk_salary_operations')
        .select(`
          *,
          bulk_salary_operation_items(*)
        `)
        .eq('id', operationId)
        .single()

      if (opError) throw opError
      if (!operation) throw new Error('Bulk operation not found')

      // Update operation status to executing
      await this.supabase
        .from('bulk_salary_operations')
        .update({
          operation_status: 'executing',
          executed_at: new Date().toISOString(),
          executed_by: executedBy
        })
        .eq('id', operationId)

      const items = operation.bulk_salary_operation_items
      const results = { successful: 0, failed: 0, errors: [] as any[] }

      // Process each employee in the bulk operation
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        // Report progress
        if (onProgress) {
          onProgress({
            completed: i,
            total: items.length,
            current: `Processing employee ${item.employee_id}`
          })
        }

        try {
          // Get employee current salary components
          const { data: employee, error: empError } = await this.supabase
            .from('employees')
            .select(`
              *,
              salary_components(*)
            `)
            .eq('id', item.employee_id)
            .single()

          if (empError) throw empError

          // Apply salary changes based on operation type
          await this.applySalaryChangesToEmployee(
            item.employee_id,
            operation.adjustment_type,
            operation.adjustment_value || 0,
            item.component_changes,
            operation.effective_date,
            executedBy,
            `Bulk operation: ${operation.operation_name}`
          )

          // Update item status to applied
          await this.supabase
            .from('bulk_salary_operation_items')
            .update({ item_status: 'applied' })
            .eq('id', item.id)

          results.successful++
        } catch (error: any) {
          // Update item status to failed
          await this.supabase
            .from('bulk_salary_operation_items')
            .update({ 
              item_status: 'failed',
              error_message: error.message 
            })
            .eq('id', item.id)

          results.failed++
          results.errors.push({
            employee_id: item.employee_id,
            error: error.message
          })
        }
      }

      // Update operation status to completed or partially failed
      const finalStatus = results.failed > 0 ? 'partially_completed' : 'completed'
      await this.supabase
        .from('bulk_salary_operations')
        .update({
          operation_status: finalStatus,
          completed_at: new Date().toISOString(),
          successful_items: results.successful,
          failed_items: results.failed
        })
        .eq('id', operationId)

      // Final progress update
      if (onProgress) {
        onProgress({
          completed: items.length,
          total: items.length,
          current: 'Operation completed'
        })
      }

      return { success: true, results }
    } catch (error: any) {
      // Mark operation as failed
      await this.supabase
        .from('bulk_salary_operations')
        .update({
          operation_status: 'failed',
          error_message: error.message
        })
        .eq('id', operationId)

      console.error('Error executing bulk salary operation:', error)
      return { success: false, error: error.message }
    }
  }

  // Apply salary changes to individual employee
  private async applySalaryChangesToEmployee(
    employeeId: string,
    adjustmentType: AdjustmentType,
    adjustmentValue: number,
    componentChanges: Record<string, any>,
    effectiveDate: string,
    changedBy: string,
    changeReason: string
  ): Promise<void> {
    // Get current salary components
    const { data: components, error: compError } = await this.supabase
      .from('salary_components')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)

    if (compError) throw compError

    const changes = []

    // Process each salary component
    for (const component of components || []) {
      let newAmount = component.amount

      // Apply adjustment based on type
      switch (adjustmentType) {
        case 'percentage':
          newAmount = component.amount * (1 + adjustmentValue / 100)
          break
        case 'fixed_amount':
          // Only apply to basic salary for fixed amount increases
          if (component.component_type === 'basic_salary') {
            newAmount = component.amount + adjustmentValue
          }
          break
        case 'new_structure':
          // Use component-specific changes from componentChanges
          if (componentChanges[component.id]) {
            newAmount = componentChanges[component.id]
          }
          break
      }

      // Round to nearest hundred
      newAmount = Math.round(newAmount / 100) * 100

      if (newAmount !== component.amount) {
        // Update the salary component
        await this.supabase
          .from('salary_components')
          .update({
            amount: newAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', component.id)

        // Record the change in history
        changes.push({
          componentId: component.id,
          componentName: component.component_name,
          componentType: component.component_type,
          previousAmount: component.amount,
          newAmount: newAmount,
          previousStatus: component.is_active,
          newStatus: component.is_active,
          actionType: 'UPDATE' as SalaryActionType
        })
      }
    }

    // Log the salary changes
    if (changes.length > 0) {
      await this.logSalaryChange(employeeId, changes, {
        changeReason,
        effectiveDate,
        changedBy,
        approvalStatus: 'auto_approved'
      })
    }
  }

  // Get bulk operation history
  async getBulkOperationHistory(filters: {
    operation_type?: BulkOperationType
    start_date?: string
    end_date?: string
    created_by?: string
    completed_at?: string
    status?: string
    limit?: number
  } = {}): Promise<BulkSalaryOperation[]> {
    let query = this.supabase
      .from('bulk_salary_operations')
      .select(`
        *,
        bulk_salary_operation_items(count)
      `)
      .order('created_at', { ascending: false })

    if (filters.operation_type) {
      query = query.eq('operation_type', filters.operation_type)
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date)
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }
    if (filters.status) {
      query = query.eq('operation_status', filters.status)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Get bulk operation details by ID
  async getBulkOperationById(operationId: string): Promise<(BulkSalaryOperation & { bulk_salary_operation_items: BulkSalaryOperationItem[] }) | null> {
    const { data, error } = await this.supabase
      .from('bulk_salary_operations')
      .select(`
        *,
        bulk_salary_operation_items(*)
      `)
      .eq('id', operationId)
      .single()

    if (error) throw error
    return data
  }

  // Cancel bulk operation
  async cancelBulkOperation(
    operationId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.supabase
        .from('bulk_salary_operations')
        .update({
          operation_status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy,
          cancellation_reason: reason
        })
        .eq('id', operationId)

      return { success: true }
    } catch (error: any) {
      console.error('Error cancelling bulk operation:', error)
      return { success: false, error: error.message }
    }
  }

  // Get bulk operation statistics
  async getBulkOperationStats(filters: {
    start_date?: string
    end_date?: string
    created_by?: string
  } = {}): Promise<{
    total_operations: number
    total_employees_affected: number
    total_cost_impact: number
    operations_by_type: Record<string, number>
    operations_by_status: Record<string, number>
  }> {
    let query = this.supabase
      .from('bulk_salary_operations')
      .select('*')

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date)
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    const { data, error } = await query

    if (error) throw error

    const stats = {
      total_operations: data?.length || 0,
      total_employees_affected: 0,
      total_cost_impact: 0,
      operations_by_type: {} as Record<string, number>,
      operations_by_status: {} as Record<string, number>
    }

    data?.forEach(op => {
      stats.total_employees_affected += op.total_employees_affected
      stats.total_cost_impact += op.total_cost_impact

      stats.operations_by_type[op.operation_type] = (stats.operations_by_type[op.operation_type] || 0) + 1
      stats.operations_by_status[op.operation_status] = (stats.operations_by_status[op.operation_status] || 0) + 1
    })

    return stats
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
    let data: any[] = []
    try {
      let query = this.supabase
        .from('employee_change_log')
        .select('*')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('employee_id', { ascending: true })
        .order('created_at', { ascending: false })

      if (filters.employeeIds?.length) {
        query = query.in('employee_id', filters.employeeIds)
      }

      const result = await query

      if (result.error) {
        console.warn('employee_change_log query failed:', result.error.message)
      } else {
        data = result.data || []
      }
    } catch (error) {
      console.warn('Error accessing employee_change_log table:', error)
    }

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