"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ProfessionalCard, 
  StatsCard, 
  StatusBadge, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton
} from "@/components/ui/professional"
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { EmployeeService } from "@/lib/services/employees"
import { salaryComponentSchema, formatCurrency } from "@/lib/utils/validation"
import type { SalaryComponent, Employee } from "@/lib/types/database"
import type { z } from "zod"
import { cn } from "@/lib/utils"

type SalaryComponentFormData = z.infer<typeof salaryComponentSchema>

interface SalaryComponentManagerProps {
  employee: Employee
  onUpdate: () => void
}

const employeeService = new EmployeeService()

// Comprehensive Indonesian salary component templates
const SALARY_TEMPLATES = [
  // Basic Salary (required)
  { 
    name: "Basic Salary", 
    type: "basic_salary" as const, 
    suggested_amount: 5000000,
    description: "Primary monthly salary",
    category: "Essential",
    icon: "💰"
  },
  
  // Position & Performance Allowances
  { 
    name: "Position Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 1000000,
    description: "Based on job level and responsibility",
    category: "Position",
    icon: "📊"
  },
  { 
    name: "Performance Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 750000,
    description: "Performance-based monthly bonus",
    category: "Performance",
    icon: "🎯"
  },
  { 
    name: "Functional Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 800000,
    description: "Specific job function allowance",
    category: "Position",
    icon: "⚙️"
  },
  
  // Transportation & Mobility
  { 
    name: "Transport Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 500000,
    description: "Transportation or fuel allowance",
    category: "Transportation",
    icon: "🚗"
  },
  { 
    name: "Parking Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 200000,
    description: "Monthly parking fee reimbursement",
    category: "Transportation",
    icon: "🅿️"
  },
  
  // Daily Needs
  { 
    name: "Meal Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 750000,
    description: "Daily meal allowance",
    category: "Daily Needs",
    icon: "🍽️"
  },
  { 
    name: "Communication Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 300000,
    description: "Phone/internet allowance",
    category: "Daily Needs",
    icon: "📱"
  },
  
  // Accommodation & Living
  { 
    name: "Housing Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 2000000,
    description: "Housing or rent allowance",
    category: "Living",
    icon: "🏠"
  },
  { 
    name: "Family Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 500000,
    description: "Family support allowance",
    category: "Living",
    icon: "👨‍👩‍👧‍👦"
  },
  
  // Health & Wellness  
  { 
    name: "Health Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 500000,
    description: "Additional health coverage",
    category: "Health",
    icon: "🏥"
  },
  { 
    name: "Insurance Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 400000,
    description: "Life/health insurance premium",
    category: "Health",
    icon: "🛡️"
  },
  
  // Professional Development
  { 
    name: "Training Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 300000,
    description: "Professional development allowance",
    category: "Development",
    icon: "📚"
  },
  { 
    name: "Certification Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 250000,
    description: "Professional certification support",
    category: "Development",
    icon: "🏆"
  },
  
  // Special Allowances
  { 
    name: "Overtime Base", 
    type: "fixed_allowance" as const, 
    suggested_amount: 150000,
    description: "Base overtime allowance",
    category: "Special",
    icon: "⏰"
  },
  { 
    name: "Shift Allowance", 
    type: "fixed_allowance" as const, 
    suggested_amount: 400000,
    description: "Night/shift work allowance",
    category: "Special",
    icon: "🌙"
  }
]

// Template categories for better organization
const TEMPLATE_CATEGORIES = [
  { key: "Essential", label: "Essential Components", color: "bg-red-100 text-red-800" },
  { key: "Position", label: "Position & Role", color: "bg-blue-100 text-blue-800" },
  { key: "Transportation", label: "Transportation", color: "bg-green-100 text-green-800" },
  { key: "Daily Needs", label: "Daily Needs", color: "bg-yellow-100 text-yellow-800" },
  { key: "Living", label: "Housing & Family", color: "bg-purple-100 text-purple-800" },
  { key: "Health", label: "Health & Insurance", color: "bg-pink-100 text-pink-800" },
  { key: "Development", label: "Professional Development", color: "bg-indigo-100 text-indigo-800" },
  { key: "Performance", label: "Performance Based", color: "bg-orange-100 text-orange-800" },
  { key: "Special", label: "Special Circumstances", color: "bg-gray-100 text-gray-800" }
]

export function SalaryComponentManager({ employee, onUpdate }: SalaryComponentManagerProps) {
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SalaryComponentFormData>({
    resolver: zodResolver(salaryComponentSchema),
    defaultValues: {
      component_type: "fixed_allowance",
      is_active: true,
    },
  })

  useEffect(() => {
    loadSalaryComponents()
  }, [employee.id])

  const loadSalaryComponents = async () => {
    try {
      setLoading(true)
      const data = await employeeService.getSalaryComponents(employee.id)
      setComponents(data)
    } catch (error) {
      console.error('Error loading salary components:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComponent = async (data: SalaryComponentFormData) => {
    try {
      setIsSubmitting(true)
      await employeeService.addSalaryComponent({
        ...data,
        employee_id: employee.id,
      })
      await loadSalaryComponents()
      onUpdate()
      setIsAddDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error adding salary component:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComponent = async (data: SalaryComponentFormData) => {
    if (!editingComponent) return
    
    try {
      setIsSubmitting(true)
      await employeeService.updateSalaryComponent(editingComponent.id, data)
      await loadSalaryComponents()
      onUpdate()
      setEditingComponent(null)
      form.reset()
    } catch (error) {
      console.error('Error updating salary component:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComponent = async (componentId: string) => {
    try {
      await employeeService.deleteSalaryComponent(componentId)
      await loadSalaryComponents()
      onUpdate()
    } catch (error) {
      console.error('Error deleting salary component:', error)
    }
  }

  const startEdit = (component: SalaryComponent) => {
    setEditingComponent(component)
    form.reset({
      component_name: component.component_name,
      component_type: component.component_type,
      amount: component.amount,
      is_active: component.is_active,
    })
  }

  const useTemplate = (template: typeof SALARY_TEMPLATES[0]) => {
    form.setValue("component_name", template.name)
    form.setValue("component_type", template.type)
    if (template.suggested_amount > 0) {
      form.setValue("amount", template.suggested_amount)
    }
  }

  const onSubmit = (data: SalaryComponentFormData) => {
    if (editingComponent) {
      handleEditComponent(data)
    } else {
      handleAddComponent(data)
    }
  }

  const totalSalary = components
    .filter(comp => comp.is_active)
    .reduce((total, comp) => total + comp.amount, 0)

  const basicSalary = components
    .filter(comp => comp.component_type === 'basic_salary' && comp.is_active)
    .reduce((total, comp) => total + comp.amount, 0)

  const allowances = components
    .filter(comp => comp.component_type === 'fixed_allowance' && comp.is_active)
    .reduce((total, comp) => total + comp.amount, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Gross Salary"
          value={formatCurrency(totalSalary)}
          subtitle={`${components.filter(c => c.is_active).length} active components`}
          icon={DollarSign}
        />

        <StatsCard
          title="Basic Salary"
          value={formatCurrency(basicSalary)}
          subtitle={`${((basicSalary / totalSalary) * 100 || 0).toFixed(1)}% of total`}
          icon={TrendingUp}
        />

        <StatsCard
          title="Allowances"
          value={formatCurrency(allowances)}
          subtitle={`${((allowances / totalSalary) * 100 || 0).toFixed(1)}% of total`}
          icon={Plus}
        />
      </div>

      {/* Quick Add Templates */}
      {components.length === 0 && (
        <ProfessionalCard module="employee" className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Plus className="h-4 w-4" />
              <span>Quick Start Templates</span>
            </CardTitle>
            <CardDescription>
              Get started quickly with common salary components for {employee.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SALARY_TEMPLATES.filter(t => ['Essential', 'Position', 'Transportation', 'Daily Needs'].includes(t.category)).slice(0, 8).map((template) => (
                <ActionButton
                  key={template.name}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    form.setValue("component_name", template.name)
                    form.setValue("component_type", template.type)
                    form.setValue("amount", template.suggested_amount)
                    setIsAddDialogOpen(true)
                  }}
                  className="h-auto p-3 flex-col space-y-1"
                >
                  <span className="text-lg">{template.icon}</span>
                  <span className="text-xs font-medium">{template.name}</span>
                  <span className="text-xs text-gray-500">{formatCurrency(template.suggested_amount)}</span>
                </ActionButton>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <ActionButton
                variant="primary"
                onClick={() => setIsAddDialogOpen(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Browse All Templates
              </ActionButton>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      {/* Existing Components Quick Actions */}
      {components.length > 0 && (
        <ProfessionalCard variant="interactive" className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Quick Add:</span>
                </div>
                <div className="flex space-x-2">
                  {SALARY_TEMPLATES.filter(t => !components.some(c => c.component_name === t.name)).slice(0, 3).map((template) => (
                    <ActionButton
                      key={template.name}
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        form.setValue("component_name", template.name)
                        form.setValue("component_type", template.type)
                        form.setValue("amount", template.suggested_amount)
                        setIsAddDialogOpen(true)
                      }}
                      className="text-xs"
                    >
                      {template.icon} {template.name}
                    </ActionButton>
                  ))}
                </div>
              </div>
              <ActionButton
                variant="primary"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Component
              </ActionButton>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      {/* Main Content */}
      <ProfessionalCard module="salary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Salary Components</span>
              </CardTitle>
              <CardDescription>
                Manage basic salary and fixed allowances for {employee.full_name}
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <ActionButton variant="primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </ActionButton>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Salary Component</DialogTitle>
                  <DialogDescription>
                    Add a new salary component for this employee
                  </DialogDescription>
                </DialogHeader>
                <SalaryComponentForm
                  form={form}
                  onSubmit={onSubmit}
                  onCancel={() => {
                    setIsAddDialogOpen(false)
                    form.reset()
                  }}
                  onUseTemplate={useTemplate}
                  isSubmitting={isSubmitting}
                  mode="add"
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i} className="p-4" />
              ))}
            </div>
          ) : components.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No salary components configured"
              description="Start by adding a basic salary for this employee"
              action={{
                label: "Add Basic Salary",
                onClick: () => setIsAddDialogOpen(true)
              }}
            />
          ) : (
            <div className="space-y-3">
              {components.map((component) => (
                <div 
                  key={component.id}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border bg-white p-4",
                    "transition-all duration-200",
                    "hover:shadow-md hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        component.component_type === 'basic_salary' 
                          ? 'bg-salary-100 text-salary-600' 
                          : 'bg-employee-100 text-employee-600'
                      }`}>
                        {component.component_type === 'basic_salary' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{component.component_name}</h4>
                          <StatusBadge status={component.is_active ? "active" : "inactive"}>
                            {component.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-gray-500 capitalize">
                          {component.component_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(component.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {totalSalary > 0 && `${((component.amount / totalSalary) * 100).toFixed(1)}% of total`}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(component)}
                        >
                          <Edit className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton
                          variant="error"
                          size="sm"
                          onClick={() => handleDeleteComponent(component.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ProfessionalCard>

      {/* Edit Dialog */}
      <Dialog open={!!editingComponent} onOpenChange={() => setEditingComponent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Salary Component</DialogTitle>
            <DialogDescription>
              Modify the salary component details
            </DialogDescription>
          </DialogHeader>
          <SalaryComponentForm
            form={form}
            onSubmit={onSubmit}
            onCancel={() => {
              setEditingComponent(null)
              form.reset()
            }}
            onUseTemplate={useTemplate}
            isSubmitting={isSubmitting}
            mode="edit"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Separate form component for reusability
interface SalaryComponentFormProps {
  form: any
  onSubmit: (data: SalaryComponentFormData) => void
  onCancel: () => void
  onUseTemplate: (template: typeof SALARY_TEMPLATES[0]) => void
  isSubmitting: boolean
  mode: 'add' | 'edit'
}

function SalaryComponentForm({ 
  form, 
  onSubmit, 
  onCancel, 
  onUseTemplate, 
  isSubmitting, 
  mode 
}: SalaryComponentFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {mode === 'add' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-4 block">
                Salary Component Templates
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Choose from common Indonesian salary components or create a custom one
              </p>
              
              {/* Template Categories */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
                {TEMPLATE_CATEGORIES.map((category) => {
                  const categoryTemplates = SALARY_TEMPLATES.filter(t => t.category === category.key)
                  if (categoryTemplates.length === 0) return null
                  
                  return (
                    <div key={category.key}>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge className={category.color}>{category.label}</Badge>
                        <span className="text-xs text-gray-400">
                          {categoryTemplates.length} templates
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {categoryTemplates.map((template) => (
                          <Button
                            key={template.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onUseTemplate(template)}
                            className="h-auto p-3 text-left justify-start hover:bg-blue-50 hover:border-blue-300 transition-all"
                          >
                            <div className="flex items-start space-x-2 w-full">
                              <span className="text-base flex-shrink-0 mt-0.5">{template.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {template.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {template.description}
                                </div>
                                <div className="text-xs font-medium text-blue-600 mt-1">
                                  {formatCurrency(template.suggested_amount)}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <Separator className="my-6" />
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Template amounts are suggestions based on Indonesian market standards. 
                  Adjust amounts according to your company policy and employee level.
                </p>
              </div>
            </div>
            
            <div>
              <Separator className="md:hidden my-6" />
              
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="component_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Transport Allowance" {...field} />
                      </FormControl>
                      <FormDescription>
                        Descriptive name for this salary component
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="component_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic_salary">Basic Salary</SelectItem>
                          <SelectItem value="fixed_allowance">Fixed Allowance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Basic salary affects BPJS calculations differently
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Monthly Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="5000000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="pl-12"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          Rp
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Monthly amount in Indonesian Rupiah
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {mode === 'edit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="component_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Transport Allowance" {...field} />
                  </FormControl>
                  <FormDescription>
                    Descriptive name for this salary component
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="component_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic_salary">Basic Salary</SelectItem>
                      <SelectItem value="fixed_allowance">Fixed Allowance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Basic salary affects BPJS calculations differently
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Monthly Amount *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="5000000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="pl-12"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        Rp
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Monthly amount in Indonesian Rupiah
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Saving..." : mode === 'add' ? "Add Component" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}