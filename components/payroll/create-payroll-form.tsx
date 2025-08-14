"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, CheckCircle, Clock, Users, TrendingUp, ArrowRight, Copy } from "lucide-react"
import { PayrollService } from "@/lib/services/payroll"
import { 
  ProfessionalCard, 
  ActionButton, 
  StatusBadge,
  LoadingSkeleton
} from "@/components/ui/professional"

const payrollFormSchema = z.object({
  period_month: z.number().min(1).max(12),
  period_year: z.number().min(2020).max(2030),
  template_source: z.string().optional(),
})

type PayrollFormData = z.infer<typeof payrollFormSchema>

interface CreatePayrollFormProps {
  onSuccess: (payroll: any) => void
  onCancel: () => void
}

const payrollService = new PayrollService()

const months = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" }
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

export function CreatePayrollForm({ onSuccess, onCancel }: CreatePayrollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [existingPayrolls, setExistingPayrolls] = useState<any[]>([])
  const [conflictCheck, setConflictCheck] = useState<{ hasConflict: boolean; conflictPeriod?: string }>({ hasConflict: false })
  const [suggestedPeriod, setSuggestedPeriod] = useState<{ month: number; year: number } | null>(null)

  const form = useForm<PayrollFormData>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear(),
    },
  })

  useEffect(() => {
    loadExistingPayrolls()
  }, [])

  useEffect(() => {
    const month = form.watch("period_month")
    const year = form.watch("period_year")
    if (month && year) {
      checkConflicts(month, year)
    }
  }, [form.watch("period_month"), form.watch("period_year")])

  const loadExistingPayrolls = async () => {
    try {
      setLoading(true)
      const payrolls = await payrollService.getPayrollPeriods({ limit: 12 })
      setExistingPayrolls(payrolls)
      
      // Suggest next period based on existing payrolls
      if (payrolls.length > 0) {
        const latest = payrolls[0] // Should be sorted by latest first
        let nextMonth = latest.period_month + 1
        let nextYear = latest.period_year
        
        if (nextMonth > 12) {
          nextMonth = 1
          nextYear += 1
        }
        
        setSuggestedPeriod({ month: nextMonth, year: nextYear })
      }
    } catch (error) {
      console.error('Error loading existing payrolls:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkConflicts = (month: number, year: number) => {
    const conflict = existingPayrolls.find(p => p.period_month === month && p.period_year === year)
    if (conflict) {
      const monthName = months.find(m => m.value === month)?.label || month
      setConflictCheck({
        hasConflict: true,
        conflictPeriod: `${monthName} ${year} (${conflict.status})`
      })
    } else {
      setConflictCheck({ hasConflict: false })
    }
  }

  const applySuggestedPeriod = () => {
    if (suggestedPeriod) {
      form.setValue("period_month", suggestedPeriod.month)
      form.setValue("period_year", suggestedPeriod.year)
    }
  }

  const onSubmit = async (data: PayrollFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError("")

      const payroll = await payrollService.createPayrollPeriod(
        data.period_month,
        data.period_year
      )
      
      onSuccess(payroll)
      
    } catch (error: any) {
      setSubmitError(error.message || "Failed to create payroll period")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMonth = form.watch("period_month")
  const selectedYear = form.watch("period_year")
  const monthName = months.find(m => m.value === selectedMonth)?.label || ""
  const progress = step === 1 ? 50 : 100

  if (loading) {
    return <LoadingSkeleton className="h-96" />
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Wizard Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Calendar className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">Create New Payroll Period</h2>
        </div>
        <p className="text-gray-600">Set up a new monthly payroll with Indonesian compliance</p>
        
        {/* Progress Indicator */}
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {step} of 2</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 ? (
            /* Step 1: Period Selection */
            <div className="space-y-6">
              {/* Quick Suggestions */}
              {suggestedPeriod && (
                <ProfessionalCard variant="elevated" className="border-dashed border-blue-300 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-900">
                      <TrendingUp className="h-5 w-5" />
                      <span>Suggested Next Period</span>
                    </CardTitle>
                    <CardDescription>
                      Based on your existing payroll history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {months.find(m => m.value === suggestedPeriod.month)?.label} {suggestedPeriod.year}
                          </h3>
                          <p className="text-sm text-gray-600">Next sequential period</p>
                        </div>
                      </div>
                      <ActionButton variant="primary" onClick={applySuggestedPeriod}>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Use This Period
                      </ActionButton>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              )}

              {/* Period Selection Form */}
              <ProfessionalCard >
                <CardHeader>
                  <CardTitle>Select Payroll Period</CardTitle>
                  <CardDescription>
                    Choose the month and year for this payroll calculation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="period_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  <div className="flex items-center space-x-3">
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                      {month.short}
                                    </span>
                                    <span>{month.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="period_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{year}</span>
                                    {year === currentYear && (
                                      <Badge variant="outline" className="ml-2">Current</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Period Preview & Validation */}
                  {selectedMonth && selectedYear && (
                    <div className="mt-6 space-y-4">
                      {/* Preview */}
                      <div className="bg-gradient-to-r from-payroll-50 to-blue-50 border border-payroll-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-600 text-white rounded-lg">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-payroll-900">
                                Payroll Period: {monthName} {selectedYear}
                              </h4>
                              <p className="text-sm text-payroll-700">
                                This period will be created in draft status
                              </p>
                            </div>
                          </div>
                          <StatusBadge status="inactive">
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </StatusBadge>
                        </div>
                      </div>

                      {/* Conflict Check */}
                      {conflictCheck.hasConflict && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-red-900">Period Already Exists</h4>
                              <p className="text-sm text-red-700 mt-1">
                                A payroll period for {conflictCheck.conflictPeriod} already exists. 
                                Please choose a different period.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </ProfessionalCard>

              {/* Recent Payroll History */}
              {existingPayrolls.length > 0 && (
                <ProfessionalCard>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Recent Payroll Periods</span>
                    </CardTitle>
                    <CardDescription>
                      Your last {Math.min(existingPayrolls.length, 6)} payroll periods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {existingPayrolls.slice(0, 6).map((payroll) => (
                        <div 
                          key={payroll.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {months.find(m => m.value === payroll.period_month)?.short} {payroll.period_year}
                              </p>
                              <p className="text-xs text-gray-600">
                                {payroll.total_employees || 0} employees
                              </p>
                            </div>
                            <StatusBadge 
                              status={payroll.status === 'finalized' ? 'success' : 
                                     payroll.status === 'calculated' ? 'warning' : 'inactive'}
                            >
                              {payroll.status === 'finalized' ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                            </StatusBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </ProfessionalCard>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <ActionButton variant="secondary" onClick={onCancel}>
                  Cancel
                </ActionButton>
                <ActionButton 
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!selectedMonth || !selectedYear || conflictCheck.hasConflict}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          ) : (
            /* Step 2: Confirmation & Creation */
            <div className="space-y-6">
              {/* Confirmation Summary */}
              <ProfessionalCard  variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Confirm Payroll Creation</span>
                  </CardTitle>
                  <CardDescription>
                    Review the details before creating your payroll period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-white rounded-xl shadow-sm inline-block">
                        <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-gray-900">
                          {monthName} {selectedYear}
                        </h3>
                        <p className="text-sm text-gray-600">Payroll Period</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Status</h4>
                      <p className="text-sm text-gray-600">Draft (Editable)</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Employees</h4>
                      <p className="text-sm text-gray-600">All active employees</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Next Steps</h4>
                      <p className="text-sm text-gray-600">Add variables & calculate</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">What happens next?</h4>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                          <li>• Payroll period created in draft status</li>
                          <li>• Add variable components (bonus, overtime)</li>
                          <li>• Run automatic BPJS and PPh 21 calculations</li>
                          <li>• Review and finalize when ready</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </ProfessionalCard>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-red-700 text-sm">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Final Actions */}
              <div className="flex justify-between">
                <ActionButton variant="secondary" onClick={() => setStep(1)}>
                  Back to Period Selection
                </ActionButton>
                <ActionButton 
                  variant="primary"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Payroll...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Create Payroll Period
                    </>
                  )}
                </ActionButton>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}