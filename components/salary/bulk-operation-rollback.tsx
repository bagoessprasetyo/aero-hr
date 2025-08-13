"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ProfessionalCard, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton,
  StatusBadge
} from "@/components/ui/professional"
import {
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Play,
  XCircle,
  FileText,
  ShieldCheck
} from "lucide-react"
import { SalaryHistoryService } from "@/lib/services/salary-history"
import type { 
  BulkSalaryOperation,
  BulkSalaryOperationItem
} from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

interface BulkOperationRollbackProps {
  className?: string
}

interface RollbackPlan {
  operation: BulkSalaryOperation
  affectedItems: BulkSalaryOperationItem[]
  totalEmployees: number
  totalReversalAmount: number
  estimatedDuration: string
  riskLevel: 'low' | 'medium' | 'high'
  warnings: string[]
}

interface RollbackProgress {
  currentStep: string
  completedItems: number
  totalItems: number
  currentEmployee?: string
  errors: Array<{ employee_id: string; error: string }>
}

const salaryHistoryService = new SalaryHistoryService()

export function BulkOperationRollback({ className }: BulkOperationRollbackProps) {
  const [eligibleOperations, setEligibleOperations] = useState<BulkSalaryOperation[]>([])
  const [selectedOperation, setSelectedOperation] = useState<BulkSalaryOperation | null>(null)
  const [rollbackPlan, setRollbackPlan] = useState<RollbackPlan | null>(null)
  const [rollbackReason, setRollbackReason] = useState('')
  const [partialRollback, setPartialRollback] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [rollbackProgress, setRollbackProgress] = useState<RollbackProgress | null>(null)

  useEffect(() => {
    loadEligibleOperations()
  }, [])

  const loadEligibleOperations = async () => {
    try {
      setLoading(true)
      // Load completed operations from the last 30 days that can be rolled back
      const operations = await salaryHistoryService.getBulkOperationHistory({
        status: 'completed',
        limit: 50
      })
      
      // Filter operations that are eligible for rollback (completed in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const eligible = operations.filter(op => 
        new Date(op.completed_at || op.created_at) > thirtyDaysAgo
      )
      
      setEligibleOperations(eligible)
    } catch (error) {
      console.error('Error loading eligible operations:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRollbackPlan = async (operation: BulkSalaryOperation) => {
    try {
      setLoading(true)
      
      // Get operation details with items
      const operationDetails = await salaryHistoryService.getBulkOperationById(operation.id)
      if (!operationDetails?.bulk_salary_operation_items) return

      const items = operationDetails.bulk_salary_operation_items
      const affectedItems = items.filter(item => item.item_status === 'applied')
      
      // Calculate total reversal amount
      const totalReversalAmount = affectedItems.reduce((sum, item) => 
        sum + (item.salary_change_amount || 0), 0
      )

      // Assess risk level
      const daysSinceCompletion = Math.floor(
        (Date.now() - new Date(operation.completed_at || operation.created_at).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      const warnings: string[] = []

      if (daysSinceCompletion > 7) {
        riskLevel = 'medium'
        warnings.push('Operation was completed more than 7 days ago')
      }
      if (daysSinceCompletion > 14) {
        riskLevel = 'high'
        warnings.push('Operation was completed more than 14 days ago - payroll may have been processed')
      }
      if (totalReversalAmount > 100000000) { // 100M IDR
        riskLevel = 'high'
        warnings.push('Large financial impact - requires additional approval')
      }
      if (affectedItems.length > 100) {
        warnings.push('Large number of employees affected - rollback will take significant time')
      }

      // Check for subsequent salary changes
      const hasSubsequentChanges = await checkForSubsequentChanges(affectedItems)
      if (hasSubsequentChanges.length > 0) {
        riskLevel = 'high'
        warnings.push(`${hasSubsequentChanges.length} employees have had salary changes since this operation`)
      }

      const plan: RollbackPlan = {
        operation: operationDetails,
        affectedItems,
        totalEmployees: affectedItems.length,
        totalReversalAmount: Math.abs(totalReversalAmount),
        estimatedDuration: estimateRollbackDuration(affectedItems.length),
        riskLevel,
        warnings
      }

      setRollbackPlan(plan)
      setSelectedOperation(operationDetails)
    } catch (error) {
      console.error('Error generating rollback plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkForSubsequentChanges = async (items: BulkSalaryOperationItem[]): Promise<string[]> => {
    // Simulate checking for subsequent changes
    // In real implementation, would query salary history for changes after the operation
    return [] // Return employee IDs with subsequent changes
  }

  const estimateRollbackDuration = (itemCount: number): string => {
    const minutesPerItem = 0.1
    const totalMinutes = itemCount * minutesPerItem
    
    if (totalMinutes < 1) return 'Less than 1 minute'
    if (totalMinutes < 60) return `${Math.ceil(totalMinutes)} minutes`
    return `${Math.ceil(totalMinutes / 60)} hours`
  }

  const executeRollback = async () => {
    if (!rollbackPlan || !rollbackReason.trim()) return

    try {
      setExecuting(true)
      const itemsToRollback = partialRollback 
        ? rollbackPlan.affectedItems.filter(item => selectedItems.has(item.id))
        : rollbackPlan.affectedItems

      setRollbackProgress({
        currentStep: 'Initializing rollback...',
        completedItems: 0,
        totalItems: itemsToRollback.length,
        errors: []
      })

      // Create rollback operation record
      const rollbackOperationId = await createRollbackOperation(rollbackPlan.operation, rollbackReason)
      
      setRollbackProgress(prev => prev ? {
        ...prev,
        currentStep: 'Reversing salary changes...'
      } : null)

      // Process each item
      for (let i = 0; i < itemsToRollback.length; i++) {
        const item = itemsToRollback[i]
        
        setRollbackProgress(prev => prev ? {
          ...prev,
          currentStep: `Reversing changes for employee ${item.employee_id}`,
          completedItems: i,
          currentEmployee: item.employee_id
        } : null)

        try {
          await reverseSalaryChanges(item, rollbackOperationId)
        } catch (error: any) {
          setRollbackProgress(prev => prev ? {
            ...prev,
            errors: [...prev.errors, { employee_id: item.employee_id, error: error.message }]
          } : null)
        }

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setRollbackProgress(prev => prev ? {
        ...prev,
        currentStep: 'Rollback completed',
        completedItems: itemsToRollback.length
      } : null)

      // Reset form after completion
      setTimeout(() => {
        setExecuting(false)
        setRollbackProgress(null)
        setSelectedOperation(null)
        setRollbackPlan(null)
        setRollbackReason('')
        setPartialRollback(false)
        setSelectedItems(new Set())
        loadEligibleOperations()
      }, 2000)

    } catch (error: any) {
      console.error('Error executing rollback:', error)
      setExecuting(false)
      setRollbackProgress(null)
    }
  }

  const createRollbackOperation = async (originalOperation: BulkSalaryOperation, reason: string): Promise<string> => {
    // Create a new operation record for the rollback
    const rollbackOp = await salaryHistoryService.createBulkSalaryOperation({
      operation_type: 'rollback' as any,
      operation_name: `Rollback: ${originalOperation.operation_name}`,
      operation_description: `Rollback of operation ${originalOperation.id}. Reason: ${reason}`,
      adjustment_type: 'rollback' as any,
      effective_date: new Date().toISOString().split('T')[0],
      employee_ids: rollbackPlan?.affectedItems.map(item => item.employee_id) || [],
      preview_data: [],
      total_cost_impact: -(rollbackPlan?.totalReversalAmount || 0),
      created_by: 'current_user'
    })
    
    return rollbackOp.operation_id || ''
  }

  const reverseSalaryChanges = async (item: BulkSalaryOperationItem, rollbackOperationId: string) => {
    // Reverse the salary changes for this item
    // This would involve updating salary components back to their previous values
    
    // Get the original salary values and restore them
    // In a real implementation, this would:
    // 1. Query the original salary components before the operation
    // 2. Update current salary components to those values
    // 3. Create audit trail entries for the rollback
  }

  const handleItemSelection = (itemId: string, selected: boolean) => {
    const newSelection = new Set(selectedItems)
    if (selected) {
      newSelection.add(itemId)
    } else {
      newSelection.delete(itemId)
    }
    setSelectedItems(newSelection)
  }

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
    }
  }

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return <CheckCircle2 className="h-4 w-4" />
      case 'medium': return <Clock className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Bulk Operation Rollback</span>
          </CardTitle>
          <CardDescription>
            Reverse completed bulk salary operations and restore previous salary states
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {executing && rollbackProgress && (
        <ProfessionalCard>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 animate-spin" />
              <span>Rollback in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{rollbackProgress.completedItems} / {rollbackProgress.totalItems}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: rollbackProgress.totalItems > 0 
                        ? `${(rollbackProgress.completedItems / rollbackProgress.totalItems) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span>{rollbackProgress.currentStep}</span>
              </div>

              {rollbackProgress.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-medium text-red-800 mb-2">Errors ({rollbackProgress.errors.length})</h4>
                  <div className="space-y-1 text-sm text-red-700">
                    {rollbackProgress.errors.slice(0, 3).map((error, index) => (
                      <div key={index}>Employee {error.employee_id}: {error.error}</div>
                    ))}
                    {rollbackProgress.errors.length > 3 && (
                      <div>... and {rollbackProgress.errors.length - 3} more errors</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Operation Selection */}
        <div className="lg:col-span-2 space-y-6">
          <ProfessionalCard>
            <CardHeader>
              <CardTitle>Select Operation to Rollback</CardTitle>
              <CardDescription>
                Choose a completed operation from the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <LoadingSkeleton key={i} lines={2} className="h-16" />
                  ))}
                </div>
              ) : eligibleOperations.length === 0 ? (
                <EmptyState
                  icon={<RotateCcw className="h-8 w-8" />}
                  title="No eligible operations"
                  description="No completed operations available for rollback"
                />
              ) : (
                <div className="space-y-3">
                  {eligibleOperations.map(operation => (
                    <div 
                      key={operation.id}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-colors",
                        selectedOperation?.id === operation.id 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => generateRollbackPlan(operation)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{operation.operation_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {operation.operation_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">{operation.total_employees_affected}</span> employees
                        </div>
                        <div>
                          <span className="font-medium">{formatCurrency(operation.total_cost_impact)}</span> impact
                        </div>
                        <div>
                          {new Date(operation.completed_at || operation.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>

          {/* Rollback Configuration */}
          {rollbackPlan && (
            <ProfessionalCard>
              <CardHeader>
                <CardTitle>Rollback Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rollback-reason">Rollback Reason (Required)</Label>
                  <Textarea
                    id="rollback-reason"
                    value={rollbackReason}
                    onChange={(e) => setRollbackReason(e.target.value)}
                    placeholder="Explain why this operation needs to be rolled back..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="partial-rollback"
                    checked={partialRollback}
                    onCheckedChange={(checked) => setPartialRollback(checked === true)}
                  />
                  <label htmlFor="partial-rollback" className="text-sm">
                    Partial rollback (select specific employees)
                  </label>
                </div>

                {partialRollback && (
                  <div className="max-h-32 overflow-y-auto border rounded p-3">
                    <div className="space-y-2">
                      {rollbackPlan.affectedItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`item-${item.id}`}
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={(checked) => 
                              handleItemSelection(item.id, checked === true)
                            }
                          />
                          <label htmlFor={`item-${item.id}`} className="text-sm flex-1">
                            Employee {item.employee_id} - {formatCurrency(Math.abs(item.salary_change_amount || 0))}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ActionButton
                  variant="destructive"
                  onClick={executeRollback}
                  disabled={!rollbackReason.trim() || executing || (partialRollback && selectedItems.size === 0)}
                  className="w-full"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {executing ? 'Executing Rollback...' : 'Execute Rollback'}
                </ActionButton>
              </CardContent>
            </ProfessionalCard>
          )}
        </div>

        {/* Rollback Plan */}
        <div>
          {rollbackPlan && (
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Rollback Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Risk Assessment */}
                <div className={cn("p-3 rounded-lg", getRiskColor(rollbackPlan.riskLevel))}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getRiskIcon(rollbackPlan.riskLevel)}
                    <span className="font-medium capitalize">{rollbackPlan.riskLevel} Risk</span>
                  </div>
                  {rollbackPlan.warnings.length > 0 && (
                    <ul className="text-sm space-y-1">
                      {rollbackPlan.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Employees Affected:</span>
                    <span className="font-medium">{rollbackPlan.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Reversal:</span>
                    <span className="font-medium">{formatCurrency(rollbackPlan.totalReversalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated Duration:</span>
                    <span className="font-medium">{rollbackPlan.estimatedDuration}</span>
                  </div>
                </div>

                {/* Operation Details */}
                <div className="pt-3 border-t">
                  <h4 className="font-medium mb-2">Original Operation</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Name: {rollbackPlan.operation.operation_name}</div>
                    <div>Type: {rollbackPlan.operation.operation_type.replace('_', ' ')}</div>
                    <div>Completed: {new Date(rollbackPlan.operation.completed_at || rollbackPlan.operation.created_at).toLocaleDateString('id-ID')}</div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          )}
        </div>
      </div>
    </div>
  )
}