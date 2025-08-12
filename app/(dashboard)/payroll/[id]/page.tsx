"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Calculator, 
  DollarSign, 
  FileText, 
  Users,
  Lock,
  Clock,
  CheckCircle
} from "lucide-react"
import { VariableInputForm } from "@/components/payroll/variable-input-form"
import { CalculationPreview } from "@/components/payroll/calculation-preview"
import { FinalizationWorkflow } from "@/components/payroll/finalization-workflow"
import { PayslipGenerator } from "@/components/payroll/payslip-generator"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { PayrollWithItems } from "@/lib/types/database"

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
      
      // Set initial tab based on payroll status
      if (data?.status === 'finalized') {
        setActiveTab('payslips')
      } else if (data?.status === 'calculated') {
        setActiveTab('review')
      } else {
        setActiveTab('variables')
      }
      
    } catch (error) {
      console.error('Error loading payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculatePayroll = async () => {
    try {
      await payrollService.calculatePayroll(payrollId, variableData)
      setRefreshTrigger(prev => prev + 1)
      setActiveTab('review')
    } catch (error: any) {
      alert(`Error calculating payroll: ${error.message}`)
    }
  }

  const handleVariablesUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleFinalized = () => {
    setRefreshTrigger(prev => prev + 1)
    setActiveTab('payslips')
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          icon: <Clock className="h-4 w-4" />,
          label: 'Draft',
          variant: 'outline' as const,
          description: 'Ready for variable input'
        }
      case 'calculated':
        return {
          icon: <Calculator className="h-4 w-4" />,
          label: 'Calculated', 
          variant: 'default' as const,
          description: 'Ready for review and finalization'
        }
      case 'finalized':
        return {
          icon: <Lock className="h-4 w-4" />,
          label: 'Finalized',
          variant: 'default' as const,
          description: 'Locked and complete'
        }
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          label: status,
          variant: 'outline' as const,
          description: ''
        }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading payroll details...</p>
        </div>
      </div>
    )
  }

  if (!payroll) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Payroll period not found</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/payroll')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payroll
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(payroll.status)
  const periodName = `${months[payroll.period_month - 1]} ${payroll.period_year}`

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/payroll')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">Payroll: {periodName}</h1>
              <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Employees</p>
                  <p className="text-2xl font-bold">{payroll.total_employees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Gross Salary</p>
                  <p className="text-2xl font-bold">{formatCurrency(payroll.total_gross_salary)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Tax</p>
                  <p className="text-2xl font-bold">{formatCurrency(payroll.total_pph21)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Net Payroll</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(payroll.total_net_salary)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger 
            value="variables" 
            disabled={payroll.status === 'finalized'}
          >
            Variable Input
          </TabsTrigger>
          <TabsTrigger value="review">
            Review & Calculate
          </TabsTrigger>
          <TabsTrigger value="finalization">
            Finalization
          </TabsTrigger>
          <TabsTrigger 
            value="payslips" 
            disabled={payroll.status !== 'finalized'}
          >
            Payslips
          </TabsTrigger>
        </TabsList>

        {/* Variable Input Tab */}
        <TabsContent value="variables">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Variable Components</span>
                </CardTitle>
                <CardDescription>
                  Add bonus, overtime, allowances, and deductions for employees in this payroll period
                </CardDescription>
              </CardHeader>
            </Card>
            
            <VariableInputForm 
              payrollId={payrollId}
              onVariablesUpdated={handleVariablesUpdated}
            />
            
            {payroll.status === 'draft' && (
              <div className="flex justify-end">
                <Button onClick={handleCalculatePayroll} size="lg">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Payroll
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Review & Calculate Tab */}
        <TabsContent value="review">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Payroll Calculations</span>
                </CardTitle>
                <CardDescription>
                  Review salary calculations, tax deductions, and BPJS contributions
                </CardDescription>
              </CardHeader>
            </Card>
            
            <CalculationPreview 
              payrollId={payrollId}
              variableData={variableData}
            />
            
            {payroll.status === 'calculated' && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => setActiveTab('finalization')}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Proceed to Finalization
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Finalization Tab */}
        <TabsContent value="finalization">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Payroll Finalization</span>
                </CardTitle>
                <CardDescription>
                  Final review and approval process to lock payroll calculations
                </CardDescription>
              </CardHeader>
            </Card>
            
            <FinalizationWorkflow 
              payrollId={payrollId}
              onFinalized={handleFinalized}
            />
          </div>
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips">
          <div className="space-y-6">
            <PayslipGenerator 
              payrollId={payrollId}
              payrollPeriod={payroll}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}