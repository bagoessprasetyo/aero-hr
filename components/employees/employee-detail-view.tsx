"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Briefcase, 
  CreditCard, 
  Shield, 
  Calculator,
  FileText,
  Plus,
  Trash2
} from "lucide-react"
import { EmployeeService } from "@/lib/services/employees"
import type { EmployeeWithSalaryComponents } from "@/lib/types/database"
import { formatCurrency, formatNPWP } from "@/lib/utils/validation"
import { calculateBPJS } from "@/lib/calculations/bpjs"
import { calculatePPh21 } from "@/lib/calculations/pph21"
import { SalaryComponentManager } from "@/components/employees/salary-component-manager"
import { SalaryHistoryTimelineComponent } from "@/components/employees/salary-history-timeline"
import { SalaryComparison } from "@/components/employees/salary-comparison"

interface EmployeeDetailViewProps {
  employeeId: string
}

const employeeService = new EmployeeService()

export function EmployeeDetailView({ employeeId }: EmployeeDetailViewProps) {
  const [employee, setEmployee] = useState<EmployeeWithSalaryComponents | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadEmployeeDetails()
  }, [employeeId])

  const loadEmployeeDetails = async () => {
    try {
      setLoading(true)
      const employeeData = await employeeService.getEmployeeById(employeeId)
      setEmployee(employeeData)
    } catch (error: any) {
      setError(error.message || "Failed to load employee details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'resigned':
        return <Badge className="bg-yellow-100 text-yellow-800">Resigned</Badge>
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getEmploymentTypeBadge = (type: string) => {
    return type === 'permanent' 
      ? <Badge variant="outline" className="text-blue-700">Permanent</Badge>
      : <Badge variant="outline" className="text-purple-700">Contract</Badge>
  }

  const calculatePayrollPreview = () => {
    if (!employee || !employee.salary_components) return null

    const basicSalary = employee.salary_components
      .filter(comp => comp.component_type === 'basic_salary' && comp.is_active)
      .reduce((total, comp) => total + comp.amount, 0)

    const fixedAllowances = employee.salary_components
      .filter(comp => comp.component_type === 'fixed_allowance' && comp.is_active)
      .reduce((total, comp) => total + comp.amount, 0)

    const grossSalary = basicSalary + fixedAllowances

    if (grossSalary === 0) return null

    const bpjsCalc = calculateBPJS(
      grossSalary,
      employee.bpjs_health_enrolled,
      employee.bpjs_manpower_enrolled
    )

    const pph21Calc = calculatePPh21(
      grossSalary,
      employee.ptkp_status,
      bpjsCalc
    )

    return {
      basicSalary,
      fixedAllowances,
      grossSalary,
      bpjsEmployee: bpjsCalc.totalEmployeeContribution,
      bpjsCompany: bpjsCalc.totalCompanyContribution,
      pph21Monthly: pph21Calc.pph21Monthly,
      netSalary: grossSalary - bpjsCalc.totalEmployeeContribution - pph21Calc.pph21Monthly
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading employee details...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !employee) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error || "Employee not found"}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/employees')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </CardContent>
      </Card>
    )
  }

  const payrollPreview = calculatePayrollPreview()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/employees')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{employee.full_name}</h1>
            <p className="text-muted-foreground">
              {employee.position_title} • {employee.department}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(employee.employee_status)}
          {getEmploymentTypeBadge(employee.employment_status)}
          <Button onClick={() => router.push(`/employees/${employeeId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="salary">Salary Components</TabsTrigger>
          <TabsTrigger value="salary-history">Salary History</TabsTrigger>
          <TabsTrigger value="salary-comparison">Salary Analysis</TabsTrigger>
          <TabsTrigger value="calculations">Tax & BPJS</TabsTrigger>
          <TabsTrigger value="history">Employment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                    <p className="font-mono">{employee.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p>{employee.full_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">NIK</p>
                    <p className="font-mono">{employee.nik}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">NPWP</p>
                    <p className="font-mono">{employee.npwp ? formatNPWP(employee.npwp) : 'Not provided'}</p>
                  </div>
                </div>

                {(employee.email || employee.phone) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{employee.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{employee.phone || 'Not provided'}</p>
                    </div>
                  </div>
                )}

                {employee.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">{employee.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Employment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Position</p>
                    <p>{employee.position_title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p>{employee.department}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                    <p>{new Date(employee.join_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                    <p className="capitalize">{employee.employment_status}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(employee.employee_status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Financial Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                    <p>{employee.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                    <p className="font-mono">{employee.bank_account_number}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PTKP Status</p>
                  <p>{employee.ptkp_status}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.ptkp_status.startsWith('TK') ? 'Single' : 'Married'} • 
                    {employee.ptkp_status.endsWith('/0') ? ' No dependents' : 
                     employee.ptkp_status.endsWith('/1') ? ' 1 dependent' :
                     employee.ptkp_status.endsWith('/2') ? ' 2 dependents' : ' 3 dependents'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* BPJS Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>BPJS Enrollment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">BPJS Health (Kesehatan)</span>
                    <Badge variant={employee.bpjs_health_enrolled ? "default" : "outline"}>
                      {employee.bpjs_health_enrolled ? "Enrolled" : "Not Enrolled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">BPJS Manpower (Ketenagakerjaan)</span>
                    <Badge variant={employee.bpjs_manpower_enrolled ? "default" : "outline"}>
                      {employee.bpjs_manpower_enrolled ? "Enrolled" : "Not Enrolled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          <SalaryComponentManager 
            employee={employee} 
            onUpdate={loadEmployeeDetails}
          />
        </TabsContent>

        <TabsContent value="salary-history" className="space-y-6">
          <SalaryHistoryTimelineComponent employee={employee} />
        </TabsContent>

        <TabsContent value="salary-comparison" className="space-y-6">
          <SalaryComparison employee={employee} />
        </TabsContent>

        <TabsContent value="calculations" className="space-y-6">
          {payrollPreview ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Salary Calculation Preview</span>
                  </CardTitle>
                  <CardDescription>
                    Based on current salary components
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Basic Salary</span>
                      <span className="font-medium">{formatCurrency(payrollPreview.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fixed Allowances</span>
                      <span className="font-medium">{formatCurrency(payrollPreview.fixedAllowances)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Gross Salary</span>
                      <span>{formatCurrency(payrollPreview.grossSalary)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Deductions</CardTitle>
                  <CardDescription>
                    BPJS contributions and income tax
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">BPJS Employee</span>
                      <span className="font-medium">{formatCurrency(payrollPreview.bpjsEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">PPh 21 Tax</span>
                      <span className="font-medium">{formatCurrency(payrollPreview.pph21Monthly)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Net Salary</span>
                      <span>{formatCurrency(payrollPreview.netSalary)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Company Costs</CardTitle>
                  <CardDescription>
                    Total cost to company including employer contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(payrollPreview.grossSalary)}</p>
                      <p className="text-sm text-muted-foreground">Employee Salary</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(payrollPreview.bpjsCompany)}</p>
                      <p className="text-sm text-muted-foreground">Company BPJS</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(payrollPreview.grossSalary + payrollPreview.bpjsCompany)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No salary components configured</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add salary components to see tax and BPJS calculations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Employment History</span>
              </CardTitle>
              <CardDescription>
                Key events and changes in employment record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border-l-4 border-blue-500 bg-blue-50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Employee Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(employee.created_at).toLocaleDateString('id-ID')} • 
                      Initial profile setup completed
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 border-l-4 border-green-500 bg-green-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Employment Started</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(employee.join_date).toLocaleDateString('id-ID')} • 
                      Joined as {employee.position_title} in {employee.department}
                    </p>
                  </div>
                </div>

                {employee.updated_at !== employee.created_at && (
                  <div className="flex items-center space-x-4 p-4 border-l-4 border-yellow-500 bg-yellow-50">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Profile Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(employee.updated_at).toLocaleDateString('id-ID')} • 
                        Employee information was modified
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}