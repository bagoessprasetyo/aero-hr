"use client"

import { useState, useEffect } from 'react'
import { MasterDataService } from '@/lib/services/master-data'
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '@/lib/types/master-data'
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
  TreePine
} from 'lucide-react'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Department Management</h2>
          <p className="text-muted-foreground">
            Manage organizational departments and hierarchy
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Power className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {departments.filter(d => d.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <PowerOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {departments.filter(d => !d.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Root Departments</CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(d => !d.parent_department_id).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department Table */}
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            {filteredDepartments.length} departments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Hierarchy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Children</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-mono text-sm">
                    {department.department_code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {department.department_name}
                  </TableCell>
                  <TableCell>
                    {renderHierarchy(department)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={department.is_active ? "default" : "secondary"}>
                      {department.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {department.child_departments?.length || 0} children
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openViewModal(department)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(department)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteDepartment(department.id)}
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
        </CardContent>
      </Card>

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