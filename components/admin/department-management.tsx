"use client"

import { useState, useEffect } from 'react'
import { MasterDataService } from '@/lib/services/master-data'
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '@/lib/types/master-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ProfessionalCard,
  ActionButton
} from '@/components/ui/professional'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Users,
  Power,
  PowerOff,
  TreePine,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

const masterDataService = new MasterDataService()

interface DepartmentWithRelations extends Omit<Department, 'positions' | 'department_head'> {
  parent_department?: Department
  child_departments?: Department[]
  department_head?: { id: string; full_name: string }
  positions?: { id: string; position_title: string; is_active: boolean }[]
}

export function DepartmentManagement() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<DepartmentWithRelations[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithRelations | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  
  // Bulk operations state
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [bulkActionMode, setBulkActionMode] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Enhanced filtering state
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'created' | 'order'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Form states
  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    department_code: '',
    department_name: '',
    department_description: '',
    parent_department_id: '',
    is_active: true,
    display_order: 0
  })

  // Load departments
  const loadDepartments = async () => {
    try {
      setLoading(true)
      const response = await masterDataService.getDepartments()
      setDepartments(response.data as DepartmentWithRelations[])
      setFilteredDepartments(response.data as DepartmentWithRelations[])
    } catch (error) {
      console.error('Error loading departments:', error)
      toast({ type: 'error', title: 'Failed to load departments' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  // Filter departments based on search and active filter
  useEffect(() => {
    let filtered = departments

    if (searchTerm) {
      filtered = filtered.filter(dept =>
        dept.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.department_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(dept => dept.is_active === (activeFilter === 'active'))
    }

    setFilteredDepartments(filtered)
  }, [departments, searchTerm, activeFilter])

  // Handle form submission for creating department
  const handleCreateDepartment = async () => {
    try {
      await masterDataService.createDepartment(formData)
      toast({ type: 'success', title: 'Department created successfully' })
      setIsCreateModalOpen(false)
      resetForm()
      loadDepartments()
    } catch (error) {
      console.error('Error creating department:', error)
      toast({ type: 'error', title: 'Failed to create department' })
    }
  }

  // Handle form submission for updating department
  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return

    try {
      const updateData: UpdateDepartmentRequest = {
        id: selectedDepartment.id,
        ...formData
      }
      await masterDataService.updateDepartment(updateData)
      toast({ type: 'success', title: 'Department updated successfully' })
      setIsEditModalOpen(false)
      resetForm()
      setSelectedDepartment(null)
      loadDepartments()
    } catch (error) {
      console.error('Error updating department:', error)
      toast({ type: 'error', title: 'Failed to update department' })
    }
  }

  // Handle delete department
  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      await masterDataService.deleteDepartment(id)
      toast({ type: 'success', title: 'Department deleted successfully' })
      loadDepartments()
    } catch (error) {
      console.error('Error deleting department:', error)
      toast({ type: 'error', title: 'Failed to delete department' })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      department_code: '',
      department_name: '',
      department_description: '',
      parent_department_id: '',
      is_active: true,
      display_order: 0
    })
  }

  // Open edit modal with selected department data
  const openEditModal = (department: DepartmentWithRelations) => {
    setSelectedDepartment(department)
    setFormData({
      department_code: department.department_code,
      department_name: department.department_name,
      department_description: department.department_description || '',
      parent_department_id: department.parent_department_id || '',
      is_active: department.is_active,
      display_order: department.display_order
    })
    setIsEditModalOpen(true)
  }

  // Open view modal with selected department data
  const openViewModal = (department: DepartmentWithRelations) => {
    setSelectedDepartment(department)
    setIsViewModalOpen(true)
  }

  const renderHierarchy = (dept: DepartmentWithRelations) => {
    if (dept.parent_department) {
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <TreePine className="h-3 w-3" />
          {dept.parent_department.department_name}
        </div>
      )
    }
    return <span className="text-sm text-muted-foreground">Root Level</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading departments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Department Management
                  </h2>
                  <p className="text-muted-foreground">
                    Organize company structure and manage hierarchical relationships
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {departments.length} Total Departments
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {departments.filter(d => d.is_active).length} Active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Updated {lastRefresh.toLocaleTimeString()}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ActionButton variant="secondary" size="sm" onClick={() => loadDepartments()}>
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
                    Add Department
                  </ActionButton>
                </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department to the organizational structure.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Department Code *</Label>
                <Input
                  id="code"
                  value={formData.department_code}
                  onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                  placeholder="e.g., IT, HR, FIN"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                  placeholder="e.g., Information Technology"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.department_description}
                  onChange={(e) => setFormData({ ...formData, department_description: e.target.value })}
                  placeholder="Department description..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parent">Parent Department</Label>
                <Select 
                  value={formData.parent_department_id} 
                  onValueChange={(value) => setFormData({ ...formData, parent_department_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Parent (Root Level)</SelectItem>
                    {departments.filter(d => d.is_active).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
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
              <Button onClick={handleCreateDepartment}>
                Create Department
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Enhanced Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Departments</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">
              Complete organizational structure
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Departments</CardTitle>
              <div className="text-2xl font-bold text-green-600">
                {departments.filter(d => d.is_active).length}
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">
              Currently operational units
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Departments</CardTitle>
              <div className="text-2xl font-bold text-red-600">
                {departments.filter(d => !d.is_active).length}
              </div>
            </div>
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">
              Temporarily disabled units
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Root Departments</CardTitle>
              <div className="text-2xl font-bold text-purple-600">
                {departments.filter(d => !d.parent_department_id).length}
              </div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <TreePine className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">
              Top-level organizational units
            </div>
          </CardContent>
        </ProfessionalCard>
      </div>

      {/* Enhanced Filters & Bulk Operations */}
      <ProfessionalCard variant="outlined">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              <Select value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
                <SelectTrigger className="w-40 h-10">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              
              <ActionButton 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </ActionButton>
            </div>
            
            {selectedDepartments.length > 0 && (
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {selectedDepartments.length} selected
                </Badge>
                <ActionButton variant="outline" size="sm">
                  <Power className="h-4 w-4 mr-2" />
                  Bulk Activate
                </ActionButton>
                <ActionButton variant="outline" size="sm">
                  <PowerOff className="h-4 w-4 mr-2" />
                  Bulk Deactivate
                </ActionButton>
                <ActionButton variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </ActionButton>
              </div>
            )}
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <Label htmlFor="sort-by" className="text-sm font-medium">Sort by</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Department Name</SelectItem>
                    <SelectItem value="code">Department Code</SelectItem>
                    <SelectItem value="created">Creation Date</SelectItem>
                    <SelectItem value="order">Display Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sort-order" className="text-sm font-medium">Order</Label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <ActionButton variant="outline" size="sm" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Filters
                </ActionButton>
              </div>
            </div>
          )}
        </CardContent>
      </ProfessionalCard>

      {/* Enhanced Data Grid */}
      <ProfessionalCard variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Department Directory</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredDepartments.length} departments found • {departments.filter(d => d.is_active).length} active
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <ActionButton variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </ActionButton>
              <ActionButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </ActionButton>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedDepartments.length === filteredDepartments.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDepartments(filteredDepartments.map(d => d.id))
                        } else {
                          setSelectedDepartments([])
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Hierarchy</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Sub-Departments</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow 
                    key={department.id}
                    className={cn(
                      "hover:bg-gray-50/50 transition-colors",
                      selectedDepartments.includes(department.id) && "bg-blue-50/50"
                    )}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedDepartments.includes(department.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDepartments([...selectedDepartments, department.id])
                          } else {
                            setSelectedDepartments(selectedDepartments.filter(id => id !== department.id))
                          }
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {department.department_code}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                          <Building2 className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {department.department_name}
                          </div>
                          {department.department_description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {department.department_description.substring(0, 50)}
                              {department.department_description.length > 50 && '...'}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {renderHierarchy(department)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={department.is_active ? "outline" : "secondary"}
                        className={cn(
                          "text-xs",
                          department.is_active 
                            ? "text-green-600 border-green-200 bg-green-50" 
                            : "text-red-600 border-red-200 bg-red-50"
                        )}
                      >
                        {department.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <TreePine className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {department.child_departments?.length || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {department.child_departments?.length === 1 ? 'child' : 'children'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(department)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </ActionButton>
                        
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(department)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </ActionButton>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <ActionButton variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </ActionButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewModal(department)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(department)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Department
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              View Employees
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDepartment(department.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredDepartments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">No departments found</div>
                        <div className="text-xs text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Department Code *</Label>
              <Input
                id="edit-code"
                value={formData.department_code}
                onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                placeholder="e.g., IT, HR, FIN"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                placeholder="e.g., Information Technology"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.department_description}
                onChange={(e) => setFormData({ ...formData, department_description: e.target.value })}
                placeholder="Department description..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-parent">Parent Department</Label>
              <Select 
                value={formData.parent_department_id} 
                onValueChange={(value) => setFormData({ ...formData, parent_department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Parent (Root Level)</SelectItem>
                  {departments
                    .filter(d => d.is_active && d.id !== selectedDepartment?.id)
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-order">Display Order</Label>
              <Input
                id="edit-order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
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
            <Button onClick={handleUpdateDepartment}>
              Update Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Department Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedDepartment?.department_name}
            </DialogDescription>
          </DialogHeader>
          {selectedDepartment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Code</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedDepartment.department_code}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedDepartment.is_active ? "default" : "secondary"}>
                      {selectedDepartment.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedDepartment.department_name}
                </p>
              </div>
              {selectedDepartment.department_description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.department_description}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Hierarchy</Label>
                <div className="mt-1">
                  {renderHierarchy(selectedDepartment)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Child Departments</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.child_departments?.length || 0} departments
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Display Order</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDepartment.display_order}
                  </p>
                </div>
              </div>
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