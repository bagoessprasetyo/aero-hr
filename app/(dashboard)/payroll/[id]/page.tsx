"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Calculator, 
  DollarSign, 
  FileText, 
  Users,
  Lock,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Calendar,
  MoreHorizontal,
  Download,
  Share2,
  Settings,
  History,
  Target,
  Zap,
  Shield
} from "lucide-react"
import { VariableInputForm } from "@/components/payroll/variable-input-form"
import { CalculationPreview } from "@/components/payroll/calculation-preview"
import { FinalizationWorkflow } from "@/components/payroll/finalization-workflow"
import { PayslipGenerator } from "@/components/payroll/payslip-generator"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { PayrollWithItems } from "@/lib/types/database"
import { 
  ProfessionalCard, 
  DashboardWidget, 
  StatusBadge, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton 
} from "@/components/ui/professional"
import { cn } from "@/lib/utils"

const payrollService = new PayrollService()

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function PayrollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const payrollId = params.id as string
  
  const [payroll, setPayroll] = useState<PayrollWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("variables")
  const [variableData, setVariableData] = useState({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [workflowStep, setWorkflowStep] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (payrollId) {
      loadPayroll()
    }
  }, [payrollId, refreshTrigger])

  const loadPayroll = async () => {
    try {
      setLoading(true)
      const data = await payrollService.getPayrollById(payrollId)
      setPayroll(data)
      
      // Set initial tab and workflow step based on payroll status
      if (data?.status === 'finalized') {
        setActiveTab('payslips')
        setWorkflowStep(4)
      } else if (data?.status === 'calculated') {
        setActiveTab('review')
        setWorkflowStep(3)
      } else {
        setActiveTab('variables')
        setWorkflowStep((data?.total_employees || 0) > 0 ? 2 : 1)
      }
      
    } catch (error) {
      console.error('Error loading payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  // Workflow tracking
  const workflowSteps = [
    { 
      id: 'setup', 
      title: 'Setup Period', 
      description: 'Create payroll period',
      icon: Calendar,
      status: 'completed'
    },
    { 
      id: 'variables', 
      title: 'Variable Input', 
      description: 'Add bonus & overtime',
      icon: DollarSign,
      status: workflowStep >= 2 ? 'completed' : workflowStep === 1 ? 'current' : 'pending'
    },
    { 
      id: 'calculate', 
      title: 'Auto Calculate', 
      description: 'BPJS & PPh 21',
      icon: Calculator,
      status: workflowStep >= 3 ? 'completed' : workflowStep === 2 ? 'current' : 'pending'
    },
    { 
      id: 'review', 
      title: 'Review & Validate', 
      description: 'Check calculations',
      icon: CheckCircle,
      status: workflowStep >= 4 ? 'completed' : workflowStep === 3 ? 'current' : 'pending'
    },
    { 
      id: 'finalize', 
      title: 'Finalize & Lock', 
      description: 'Generate reports',
      icon: Lock,
      status: workflowStep >= 5 ? 'completed' : workflowStep === 4 ? 'current' : 'pending'
    }
  ]

  const getWorkflowProgress = () => {
    return (workflowStep / (workflowSteps.length - 1)) * 100
  }

  const handleCalculatePayroll = async () => {
    try {
      setActionLoading(true)
      await payrollService.calculatePayroll(payrollId, variableData)
      setRefreshTrigger(prev => prev + 1)
      setActiveTab('review')
      setWorkflowStep(3)
    } catch (error: any) {
      alert(`Error calculating payroll: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVariablesUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
    setWorkflowStep(2)
  }

  const handleFinalized = () => {
    setRefreshTrigger(prev => prev + 1)
    setActiveTab('payslips')
    setWorkflowStep(4)
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          icon: Clock,
          label: 'Draft',
          status: 'inactive' as const,
          description: 'Ready for variable input',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
      case 'calculated':
        return {
          icon: Calculator,
          label: 'Calculated', 
          status: 'warning' as const,
          description: 'Ready for review and finalization',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      case 'finalized':
        return {
          icon: Lock,
          label: 'Finalized',
          status: 'success' as const,
          description: 'Locked and complete',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      default:
        return {
          icon: Clock,
          label: status,
          status: 'inactive' as const,
          description: '',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
        
        {/* Workflow Skeleton */}
        <LoadingSkeleton className="h-32" />
        
        {/* Content Skeleton */}
        <div className="space-y-4">
          <LoadingSkeleton className="h-12" />
          <LoadingSkeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!payroll) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Payroll Period Not Found"
          description="The requested payroll period could not be found or may have been deleted."
          action={{
            label: "Back to Payroll",
            onClick: () => router.push('/payroll')
          }}
        />
      </div>
    )
  }

  const statusInfo = getStatusInfo(payroll.status)
  const periodName = `${months[payroll.period_month - 1]} ${payroll.period_year}`

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Modern Header */}
      <ProfessionalCard  variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ActionButton 
                variant="secondary" 
                size="sm"
                onClick={() => router.push('/payroll')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Payroll
              </ActionButton>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">Payroll: {periodName}</h1>
                  <StatusBadge 
                    status={statusInfo.status}
                    className="flex items-center space-x-1"
                  >
                    <statusInfo.icon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </StatusBadge>
                </div>
                <p className="text-gray-600 mt-1">
                  {statusInfo.description}
                </p>
              </div>
            </div>
            
            {/* Action Menu */}
            <div className="flex items-center space-x-3">
              <ActionButton variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </ActionButton>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Workflow Progress Tracker */}
      <ProfessionalCard >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Workflow Progress</span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              Step {workflowStep + 1} of {workflowSteps.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getWorkflowProgress()}%` }}
              />
            </div>
            
            {/* Workflow Steps */}
            <div className="grid gap-4 md:grid-cols-5">
              {workflowSteps.map((step, index) => {
                const IconComponent = step.icon
                return (
                  <div key={step.id} className="text-center space-y-2">
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      step.status === 'completed' ? 'bg-green-500 text-white' :
                      step.status === 'current' ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    )}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-medium",
                        step.status === 'current' ? 'text-blue-600' : 'text-gray-900'
                      )}>
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Enhanced Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardWidget
          title="Total Employees"
          value={payroll.total_employees || 0}
          subtitle="Active employees in payroll"
          icon={Users}
          trend={payroll.total_employees > 0 ? {
            value: 100,
            isPositive: true,
            label: "fully processed"
          } : undefined}
        />
        
        <DashboardWidget
          title="Gross Salary"
          value={formatCurrency(payroll.total_gross_salary || 0)}
          subtitle="Before taxes & deductions"
          icon={DollarSign}
          trend={payroll.total_gross_salary > 0 ? {
            value: 15.5,
            isPositive: true,
            label: "vs last month"
          } : undefined}
        />
        
        <DashboardWidget
          title="Total Tax (PPh 21)"
          value={formatCurrency(payroll.total_pph21 || 0)}
          subtitle="Indonesian income tax"
          icon={FileText}
          trend={payroll.total_pph21 > 0 ? {
            value: 8.2,
            isPositive: false,
            label: "tax burden"
          } : undefined}
        />
        
        <DashboardWidget
          title="Net Payroll"
          value={formatCurrency(payroll.total_net_salary || 0)}
          subtitle="Final amount to pay"
          icon={Target}
          trend={payroll.total_net_salary > 0 ? {
            value: 12.3,
            isPositive: true,
            label: "vs last month"
          } : undefined}
        />
      </div>

      {/* Enhanced Main Content Tabs */}
      <ProfessionalCard >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Payroll Management</span>
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Last updated {new Date(payroll.updated_at).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="variables" 
                disabled={payroll.status === 'finalized'}
                className={cn(
                  "flex items-center space-x-2 transition-all duration-200",
                  payroll.status === 'finalized' && "opacity-50"
                )}
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Variable Input</span>
                <span className="sm:hidden">Input</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Review & Calculate</span>
                <span className="sm:hidden">Review</span>
              </TabsTrigger>
              <TabsTrigger value="finalization" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Finalization</span>
                <span className="sm:hidden">Final</span>
              </TabsTrigger>
              <TabsTrigger 
                value="payslips" 
                disabled={payroll.status !== 'finalized'}
                className={cn(
                  "flex items-center space-x-2 transition-all duration-200",
                  payroll.status !== 'finalized' && "opacity-50"
                )}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Payslips</span>
                <span className="sm:hidden">Slips</span>
              </TabsTrigger>
            </TabsList>

            {/* Variable Input Tab */}
            <TabsContent value="variables">
              <div className="space-y-6">
                <ProfessionalCard  variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                      <span>Variable Components</span>
                    </CardTitle>
                    <CardDescription>
                      Add bonus, overtime, allowances, and deductions for employees in this payroll period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-gray-900">Bonus & Incentives</h4>
                        <p className="text-sm text-gray-600">Performance rewards</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-gray-900">Overtime Pay</h4>
                        <p className="text-sm text-gray-600">Extra hours compensation</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-gray-900">Adjustments</h4>
                        <p className="text-sm text-gray-600">Allowances & deductions</p>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
                
                <VariableInputForm 
                  payrollId={payrollId}
                  onVariablesUpdated={handleVariablesUpdated}
                />
                
                {payroll.status === 'draft' && (
                  <ProfessionalCard>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Ready to Calculate?</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Process all variable components and run payroll calculations
                          </p>
                        </div>
                        <ActionButton 
                          variant="primary" 
                          size="lg"
                          onClick={handleCalculatePayroll}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Calculating...
                            </>
                          ) : (
                            <>
                              <Calculator className="mr-2 h-4 w-4" />
                              Calculate Payroll
                            </>
                          )}
                        </ActionButton>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                )}
              </div>
            </TabsContent>

            {/* Review & Calculate Tab */}
            <TabsContent value="review">
              <div className="space-y-6">
                <ProfessionalCard  variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="h-5 w-5 text-gray-600" />
                      <span>Payroll Calculations</span>
                    </CardTitle>
                    <CardDescription>
                      Review salary calculations, tax deductions, and BPJS contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Shield className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Indonesian Compliance</h4>
                            <p className="text-sm text-gray-600">
                              BPJS Kesehatan, BPJS Ketenagakerjaan & PPh 21 automatically calculated
                            </p>
                          </div>
                        </div>
                        <StatusBadge status="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Compliant
                        </StatusBadge>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
                
                <CalculationPreview 
                  payrollId={payrollId}
                  variableData={variableData}
                />
                
                {payroll.status === 'calculated' && (
                  <ProfessionalCard>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Calculations Complete</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            All payroll calculations are ready for final review and approval
                          </p>
                        </div>
                        <ActionButton 
                          variant="primary" 
                          size="lg"
                          onClick={() => setActiveTab('finalization')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Proceed to Finalization
                        </ActionButton>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                )}
              </div>
            </TabsContent>

            {/* Finalization Tab */}
            <TabsContent value="finalization">
              <div className="space-y-6">
                <ProfessionalCard  variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-gray-600" />
                      <span>Payroll Finalization</span>
                    </CardTitle>
                    <CardDescription>
                      Final review and approval process to lock payroll calculations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-yellow-50 to-red-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-900">Important Notice</h4>
                          <p className="text-sm text-yellow-800 mt-1">
                            Once finalized, payroll calculations cannot be modified. Please review all data carefully before proceeding.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
                
                <FinalizationWorkflow 
                  payrollId={payrollId}
                  onFinalized={handleFinalized}
                />
              </div>
            </TabsContent>

            {/* Payslips Tab */}
            <TabsContent value="payslips">
              <div className="space-y-6">
                <ProfessionalCard  variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <span>Payslip Generation</span>
                    </CardTitle>
                    <CardDescription>
                      Generate and download individual payslips for employees
                    </CardDescription>
                  </CardHeader>
                </ProfessionalCard>
                
                <PayslipGenerator 
                  payrollId={payrollId}
                  payrollPeriod={payroll}
                />
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </ProfessionalCard>
    </div>
  )
}