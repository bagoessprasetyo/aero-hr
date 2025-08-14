"use client"

import { useState, useEffect, useMemo } from 'react'
import { MasterDataService } from '@/lib/services/master-data'
import type { Position, Department, CreatePositionRequest, UpdatePositionRequest } from '@/lib/types/master-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { Progress } from '@/components/ui/progress'
import {
  ProfessionalCard,
  ActionButton,
  EmptyState,
  StatusBadge
} from '@/components/ui/professional'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Briefcase,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  DollarSign,
  TrendingUp,
  Building2,
  Filter,
  Download,
  Upload,
  RefreshCw,
  CheckSquare,
  Square,
  X,
  ArrowUpDown,
  ChevronDown,
  Settings,
  BarChart3,
  Users
} from 'lucide-react'

const masterDataService = new MasterDataService()

interface PositionWithRelations extends Position {
  department?: Department
}

export function PositionManagement() {
  const { toast } = useToast()
  const [positions, setPositions] = useState<PositionWithRelations[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Enhanced filtering states
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [salaryRangeFilter, setSalaryRangeFilter] = useState<{ min: string; max: string }>({ min: '', max: '' })
  
  // Modal states
  const [selectedPosition, setSelectedPosition] = useState<PositionWithRelations | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  
  // Bulk operation states
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Sort state
  const [sortBy, setSortBy] = useState<'title' | 'department' | 'level' | 'salary'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Form states
  const [formData, setFormData] = useState<CreatePositionRequest>({
    position_code: '',
    position_title: '',
    position_description: '',
    department_id: '',
    position_level: 1,
    min_salary: 0,
    max_salary: 0,
    required_skills: [],
    is_active: true,
    display_order: 0
  })

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      const [positionsResponse, departmentsResponse] = await Promise.all([
        masterDataService.getPositions(),
        masterDataService.getDepartments({ is_active: true })
      ])
      setPositions(positionsResponse.data as PositionWithRelations[])
      setDepartments(departmentsResponse.data)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({ type: 'error', title: 'Failed to load positions' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Enhanced filtering and sorting with useMemo for performance
  const filteredAndSortedPositions = useMemo(() => {
    let filtered = [...positions]

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(pos =>
        pos.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.position_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.position_description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(pos => pos.department_id === departmentFilter)
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(pos => pos.is_active === (activeFilter === 'active'))
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(pos => pos.position_level === parseInt(levelFilter))
    }

    if (salaryRangeFilter.min || salaryRangeFilter.max) {
      filtered = filtered.filter(pos => {
        const minSalary = pos.min_salary || 0
        const maxSalary = pos.max_salary || 0
        const filterMin = salaryRangeFilter.min ? parseInt(salaryRangeFilter.min) : 0
        const filterMax = salaryRangeFilter.max ? parseInt(salaryRangeFilter.max) : Infinity
        
        return (minSalary >= filterMin && minSalary <= filterMax) ||
               (maxSalary >= filterMin && maxSalary <= filterMax)
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'title':
          aValue = a.position_title.toLowerCase()
          bValue = b.position_title.toLowerCase()
          break
        case 'department':
          aValue = a.department?.department_name?.toLowerCase() || ''
          bValue = b.department?.department_name?.toLowerCase() || ''
          break
        case 'level':
          aValue = a.position_level
          bValue = b.position_level
          break
        case 'salary':
          aValue = a.min_salary || 0
          bValue = b.min_salary || 0
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [positions, searchTerm, departmentFilter, activeFilter, levelFilter, salaryRangeFilter, sortBy, sortOrder])

  // Handle create
  const handleCreatePosition = async () => {
    try {
      await masterDataService.createPosition(formData)
      toast({ type: 'success', title: 'Position created successfully' })
      setIsCreateModalOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error creating position:', error)
      toast({ type: 'error', title: 'Failed to create position' })
    }
  }

  // Handle update
  const handleUpdatePosition = async () => {
    if (!selectedPosition) return

    try {
      const updateData: UpdatePositionRequest = {
        id: selectedPosition.id,
        ...formData
      }
      await masterDataService.updatePosition(updateData)
      toast({ type: 'success', title: 'Position updated successfully' })
      setIsEditModalOpen(false)
      resetForm()
      setSelectedPosition(null)
      loadData()
    } catch (error) {
      console.error('Error updating position:', error)
      toast({ type: 'error', title: 'Failed to update position' })
    }
  }

  // Handle delete
  const handleDeletePosition = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return

    try {
      await masterDataService.deletePosition(id)
      toast({ type: 'success', title: 'Position deleted successfully' })
      loadData()
    } catch (error) {
      console.error('Error deleting position:', error)
      toast({ type: 'error', title: 'Failed to delete position' })
    }
  }

  // Bulk operations
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedPositions.length === 0) return
    
    const actionText = {
      activate: 'activate',
      deactivate: 'deactivate', 
      delete: 'delete'
    }[action]
    
    if (!confirm(`Are you sure you want to ${actionText} ${selectedPositions.length} positions?`)) return

    try {
      setActionLoading('bulk')
      
      for (const positionId of selectedPositions) {
        if (action === 'delete') {
          await masterDataService.deletePosition(positionId)
        } else {
          const position = positions.find(p => p.id === positionId)
          if (position) {
            const updateData: UpdatePositionRequest = {
              id: positionId,
              position_code: position.position_code,
              position_title: position.position_title,
              position_description: position.position_description || '',
              department_id: position.department_id,
              position_level: position.position_level,
              min_salary: position.min_salary || 0,
              max_salary: position.max_salary || 0,
              required_skills: position.required_skills || [],
              is_active: action === 'activate',
              display_order: position.display_order
            }
            await masterDataService.updatePosition(updateData)
          }
        }
      }
      
      toast({ 
        type: 'success', 
        title: `Successfully ${actionText}d ${selectedPositions.length} positions` 
      })
      
      setSelectedPositions([])
      setShowBulkActions(false)
      loadData()
    } catch (error) {
      console.error(`Error ${action} positions:`, error)
      toast({ type: 'error', title: `Failed to ${action} positions` })
    } finally {
      setActionLoading(null)
    }
  }

  const togglePositionSelection = (positionId: string) => {
    setSelectedPositions(prev => {
      const newSelection = prev.includes(positionId)
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
      
      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  const toggleAllPositions = () => {
    const allSelected = selectedPositions.length === filteredAndSortedPositions.length
    const newSelection = allSelected ? [] : filteredAndSortedPositions.map(p => p.id)
    setSelectedPositions(newSelection)
    setShowBulkActions(newSelection.length > 0)
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDepartmentFilter('all')
    setActiveFilter('all')
    setLevelFilter('all')
    setSalaryRangeFilter({ min: '', max: '' })
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      position_code: '',
      position_title: '',
      position_description: '',
      department_id: '',
      position_level: 1,
      min_salary: 0,
      max_salary: 0,
      required_skills: [],
      is_active: true,
      display_order: 0
    })
  }

  // Open edit modal
  const openEditModal = (position: PositionWithRelations) => {
    setSelectedPosition(position)
    setFormData({
      position_code: position.position_code,
      position_title: position.position_title,
      position_description: position.position_description || '',
      department_id: position.department_id,
      position_level: position.position_level,
      min_salary: position.min_salary || 0,
      max_salary: position.max_salary || 0,
      required_skills: position.required_skills || [],
      is_active: position.is_active,
      display_order: position.display_order
    })
    setIsEditModalOpen(true)
  }

  // Open view modal
  const openViewModal = (position: PositionWithRelations) => {
    setSelectedPosition(position)
    setIsViewModalOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Stats calculations
  const stats = useMemo(() => {
    const uniqueDepartments = new Set(positions.map(p => p.department_id)).size
    const avgLevel = positions.length > 0 
      ? (positions.reduce((sum, p) => sum + p.position_level, 0) / positions.length).toFixed(1)
      : 0
    const withSalaryRange = positions.filter(p => p.min_salary && p.max_salary).length
    
    return {
      total: positions.length,
      active: positions.filter(p => p.is_active).length,
      departments: uniqueDepartments,
      avgLevel,
      withSalaryRange
    }
  }, [positions])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Position Management
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage job positions, levels, and salary structures
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <StatusBadge status="success">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {stats.total} Total Positions
                </StatusBadge>
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {stats.departments} Departments
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Avg Level: {stats.avgLevel}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ActionButton variant="secondary" size="sm" onClick={() => loadData()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </ActionButton>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <ActionButton variant="primary" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Position
                  </ActionButton>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Position</DialogTitle>
                    <DialogDescription>
                      Add a new job position to the system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code">Position Code *</Label>
                      <Input
                        id="code"
                        value={formData.position_code}
                        onChange={(e) => setFormData({ ...formData, position_code: e.target.value })}
                        placeholder="e.g., DEV-SR, HR-MGR"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Position Title *</Label>
                      <Input
                        id="title"
                        value={formData.position_title}
                        onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select 
                        value={formData.department_id} 
                        onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.department_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="level">Position Level</Label>
                      <Input
                        id="level"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.position_level}
                        onChange={(e) => setFormData({ ...formData, position_level: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="min-salary">Min Salary (IDR)</Label>
                        <Input
                          id="min-salary"
                          type="number"
                          value={formData.min_salary}
                          onChange={(e) => setFormData({ ...formData, min_salary: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-salary">Max Salary (IDR)</Label>
                        <Input
                          id="max-salary"
                          type="number"
                          value={formData.max_salary}
                          onChange={(e) => setFormData({ ...formData, max_salary: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.position_description}
                        onChange={(e) => setFormData({ ...formData, position_description: e.target.value })}
                        placeholder="Position description..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePosition}>
                      Create Position
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Positions</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600 font-medium">{stats.active} Active</span>
              <span className="text-red-500">{stats.total - stats.active} Inactive</span>
            </div>
            <Progress value={(stats.active / stats.total) * 100} className="h-1 mt-2" />
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.departments}</div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Well distributed
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Level</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.avgLevel}</div>
            </div>
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              Career progression
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">With Salary</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.withSalaryRange}</div>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-muted-foreground">
              <Settings className="h-3 w-3 mr-1" />
              Compensation ready
            </div>
            <Progress value={(stats.withSalaryRange / stats.total) * 100} className="h-1 mt-1" />
          </CardContent>
        </ProfessionalCard>
      </div>

      {/* Enhanced Filters */}
      <ProfessionalCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Search & Filters</CardTitle>
            </div>
            {(searchTerm || departmentFilter !== 'all' || activeFilter !== 'all' || levelFilter !== 'all' || salaryRangeFilter.min || salaryRangeFilter.max) && (
              <ActionButton variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </ActionButton>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {[...Array(10)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Level {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Min salary"
                type="number"
                value={salaryRangeFilter.min}
                onChange={(e) => setSalaryRangeFilter(prev => ({ ...prev, min: e.target.value }))}
                className="w-full"
              />
              <Input
                placeholder="Max salary"
                type="number"
                value={salaryRangeFilter.max}
                onChange={(e) => setSalaryRangeFilter(prev => ({ ...prev, max: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <ProfessionalCard className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">
                  {selectedPositions.length} positions selected
                </Badge>
                <div className="flex items-center space-x-2">
                  <ActionButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    disabled={actionLoading === 'bulk'}
                  >
                    Activate Selected
                  </ActionButton>
                  <ActionButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    disabled={actionLoading === 'bulk'}
                  >
                    Deactivate Selected
                  </ActionButton>
                  <ActionButton 
                    variant="error" 
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    disabled={actionLoading === 'bulk'}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </ActionButton>
                </div>
              </div>
              <ActionButton 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedPositions([])
                  setShowBulkActions(false)
                }}
              >
                <X className="h-4 w-4" />
              </ActionButton>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      {/* Enhanced Position Table */}
      <ProfessionalCard variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Positions</span>
              </CardTitle>
              <CardDescription>
                {filteredAndSortedPositions.length} positions found
                {filteredAndSortedPositions.length !== positions.length && (
                  <span> (filtered from {positions.length} total)</span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Showing {filteredAndSortedPositions.length} of {positions.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedPositions.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No positions found"
              description={searchTerm || departmentFilter !== 'all' || activeFilter !== 'all' || levelFilter !== 'all' || salaryRangeFilter.min || salaryRangeFilter.max
                ? "No positions match your current filters. Try adjusting your search criteria."
                : "Start by creating your first position to organize your company structure."
              }
              action={
                searchTerm || departmentFilter !== 'all' || activeFilter !== 'all' || levelFilter !== 'all' || salaryRangeFilter.min || salaryRangeFilter.max ? {
                  label: "Clear Filters",
                  onClick: clearFilters
                } : {
                  label: "Create Position",
                  onClick: () => setIsCreateModalOpen(true)
                }
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPositions.length === filteredAndSortedPositions.length && filteredAndSortedPositions.length > 0}
                      onCheckedChange={toggleAllPositions}
                    />
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('title')}>
                    <div className="flex items-center space-x-1">
                      <span>Title</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('department')}>
                    <div className="flex items-center space-x-1">
                      <span>Department</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('level')}>
                    <div className="flex items-center space-x-1">
                      <span>Level</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('salary')}>
                    <div className="flex items-center space-x-1">
                      <span>Salary Range</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPositions.map((position) => (
                  <TableRow key={position.id} className={selectedPositions.includes(position.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPositions.includes(position.id)}
                        onCheckedChange={() => togglePositionSelection(position.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <Badge variant="outline" className="font-mono">
                        {position.position_code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{position.position_title}</div>
                        {position.position_description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {position.position_description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{position.department?.department_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${position.position_level >= 7 ? 'border-purple-200 text-purple-700 bg-purple-50' : 
                                    position.position_level >= 4 ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                    'border-green-200 text-green-700 bg-green-50'}`}
                      >
                        Level {position.position_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {position.min_salary && position.max_salary ? (
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrency(position.min_salary!)}</div>
                          <div className="text-xs text-muted-foreground">to {formatCurrency(position.max_salary!)}</div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-xs">Not configured</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={position.is_active ? "success" : "inactive"}>
                        {position.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewModal(position)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(position)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Position
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              const updateData: UpdatePositionRequest = {
                                id: position.id,
                                position_code: position.position_code,
                                position_title: position.position_title,
                                position_description: position.position_description || '',
                                department_id: position.department_id,
                                position_level: position.position_level,
                                min_salary: position.min_salary || 0,
                                max_salary: position.max_salary || 0,
                                required_skills: position.required_skills || [],
                                is_active: !position.is_active,
                                display_order: position.display_order
                              }
                              masterDataService.updatePosition(updateData).then(() => {
                                toast({ type: 'success', title: `Position ${position.is_active ? 'deactivated' : 'activated'}` })
                                loadData()
                              })
                            }}
                            className={position.is_active ? "text-orange-600" : "text-green-600"}
                          >
                            {position.is_active ? (
                              <><X className="h-4 w-4 mr-2" />Deactivate</>
                            ) : (
                              <><CheckSquare className="h-4 w-4 mr-2" />Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePosition(position.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </ProfessionalCard>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update position information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Position Code *</Label>
              <Input
                id="edit-code"
                value={formData.position_code}
                onChange={(e) => setFormData({ ...formData, position_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Position Title *</Label>
              <Input
                id="edit-title"
                value={formData.position_title}
                onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department *</Label>
              <Select 
                value={formData.department_id} 
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-level">Position Level</Label>
              <Input
                id="edit-level"
                type="number"
                min="1"
                max="10"
                value={formData.position_level}
                onChange={(e) => setFormData({ ...formData, position_level: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="edit-min-salary">Min Salary (IDR)</Label>
                <Input
                  id="edit-min-salary"
                  type="number"
                  value={formData.min_salary}
                  onChange={(e) => setFormData({ ...formData, min_salary: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-max-salary">Max Salary (IDR)</Label>
                <Input
                  id="edit-max-salary"
                  type="number"
                  value={formData.max_salary}
                  onChange={(e) => setFormData({ ...formData, max_salary: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePosition}>
              Update Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Position Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedPosition?.position_title}
            </DialogDescription>
          </DialogHeader>
          {selectedPosition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Code</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedPosition.position_code}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedPosition.is_active ? "default" : "secondary"}>
                      {selectedPosition.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPosition.position_title}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPosition.department?.department_name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Level</Label>
                  <p className="text-sm text-muted-foreground">
                    Level {selectedPosition.position_level}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Display Order</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPosition.display_order}
                  </p>
                </div>
              </div>
              {(selectedPosition.min_salary || selectedPosition.max_salary) && (
                <div>
                  <Label className="text-sm font-medium">Salary Range</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPosition.min_salary ? formatCurrency(selectedPosition.min_salary) : 'Not set'} - {selectedPosition.max_salary ? formatCurrency(selectedPosition.max_salary) : 'Not set'}
                  </p>
                </div>
              )}
              {selectedPosition.position_description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPosition.position_description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}