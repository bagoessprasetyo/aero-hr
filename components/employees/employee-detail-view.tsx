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
  Trash2,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  Copy,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Building
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
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Back Button & Breadcrumb */}
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/employees')}
              className="shrink-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              <span>Employees</span> / <span className="text-gray-900 font-medium">{employee.full_name}</span>
            </div>
          </div>
          
          {/* Profile Section */}
          <div className="flex items-center gap-6 flex-1">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">
                {employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            
            {/* Employee Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{employee.full_name}</h1>
                <div className="flex items-center gap-2">
                  {getStatusBadge(employee.employee_status)}
                  {getEmploymentTypeBadge(employee.employment_status)}
                </div>
              </div>
              <p className="text-lg text-gray-600 mb-2">
                {employee.position?.position_title || 'N/A'} • {employee.department?.department_name || 'N/A'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(employee.join_date).toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>ID: {employee.employee_id}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()}
            >
              <FileText className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button 
              onClick={() => router.push(`/employees/${employeeId}/edit`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Employee
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm">
          <TabsList className="w-full bg-transparent p-1 h-auto grid grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-lg transition-all"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="salary" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-lg transition-all"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Salary</span>
            </TabsTrigger>
            <TabsTrigger 
              value="salary-history" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-lg transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger 
              value="salary-comparison" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-lg transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calculations" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-lg transition-all"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Tax & BPJS</span>
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-lg transition-all"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Tenure</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {Math.floor((new Date().getTime() - new Date(employee.join_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Status</p>
                    <p className="text-2xl font-bold text-green-900 capitalize">{employee.employee_status}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Type</p>
                    <p className="text-2xl font-bold text-purple-900 capitalize">{employee.employment_status}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">BPJS</p>
                    <p className="text-xl font-bold text-orange-900">
                      {(employee.bpjs_health_enrolled ? 1 : 0) + (employee.bpjs_manpower_enrolled ? 1 : 0)}/2
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Information */}
            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <User className="h-6 w-6 text-blue-600" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Employee ID</p>
                      <p className="font-mono text-lg font-semibold">{employee.employee_id}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigator.clipboard?.writeText(employee.employee_id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-500">National ID (NIK)</p>
                      <p className="font-mono text-lg font-semibold">{employee.nik}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigator.clipboard?.writeText(employee.nik)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {employee.npwp && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tax ID (NPWP)</p>
                        <p className="font-mono text-lg font-semibold">{formatNPWP(employee.npwp)}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigator.clipboard?.writeText(employee.npwp || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {(employee.email || employee.phone) && (
                  <div className="space-y-3">
                    {employee.email && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600">Email Address</p>
                          <p className="text-blue-900">{employee.email}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`mailto:${employee.email}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {employee.phone && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Phone className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-600">Phone Number</p>
                          <p className="text-green-900">{employee.phone}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`tel:${employee.phone}`)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {employee.address && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <p className="text-gray-900">{employee.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Briefcase className="h-6 w-6 text-green-600" />
                  <span>Employment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Position</p>
                        <p className="font-semibold text-lg text-gray-900">{employee.position?.position_title || 'N/A'}</p>
                        {employee.position?.position_code && (
                          <p className="text-sm text-gray-500">Code: {employee.position.position_code}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p className="font-semibold text-lg text-gray-900">{employee.department?.department_name || 'N/A'}</p>
                        {employee.department?.department_code && (
                          <p className="text-sm text-gray-500">Code: {employee.department.department_code}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-600">Join Date</p>
                      <p className="font-bold text-blue-900">
                        {new Date(employee.join_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="text-center">
                      <FileText className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-600">Employment Type</p>
                      <p className="font-bold text-purple-900 capitalize">{employee.employment_status}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="text-center">
                      <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-600">Current Status</p>
                      <div className="mt-2">
                        {getStatusBadge(employee.employee_status)}
                      </div>
                    </div>
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
                    <p>{employee.bank?.bank_name || employee.bank_name || 'Not provided'}</p>
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

        <TabsContent value="timeline" className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Clock className="h-6 w-6 text-indigo-600" />
                <span>Employee Timeline</span>
              </CardTitle>
              <CardDescription>
                Complete activity history and key milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-green-500 to-gray-300"></div>
                
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="relative flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg relative z-10">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-green-800">Current Status</h3>
                        <span className="text-xs text-gray-500">Now</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {employee.employee_status === 'active' ? 'Currently active employee' : 
                         employee.employee_status === 'resigned' ? 'Employee has resigned' : 
                         'Employment terminated'} • 
                        {employee.employment_status === 'permanent' ? 'Permanent position' : 'Contract position'}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(employee.employee_status)}
                      </div>
                    </div>
                  </div>

                  {/* Last Profile Update */}
                  {employee.updated_at !== employee.created_at && (
                    <div className="relative flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg relative z-10">
                        <Edit className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-yellow-800">Profile Updated</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(employee.updated_at).toLocaleDateString('id-ID', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Employee information was last modified
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(employee.updated_at).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Employment Start */}
                  <div className="relative flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg relative z-10">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-blue-800">Employment Started</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(employee.join_date).toLocaleDateString('id-ID', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Joined as <span className="font-medium">{employee.position?.position_title || 'N/A'}</span> in 
                        <span className="font-medium"> {employee.department?.department_name || 'N/A'}</span> department
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                          <span className="text-xs text-gray-600">
                            Tenure: {Math.floor((new Date().getTime() - new Date(employee.join_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile Created */}
                  <div className="relative flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg relative z-10">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-purple-800">Profile Created</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(employee.created_at).toLocaleDateString('id-ID', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Employee profile was created in the system
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500 font-mono">ID: {employee.employee_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}