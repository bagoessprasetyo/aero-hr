"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ProfessionalCard, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton,
  StatusBadge
} from "@/components/ui/professional"
import {
  Bookmark,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  Calendar,
  Copy,
  Settings,
  Star,
  StarOff
} from "lucide-react"
import type { 
  BulkOperationType,
  AdjustmentType
} from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface BulkOperationTemplate {
  id: string
  template_name: string
  template_description?: string
  operation_type: BulkOperationType
  adjustment_type: AdjustmentType
  adjustment_value?: number
  department_filter?: string
  position_filter?: string
  salary_range_min?: number
  salary_range_max?: number
  default_reason?: string
  is_favorite: boolean
  usage_count: number
  created_by: string
  created_at: string
  updated_at: string
}

interface BulkOperationTemplatesProps {
  className?: string
  onTemplateApply?: (template: BulkOperationTemplate) => void
}

export function BulkOperationTemplates({ className, onTemplateApply }: BulkOperationTemplatesProps) {
  const [templates, setTemplates] = useState<BulkOperationTemplate[]>([])
  const [editingTemplate, setEditingTemplate] = useState<BulkOperationTemplate | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<BulkOperationTemplate>>({
    template_name: '',
    template_description: '',
    operation_type: 'mass_increase',
    adjustment_type: 'percentage',
    adjustment_value: 0,
    default_reason: '',
    is_favorite: false
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      // Simulate loading templates - in real implementation, would call API
      const mockTemplates: BulkOperationTemplate[] = [
        {
          id: '1',
          template_name: 'Annual Salary Review 2024',
          template_description: 'Standard annual performance-based salary increase',
          operation_type: 'annual_review',
          adjustment_type: 'percentage',
          adjustment_value: 10,
          default_reason: 'Annual performance review and market adjustment',
          is_favorite: true,
          usage_count: 15,
          created_by: 'HR Admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          template_name: 'Cost of Living Adjustment',
          template_description: 'Quarterly cost of living adjustment based on inflation',
          operation_type: 'cost_of_living',
          adjustment_type: 'percentage',
          adjustment_value: 3.5,
          default_reason: 'Cost of living adjustment Q1 2024',
          is_favorite: false,
          usage_count: 8,
          created_by: 'HR Admin',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '3',
          template_name: 'IT Department Bonus',
          template_description: 'Special bonus for IT department project completion',
          operation_type: 'department_adjustment',
          adjustment_type: 'fixed_amount',
          adjustment_value: 2000000,
          department_filter: 'Information Technology',
          default_reason: 'Project completion bonus',
          is_favorite: false,
          usage_count: 3,
          created_by: 'IT Manager',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z'
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const newTemplate: BulkOperationTemplate = {
        ...formData as BulkOperationTemplate,
        id: Math.random().toString(36).substr(2, 9),
        usage_count: 0,
        created_by: 'Current User', // In real implementation, get from auth
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setTemplates(prev => [newTemplate, ...prev])
      setShowCreateForm(false)
      setFormData({
        template_name: '',
        template_description: '',
        operation_type: 'mass_increase',
        adjustment_type: 'percentage',
        adjustment_value: 0,
        default_reason: '',
        is_favorite: false
      })
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const handleEditTemplate = async (template: BulkOperationTemplate) => {
    try {
      const updatedTemplates = templates.map(t => 
        t.id === template.id 
          ? { ...template, updated_at: new Date().toISOString() }
          : t
      )
      setTemplates(updatedTemplates)
      setEditingTemplate(null)
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const updatedTemplates = templates.map(t => 
        t.id === templateId 
          ? { ...t, is_favorite: !t.is_favorite, updated_at: new Date().toISOString() }
          : t
      )
      setTemplates(updatedTemplates)
    } catch (error) {
      console.error('Error updating favorite status:', error)
    }
  }

  const handleApplyTemplate = (template: BulkOperationTemplate) => {
    // Update usage count
    const updatedTemplates = templates.map(t => 
      t.id === template.id 
        ? { ...t, usage_count: t.usage_count + 1, updated_at: new Date().toISOString() }
        : t
    )
    setTemplates(updatedTemplates)
    
    // Call parent callback
    onTemplateApply?.(template)
  }

  const duplicateTemplate = (template: BulkOperationTemplate) => {
    const duplicated: BulkOperationTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      template_name: `${template.template_name} (Copy)`,
      usage_count: 0,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setTemplates(prev => [duplicated, ...prev])
  }

  const favoriteTemplates = templates.filter(t => t.is_favorite)
  const recentTemplates = templates.filter(t => !t.is_favorite).slice(0, 5)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bookmark className="h-5 w-5" />
              <span>Operation Templates</span>
            </div>
            <ActionButton
              variant="primary"
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </ActionButton>
          </CardTitle>
          <CardDescription>
            Save and reuse common bulk operation configurations
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {/* Create Template Form */}
      {showCreateForm && (
        <ProfessionalCard>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={formData.template_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="e.g., Annual Review 2024"
                />
              </div>
              <div>
                <Label htmlFor="operation-type">Operation Type</Label>
                <Select 
                  value={formData.operation_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, operation_type: value as BulkOperationType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual_review">Annual Review</SelectItem>
                    <SelectItem value="mass_increase">Mass Increase</SelectItem>
                    <SelectItem value="department_adjustment">Department Adjustment</SelectItem>
                    <SelectItem value="promotion_batch">Promotion Batch</SelectItem>
                    <SelectItem value="cost_of_living">Cost of Living</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={formData.template_description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, template_description: e.target.value }))}
                placeholder="Describe when and how this template should be used..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adjustment-type">Adjustment Type</Label>
                <Select 
                  value={formData.adjustment_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, adjustment_type: value as AdjustmentType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Increase</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="new_structure">New Salary Structure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="adjustment-value">
                  {formData.adjustment_type === 'percentage' ? 'Percentage (%)' : 'Amount (IDR)'}
                </Label>
                <Input
                  id="adjustment-value"
                  type="number"
                  value={formData.adjustment_value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustment_value: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.adjustment_type === 'percentage' ? '10' : '1000000'}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="default-reason">Default Reason</Label>
              <Input
                id="default-reason"
                value={formData.default_reason || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, default_reason: e.target.value }))}
                placeholder="Default reason for this type of adjustment"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <ActionButton
                variant="primary"
                onClick={handleCreateTemplate}
                disabled={!formData.template_name}
              >
                Create Template
              </ActionButton>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      {/* Favorite Templates */}
      {favoriteTemplates.length > 0 && (
        <ProfessionalCard>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Favorite Templates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {favoriteTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onApply={handleApplyTemplate}
                  onEdit={setEditingTemplate}
                  onDelete={handleDeleteTemplate}
                  onToggleFavorite={handleToggleFavorite}
                  onDuplicate={duplicateTemplate}
                />
              ))}
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      {/* All Templates */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>All Templates ({templates.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <LoadingSkeleton key={i} className="h-24" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No templates found"
              description="Create your first operation template to get started"
            />
          ) : (
            <div className="grid gap-3">
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onApply={handleApplyTemplate}
                  onEdit={setEditingTemplate}
                  onDelete={handleDeleteTemplate}
                  onToggleFavorite={handleToggleFavorite}
                  onDuplicate={duplicateTemplate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </ProfessionalCard>
    </div>
  )
}

interface TemplateCardProps {
  template: BulkOperationTemplate
  onApply: (template: BulkOperationTemplate) => void
  onEdit: (template: BulkOperationTemplate) => void
  onDelete: (templateId: string) => void
  onToggleFavorite: (templateId: string) => void
  onDuplicate: (template: BulkOperationTemplate) => void
}

function TemplateCard({ 
  template, 
  onApply, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onDuplicate 
}: TemplateCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-900">{template.template_name}</h3>
            {template.is_favorite && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>
          {template.template_description && (
            <p className="text-sm text-gray-600 mb-2">{template.template_description}</p>
          )}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span>Used {template.usage_count} times</span>
            <span>•</span>
            <span>Created {new Date(template.created_at).toLocaleDateString('id-ID')}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(template.id)}
          >
            {template.is_favorite ? (
              <StarOff className="h-4 w-4" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(template)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(template)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {template.operation_type.replace('_', ' ')}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {template.adjustment_type === 'percentage' 
              ? `${template.adjustment_value}%` 
              : `IDR ${template.adjustment_value?.toLocaleString('id-ID')}`
            }
          </Badge>
          {template.department_filter && (
            <Badge variant="outline" className="text-xs">
              {template.department_filter}
            </Badge>
          )}
        </div>
        <ActionButton
          variant="primary"
          size="sm"
          onClick={() => onApply(template)}
        >
          Apply Template
        </ActionButton>
      </div>
    </div>
  )
}