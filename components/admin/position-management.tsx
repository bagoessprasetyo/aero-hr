"use client"

import { useState, useEffect } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Building2
} from 'lucide-react'

const masterDataService = new MasterDataService()

interface PositionWithRelations extends Position {
  department?: Department
}

export function PositionManagement() {
  const { toast } = useToast()
  const [positions, setPositions] = useState<PositionWithRelations[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredPositions, setFilteredPositions] = useState<PositionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedPosition, setSelectedPosition] = useState<PositionWithRelations | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

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
      setFilteredPositions(positionsResponse.data as PositionWithRelations[])
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

  // Filter positions
  useEffect(() => {
    let filtered = positions

    if (searchTerm) {
      filtered = filtered.filter(pos =>
        pos.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.position_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(pos => pos.department_id === departmentFilter)
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(pos => pos.is_active === (activeFilter === 'active'))
    }

    setFilteredPositions(filtered)
  }, [positions, searchTerm, departmentFilter, activeFilter])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading positions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Position Management</h2>
          <p className="text-muted-foreground">
            Manage job positions, levels, and salary ranges
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {positions.filter(p => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(positions.map(p => p.department_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Level</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positions.length > 0 
                ? (positions.reduce((sum, p) => sum + p.position_level, 0) / positions.length).toFixed(1)
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
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
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Position Table */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>
            {filteredPositions.length} positions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Salary Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-mono text-sm">
                    {position.position_code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {position.position_title}
                  </TableCell>
                  <TableCell>
                    {position.department?.department_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Level {position.position_level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {position.min_salary && position.max_salary ? (
                      <div>
                        <div>{formatCurrency(position.min_salary!)}</div>
                        <div className="text-muted-foreground">to {formatCurrency(position.max_salary!)}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={position.is_active ? "default" : "secondary"}>
                      {position.is_active ? "Active" : "Inactive"}
                    </Badge>
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
                          Edit
                        </DropdownMenuItem>
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
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
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