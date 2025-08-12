"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Briefcase, CreditCard, Shield, Save } from "lucide-react"
import { 
  employeeFormSchema, 
  formatNIK, 
  formatNPWP, 
  formatPhone, 
  formatEmployeeId,
  commonDepartments,
  commonPositions,
  indonesianBanks
} from "@/lib/utils/validation"
import { EmployeeService } from "@/lib/services/employees"
import type { z } from "zod"

type EmployeeFormData = z.infer<typeof employeeFormSchema>

interface EditEmployeeFormProps {
  employeeId: string
}

const employeeService = new EmployeeService()

export function EditEmployeeForm({ employeeId }: EditEmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submitError, setSubmitError] = useState("")
  const router = useRouter()

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employee_status: "active",
      employment_status: "permanent",
      ptkp_status: "TK/0",
      bpjs_health_enrolled: false,
      bpjs_manpower_enrolled: false,
    },
  })

  useEffect(() => {
    loadEmployeeData()
  }, [employeeId])

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true)
      const employee = await employeeService.getEmployeeById(employeeId)
      
      if (!employee) {
        setSubmitError("Employee not found")
        return
      }

      // Reset form with employee data
      form.reset({
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        nik: employee.nik,
        npwp: employee.npwp || "",
        address: employee.address || "",
        phone: employee.phone || "",
        email: employee.email || "",
        position_title: employee.position_title,
        department: employee.department,
        join_date: employee.join_date,
        employment_status: employee.employment_status,
        employee_status: employee.employee_status,
        bank_name: employee.bank_name,
        bank_account_number: employee.bank_account_number,
        ptkp_status: employee.ptkp_status,
        bpjs_health_enrolled: employee.bpjs_health_enrolled,
        bpjs_manpower_enrolled: employee.bpjs_manpower_enrolled,
      })
    } catch (error: any) {
      setSubmitError(error.message || "Failed to load employee data")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError("")

      // Check for unique constraints (excluding current employee)
      const isEmployeeIdUnique = await employeeService.validateEmployeeId(data.employee_id, employeeId)
      if (!isEmployeeIdUnique) {
        form.setError("employee_id", { message: "Employee ID already exists" })
        return
      }

      const isNIKUnique = await employeeService.validateNIK(data.nik, employeeId)
      if (!isNIKUnique) {
        form.setError("nik", { message: "NIK already exists" })
        return
      }

      // Update employee
      await employeeService.updateEmployee(employeeId, data)
      
      // Redirect to employee detail page
      router.push(`/employees/${employeeId}`)
      
    } catch (error: any) {
      setSubmitError(error.message || "Failed to update employee")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/employees/${employeeId}`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading employee data...</p>
        </CardContent>
      </Card>
    )
  }

  if (submitError && !form.formState.isValid) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{submitError}</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancel}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Employee</h1>
            <p className="text-muted-foreground">
              Update employee information and settings
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[80vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Basic personal details and identification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="EMP001" 
                            {...field}
                            onChange={(e) => field.onChange(formatEmployeeId(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Unique identifier (uppercase letters and numbers only)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIK (National ID) *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="1234567890123456" 
                            {...field}
                            onChange={(e) => field.onChange(formatNIK(e.target.value))}
                            maxLength={16}
                          />
                        </FormControl>
                        <FormDescription>
                          16-digit Indonesian National ID number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="npwp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NPWP (Tax ID)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="01.234.567.8-901.234" 
                            {...field}
                            onChange={(e) => field.onChange(formatNPWP(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          15-digit Indonesian Tax ID (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@company.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0812-3456-7890" 
                            {...field}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter full address..." 
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Employment Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Employment Information</span>
                </CardTitle>
                <CardDescription>
                  Job details and employment status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <FormControl>
                          <Input placeholder="IT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="join_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Join Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="employment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="permanent">Permanent</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="employee_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="resigned">Resigned</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Financial Information</span>
                </CardTitle>
                <CardDescription>
                  Bank details and tax configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="BCA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bank_account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="1234567890" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ptkp_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PTKP Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select PTKP status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TK/0">TK/0 - Single, no dependents</SelectItem>
                          <SelectItem value="TK/1">TK/1 - Single, 1 dependent</SelectItem>
                          <SelectItem value="TK/2">TK/2 - Single, 2 dependents</SelectItem>
                          <SelectItem value="TK/3">TK/3 - Single, 3 dependents</SelectItem>
                          <SelectItem value="K/0">K/0 - Married, no dependents</SelectItem>
                          <SelectItem value="K/1">K/1 - Married, 1 dependent</SelectItem>
                          <SelectItem value="K/2">K/2 - Married, 2 dependents</SelectItem>
                          <SelectItem value="K/3">K/3 - Married, 3 dependents</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tax status affects PPh 21 calculations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* BPJS Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>BPJS Enrollment</span>
                </CardTitle>
                <CardDescription>
                  Social security enrollment status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bpjs_health_enrolled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            BPJS Health (Kesehatan)
                          </FormLabel>
                          <FormDescription>
                            Employee contribution: 1%, Company: 4%
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bpjs_manpower_enrolled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            BPJS Manpower (Ketenagakerjaan)
                          </FormLabel>
                          <FormDescription>
                            Includes JHT, JP, JKK, JKM programs
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{submitError}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}