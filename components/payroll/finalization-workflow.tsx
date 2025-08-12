"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Lock,
  FileText,
  Users,
  DollarSign,
  Shield,
  Eye,
  Download
} from "lucide-react"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { Payroll, PayrollWithItems } from "@/lib/types/database"

interface FinalizationWorkflowProps {
  payrollId: string
  onFinalized?: () => void
}

const payrollService = new PayrollService()

export function FinalizationWorkflow({ payrollId, onFinalized }: FinalizationWorkflowProps) {
  const [payroll, setPayroll] = useState<PayrollWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [validation, setValidation] = useState<any>(null)
  const [checklist, setChecklist] = useState({
    dataReviewed: false,
    calculationsVerified: false,
    approvalObtained: false,
    backupCreated: false
  })
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    loadPayrollData()
    validatePayroll()
  }, [payrollId])

  const loadPayrollData = async () => {
    try {
      setLoading(true)
      const data = await payrollService.getPayrollById(payrollId)
      setPayroll(data)
    } catch (error) {
      console.error('Error loading payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  const validatePayroll = async () => {
    try {
      const validation = await payrollService.validatePayroll(payrollId)
      setValidation(validation)
    } catch (error) {
      console.error('Error validating payroll:', error)
    }
  }

  const handleFinalize = async () => {
    if (!validation?.isValid) {
      alert('Please resolve all validation issues before finalizing')
      return
    }

    if (!allChecklistItems) {
      alert('Please complete all checklist items before finalizing')
      return
    }

    try {
      setFinalizing(true)
      await payrollService.finalizePayroll(payrollId)
      setShowConfirmDialog(false)
      
      if (onFinalized) {
        onFinalized()
      }
      
      // Reload data to show finalized state
      loadPayrollData()
      
    } catch (error: any) {
      alert(`Error finalizing payroll: ${error.message}`)
    } finally {
      setFinalizing(false)
    }
  }

  const allChecklistItems = Object.values(checklist).every(Boolean)
  const canFinalize = payroll?.status === 'calculated' && validation?.isValid && allChecklistItems

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loading payroll data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!payroll) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Payroll not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                {payroll.status === 'finalized' ? (
                  <Lock className="h-5 w-5 text-green-600" />
                ) : payroll.status === 'calculated' ? (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-600" />
                )}
                <span>Payroll Finalization</span>
              </CardTitle>
              <CardDescription>
                {payroll.status === 'finalized' 
                  ? `Finalized on ${payroll.finalized_at ? new Date(payroll.finalized_at).toLocaleString() : 'N/A'}`
                  : 'Review and finalize payroll calculations'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {new Date(2024, payroll.period_month - 1).toLocaleString('default', { month: 'long' })} {payroll.period_year}
              </div>
              {payroll.status === 'finalized' ? (
                <Badge className="bg-green-100 text-green-800">
                  <Lock className="h-3 w-3 mr-1" />
                  Finalized
                </Badge>
              ) : payroll.status === 'calculated' ? (
                <Badge className="bg-blue-100 text-blue-800">
                  Ready to Finalize
                </Badge>
              ) : (
                <Badge variant="outline">
                  {payroll.status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Employees</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payroll.total_employees}</div>
            <p className="text-xs text-muted-foreground">{payroll.payroll_items.length} processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payroll.total_gross_salary)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payroll.total_pph21 + payroll.total_bpjs_employee)}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>PPh 21: {formatCurrency(payroll.total_pph21)}</div>
              <div>BPJS: {formatCurrency(payroll.total_bpjs_employee)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(payroll.total_net_salary)}
            </div>
            <p className="text-xs text-muted-foreground">
              Company cost: {formatCurrency(payroll.total_net_salary + payroll.total_bpjs_company)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span>Validation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validation.isValid ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All validations passed. Payroll is ready for finalization.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {validation.issues.length} validation issue{validation.issues.length > 1 ? 's' : ''} found. Please resolve before finalizing.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  {validation.issues.map((issue: any, index: number) => (
                    <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">{issue.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{issue.message}</p>
                      {issue.employees && (
                        <div className="mt-2 text-xs text-red-600">
                          Affected employees: {issue.employees.map((emp: any) => emp.full_name).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finalization Checklist */}
      {payroll.status !== 'finalized' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Finalization Checklist</span>
            </CardTitle>
            <CardDescription>
              Complete all items before finalizing payroll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="dataReviewed"
                  checked={checklist.dataReviewed}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, dataReviewed: !!checked }))
                  }
                />
                <label htmlFor="dataReviewed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Employee data and salary components have been reviewed for accuracy
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="calculationsVerified"
                  checked={checklist.calculationsVerified}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, calculationsVerified: !!checked }))
                  }
                />
                <label htmlFor="calculationsVerified" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  BPJS and PPh 21 calculations have been verified against sample calculations
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="approvalObtained"
                  checked={checklist.approvalObtained}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, approvalObtained: !!checked }))
                  }
                />
                <label htmlFor="approvalObtained" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Management approval has been obtained for this payroll
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="backupCreated"
                  checked={checklist.backupCreated}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, backupCreated: !!checked }))
                  }
                />
                <label htmlFor="backupCreated" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Payroll data backup has been created and secured
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview Report
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
        
        {payroll.status === 'finalized' ? (
          <div className="flex items-center space-x-2 text-green-600">
            <Lock className="h-4 w-4" />
            <span className="font-medium">Payroll Finalized</span>
          </div>
        ) : (
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button 
                disabled={!canFinalize}
                className="bg-red-600 hover:bg-red-700"
              >
                <Lock className="mr-2 h-4 w-4" />
                Finalize Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Confirm Payroll Finalization</span>
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Once finalized, payroll calculations will be locked and cannot be modified.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Final Summary</h4>
                  <div className="space-y-1 text-sm text-red-700">
                    <div>• {payroll.total_employees} employees will be paid</div>
                    <div>• Total net payroll: {formatCurrency(payroll.total_net_salary)}</div>
                    <div>• Total company cost: {formatCurrency(payroll.total_net_salary + payroll.total_bpjs_company)}</div>
                    <div>• PPh 21 tax obligation: {formatCurrency(payroll.total_pph21)}</div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleFinalize} 
                    disabled={finalizing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {finalizing ? 'Finalizing...' : 'Finalize Payroll'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}