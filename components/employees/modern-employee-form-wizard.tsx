"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Briefcase, 
  DollarSign, 
  Shield, 
  FileText, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmployeeService } from '@/lib/services/employees'
import { MasterDataService } from '@/lib/services/master-data'
import type { Employee, EmployeeStatus } from '@/lib/types/database'
import type { Bank } from '@/lib/types/master-data'

const employeeService = new EmployeeService()
const masterDataService = new MasterDataService()

interface FormData {
  // Personal Information
  full_name: string
  nik: string
  npwp: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  place_of_birth: string
  gender: string
  marital_status: string
  
  // Employment Information
  employee_id: string
  department_id: string
  position_id: string
  employment_status: 'permanent' | 'contract'
  employee_status: EmployeeStatus
  join_date: string
  probation_end_date: string
  contract_end_date: string
  
  // Financial Information
  bank_id: string
  bank_account_number: string
  bank_account_holder: string
  ptkp_status: string
  
  // Benefits & Insurance
  bpjs_health_enrolled: boolean
  bpjs_health_number: string
  bpjs_manpower_enrolled: boolean
  bpjs_manpower_number: string
  insurance_number: string
  
  // Emergency Contact
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  
  // Additional Notes
  notes: string
}

interface ValidationErrors {
  [key: string]: string
}

interface ModernEmployeeFormWizardProps {
  onSuccess: (employee: Employee) => void
  onCancel: () => void
  initialData?: Partial<Employee>
  mode?: 'create' | 'edit'
}

const STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic personal details and contact information',
    icon: User,
    fields: ['full_name', 'nik', 'npwp', 'email', 'phone', 'address', 'date_of_birth', 'place_of_birth', 'gender', 'marital_status']
  },
  {
    id: 'employment',
    title: 'Employment Details',
    description: 'Job position, department, and employment terms',
    icon: Briefcase,
    fields: ['employee_id', 'department_id', 'position_id', 'employment_status', 'employee_status', 'join_date', 'probation_end_date', 'contract_end_date']
  },
  {
    id: 'financial',
    title: 'Financial Information',
    description: 'Banking details and tax configuration',
    icon: DollarSign,
    fields: ['bank_id', 'bank_account_number', 'bank_account_holder', 'ptkp_status']
  },
  {
    id: 'benefits',
    title: 'Benefits & Insurance',
    description: 'BPJS enrollment and insurance information',
    icon: Shield,
    fields: ['bpjs_health_enrolled', 'bpjs_health_number', 'bpjs_manpower_enrolled', 'bpjs_manpower_number', 'insurance_number']
  },
  {
    id: 'additional',
    title: 'Additional Information',
    description: 'Emergency contact and additional notes',
    icon: FileText,
    fields: ['emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone', 'notes']
  }
]

const INITIAL_FORM_DATA: FormData = {
  full_name: '',
  nik: '',
  npwp: '',
  email: '',
  phone: '',
  address: '',
  date_of_birth: '',
  place_of_birth: '',
  gender: '',
  marital_status: '',
  employee_id: '',
  department_id: '',
  position_id: '',
  employment_status: 'permanent',
  employee_status: 'active',
  join_date: '',
  probation_end_date: '',
  contract_end_date: '',
  bank_id: '',
  bank_account_number: '',
  bank_account_holder: '',
  ptkp_status: '',
  bpjs_health_enrolled: false,
  bpjs_health_number: '',
  bpjs_manpower_enrolled: false,
  bpjs_manpower_number: '',
  insurance_number: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_phone: '',
  notes: ''
}

export function ModernEmployeeFormWizard({ 
  onSuccess, 
  onCancel, 
  initialData, 
  mode = 'create' 
}: ModernEmployeeFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Array<{id: string, name: string, code: string}>>([])
  const [positions, setPositions] = useState<Array<{id: string, title: string, code: string}>>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadDepartments()
    loadPositions()
    loadBanks()
    if (initialData) {
      const processedData = { ...INITIAL_FORM_DATA }
      
      // Handle direct field mapping
      Object.keys(processedData).forEach(key => {
        const fieldKey = key as keyof FormData
        if (fieldKey in initialData && initialData[fieldKey as keyof typeof initialData] !== null) {
          // Special handling for foreign key relationships
          if (fieldKey === 'department_id') {
            processedData[fieldKey] = (initialData as any).department_id || (initialData as any).department?.id || ''
          } else if (fieldKey === 'position_id') {
            processedData[fieldKey] = (initialData as any).position_id || (initialData as any).position?.id || ''
          } else if (fieldKey === 'bank_id') {
            processedData[fieldKey] = (initialData as any).bank_id || (initialData as any).bank?.id || ''
          } else {
            const value = initialData[fieldKey as keyof typeof initialData]
            ;(processedData as any)[fieldKey] = value
          }
        }
      })
      
      setFormData(processedData)
      
      // Load positions for the selected department
      if (processedData.department_id) {
        loadPositions(processedData.department_id)
      }
    }
  }, [initialData])

  const loadDepartments = async () => {
    try {
      const depts = await employeeService.getDepartments()
      setDepartments(depts)
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const loadPositions = async (departmentId?: string) => {
    try {
      const positions = await employeeService.getPositions(departmentId)
      setPositions(positions)
    } catch (error) {
      console.error('Error loading positions:', error)
    }
  }

  const loadBanks = async () => {
    try {
      const banksData = await masterDataService.getActiveBanks()
      setBanks(banksData)
    } catch (error) {
      console.error('Error loading banks:', error)
    }
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Reload positions when department changes
    if (field === 'department_id' && value) {
      loadPositions(value)
      // Clear position selection when department changes
      setFormData(prev => ({ ...prev, position_id: '' }))
    }
  }

  const validateStep = (stepIndex: number): boolean => {
    const step = STEPS[stepIndex]
    const stepErrors: ValidationErrors = {}
    
    step.fields.forEach(field => {
      const value = formData[field as keyof FormData]
      
      // Required field validation
      if (field === 'full_name' && !value) {
        stepErrors[field] = 'Full name is required'
      } else if (field === 'nik' && !value) {
        stepErrors[field] = 'NIK is required'
      } else if (field === 'employee_id' && !value) {
        stepErrors[field] = 'Employee ID is required'
      } else if (field === 'department_id' && !value) {
        stepErrors[field] = 'Department is required'
      } else if (field === 'position_id' && !value) {
        stepErrors[field] = 'Position is required'
      } else if (field === 'join_date' && !value) {
        stepErrors[field] = 'Join date is required'
      } else if (field === 'bank_id' && !value) {
        stepErrors[field] = 'Bank is required'
      } else if (field === 'bank_account_number' && !value) {
        stepErrors[field] = 'Bank account number is required'
      } else if (field === 'ptkp_status' && !value) {
        stepErrors[field] = 'PTKP status is required'
      }
      
      // Format validation
      if (field === 'nik' && value && typeof value === 'string' && value.length !== 16) {
        stepErrors[field] = 'NIK must be 16 digits'
      } else if (field === 'npwp' && value && typeof value === 'string' && value.length !== 15) {
        stepErrors[field] = 'NPWP must be 15 digits'
      } else if (field === 'email' && value && typeof value === 'string' && !value.includes('@')) {
        stepErrors[field] = 'Invalid email format'
      }
    })

    setErrors(stepErrors)
    
    if (Object.keys(stepErrors).length === 0) {
      setCompletedSteps(prev => new Set([...prev, stepIndex]))
      return true
    }
    
    return false
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to previous steps or completed steps
    if (stepIndex < currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    try {
      setLoading(true)
      
      const employeeData = {
        ...formData,
        updated_at: new Date().toISOString()
      } as Omit<Employee, "id" | "created_at" | "updated_at">

      let result
      if (mode === 'edit' && initialData?.id) {
        result = await employeeService.updateEmployee(initialData.id, employeeData as Partial<Employee>)
      } else {
        result = await employeeService.createEmployee(employeeData)
      }

      onSuccess(result)
    } catch (error: any) {
      console.error('Error saving employee:', error)
      setErrors({ submit: error.message || 'Failed to save employee' })
    } finally {
      setLoading(false)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const renderPersonalStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm font-medium">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData('full_name', e.target.value)}
            placeholder="Enter full name"
            className={errors.full_name ? 'border-red-500' : ''}
          />
          {errors.full_name && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.full_name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nik" className="text-sm font-medium">
            NIK (National ID) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nik"
            value={formData.nik}
            onChange={(e) => updateFormData('nik', e.target.value)}
            placeholder="16-digit NIK"
            maxLength={16}
            className={errors.nik ? 'border-red-500' : ''}
          />
          {errors.nik && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.nik}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="email@example.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            placeholder="+62 xxx xxxx xxxx"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-medium">
          Address
        </Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="Full address including postal code"
          rows={3}
        />
      </div>
    </div>
  )

  const renderEmploymentStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="employee_id" className="text-sm font-medium">
            Employee ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="employee_id"
            value={formData.employee_id}
            onChange={(e) => updateFormData('employee_id', e.target.value)}
            placeholder="EMP001"
            className={errors.employee_id ? 'border-red-500' : ''}
          />
          {errors.employee_id && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.employee_id}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department_id" className="text-sm font-medium">
            Department <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.department_id} onValueChange={(value) => updateFormData('department_id', value)}>
            <SelectTrigger className={errors.department_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department_id && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.department_id}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position_id" className="text-sm font-medium">
            Position <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.position_id} 
            onValueChange={(value) => updateFormData('position_id', value)}
            disabled={!formData.department_id}
          >
            <SelectTrigger className={errors.position_id ? 'border-red-500' : ''}>
              <SelectValue placeholder={formData.department_id ? "Select position" : "Select department first"} />
            </SelectTrigger>
            <SelectContent>
              {positions.map((pos) => (
                <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.position_id && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.position_id}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="join_date" className="text-sm font-medium">
            Join Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="join_date"
            type="date"
            value={formData.join_date}
            onChange={(e) => updateFormData('join_date', e.target.value)}
            className={errors.join_date ? 'border-red-500' : ''}
          />
          {errors.join_date && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.join_date}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderFinancialStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bank_id" className="text-sm font-medium">
            Bank Name <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.bank_id} onValueChange={(value) => updateFormData('bank_id', value)}>
            <SelectTrigger className={errors.bank_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.bank_name} ({bank.bank_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.bank_id && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.bank_id}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_account_number" className="text-sm font-medium">
            Account Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bank_account_number"
            value={formData.bank_account_number}
            onChange={(e) => updateFormData('bank_account_number', e.target.value)}
            placeholder="1234567890"
            className={errors.bank_account_number ? 'border-red-500' : ''}
          />
          {errors.bank_account_number && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.bank_account_number}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ptkp_status" className="text-sm font-medium">
            PTKP Status <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.ptkp_status} onValueChange={(value) => updateFormData('ptkp_status', value)}>
            <SelectTrigger className={errors.ptkp_status ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select PTKP status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TK/0">TK/0 - Single, No Dependents</SelectItem>
              <SelectItem value="TK/1">TK/1 - Single, 1 Dependent</SelectItem>
              <SelectItem value="K/0">K/0 - Married, No Dependents</SelectItem>
              <SelectItem value="K/1">K/1 - Married, 1 Dependent</SelectItem>
            </SelectContent>
          </Select>
          {errors.ptkp_status && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.ptkp_status}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderBenefitsStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">BPJS Health (Kesehatan)</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="bpjs_health_enrolled"
            checked={formData.bpjs_health_enrolled}
            onCheckedChange={(checked) => updateFormData('bpjs_health_enrolled', checked)}
          />
          <Label htmlFor="bpjs_health_enrolled">Enroll in BPJS Health</Label>
        </div>
        
        {formData.bpjs_health_enrolled && (
          <div className="space-y-2">
            <Label htmlFor="bpjs_health_number" className="text-sm font-medium">
              BPJS Health Number
            </Label>
            <Input
              id="bpjs_health_number"
              value={formData.bpjs_health_number}
              onChange={(e) => updateFormData('bpjs_health_number', e.target.value)}
              placeholder="BPJS Health number"
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">BPJS Manpower (Ketenagakerjaan)</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="bpjs_manpower_enrolled"
            checked={formData.bpjs_manpower_enrolled}
            onCheckedChange={(checked) => updateFormData('bpjs_manpower_enrolled', checked)}
          />
          <Label htmlFor="bpjs_manpower_enrolled">Enroll in BPJS Manpower</Label>
        </div>
        
        {formData.bpjs_manpower_enrolled && (
          <div className="space-y-2">
            <Label htmlFor="bpjs_manpower_number" className="text-sm font-medium">
              BPJS Manpower Number
            </Label>
            <Input
              id="bpjs_manpower_number"
              value={formData.bpjs_manpower_number}
              onChange={(e) => updateFormData('bpjs_manpower_number', e.target.value)}
              placeholder="BPJS Manpower number"
            />
          </div>
        )}
      </div>
    </div>
  )

  const renderAdditionalStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name" className="text-sm font-medium">
              Contact Name
            </Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => updateFormData('emergency_contact_name', e.target.value)}
              placeholder="Emergency contact name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone" className="text-sm font-medium">
              Contact Phone
            </Label>
            <Input
              id="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={(e) => updateFormData('emergency_contact_phone', e.target.value)}
              placeholder="+62 xxx xxxx xxxx"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Additional Notes
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateFormData('notes', e.target.value)}
          placeholder="Any additional information about the employee"
          rows={4}
        />
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalStep()
      case 1: return renderEmploymentStep()
      case 2: return renderFinancialStep()
      case 3: return renderBenefitsStep()
      case 4: return renderAdditionalStep()
      default: return null
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Progress Header */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-xl md:text-2xl font-bold">
            {mode === 'edit' ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <Badge variant="outline" className="text-xs md:text-sm">
            Step {currentStep + 1} of {STEPS.length}
          </Badge>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {/* Step Navigation */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = completedSteps.has(index)
            const isAccessible = index <= currentStep || isCompleted
            
            return (
              <div key={step.id} className="flex flex-col items-center space-y-1 md:space-y-2 flex-shrink-0 min-w-16">
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={!isAccessible}
                  className={cn(
                    "w-8 h-8 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all",
                    isActive && "bg-blue-600 border-blue-600 text-white",
                    isCompleted && !isActive && "bg-green-600 border-green-600 text-white",
                    !isActive && !isCompleted && "border-gray-300 text-gray-400",
                    isAccessible && "hover:scale-105 cursor-pointer",
                    !isAccessible && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle className="h-3 w-3 md:h-5 md:w-5" />
                  ) : (
                    React.createElement(Icon, { className: "h-3 w-3 md:h-5 md:w-5" })
                  )}
                </button>
                <div className="text-center max-w-16 md:max-w-20">
                  <p className={cn(
                    "text-xs font-medium leading-tight",
                    isActive && "text-blue-600",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-gray-500"
                  )}>
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {React.createElement(STEPS[currentStep].icon, { className: "h-6 w-6" })}
            {STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>
            {STEPS[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
          
          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          className="gap-2 text-sm"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        
        <div className="flex items-center gap-3">
          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 text-sm w-full sm:w-auto"
              size="sm"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">
                    {mode === 'edit' ? 'Update Employee' : 'Create Employee'}
                  </span>
                  <span className="sm:hidden">
                    {mode === 'edit' ? 'Update' : 'Create'}
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2 text-sm w-full sm:w-auto" size="sm">
              Next
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}