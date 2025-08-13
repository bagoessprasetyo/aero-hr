"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { LoadingSkeleton, EmptyState, StatusBadge } from '@/components/ui/professional'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  ArrowUpDown,
  Download,
  UserPlus,
  ChevronDown,
  ChevronUp,
  X,
  CheckSquare
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EmployeeService } from '@/lib/services/employees'
import type { Employee } from '@/lib/types/database'
import { cn } from '@/lib/utils'

const employeeService = new EmployeeService()

type SortField = 'full_name' | 'employee_id' | 'department' | 'position_title' | 'join_date' | 'employee_status'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  search: string
  department: string
  status: string
  employmentType: string
  joinDateFrom: string
  joinDateTo: string
}

interface EnhancedEmployeeTableProps {
  onAddEmployee: () => void
  className?: string
}

export function EnhancedEmployeeTable({ onAddEmployee, className }: EnhancedEmployeeTableProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [departments, setDepartments] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    department: 'all',
    status: 'all',
    employmentType: 'all',
    joinDateFrom: '',
    joinDateTo: ''
  })

  const router = useRouter()

  useEffect(() => {
    loadEmployees()
    loadDepartments()
  }, [filters, sortField, sortDirection, currentPage, pageSize])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError('')
      
      const queryFilters: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }
      
      if (filters.search) queryFilters.search = filters.search
      if (filters.department !== 'all') queryFilters.department = filters.department
      if (filters.status !== 'all') queryFilters.status = filters.status
      
      const { employees: data, total } = await employeeService.getEmployees(queryFilters)
      
      // Apply client-side filtering and sorting
      let processedData = [...data]
      
      // Additional filters
      if (filters.employmentType !== 'all') {
        processedData = processedData.filter(emp => emp.employment_status === filters.employmentType)
      }
      
      if (filters.joinDateFrom) {
        const fromDate = new Date(filters.joinDateFrom)
        processedData = processedData.filter(emp => new Date(emp.join_date) >= fromDate)
      }
      
      if (filters.joinDateTo) {
        const toDate = new Date(filters.joinDateTo)
        processedData = processedData.filter(emp => new Date(emp.join_date) <= toDate)
      }
      
      // Sorting
      processedData.sort((a, b) => {
        let aVal: any, bVal: any
        
        switch (sortField) {
          case 'full_name':
            aVal = a.full_name || ''
            bVal = b.full_name || ''
            break
          case 'employee_id':
            aVal = a.employee_id || ''
            bVal = b.employee_id || ''
            break
          case 'department':
            aVal = a.department || ''
            bVal = b.department || ''
            break
          case 'position_title':
            aVal = a.position_title || ''
            bVal = b.position_title || ''
            break
          case 'join_date':
            aVal = new Date(a.join_date)
            bVal = new Date(b.join_date)
            break
          case 'employee_status':
            aVal = a.employee_status || ''
            bVal = b.employee_status || ''
            break
          default:
            aVal = a.full_name || ''
            bVal = b.full_name || ''
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
      
      setEmployees(processedData)
      setTotalCount(total)
    } catch (error: any) {
      console.error('Error loading employees:', error)
      setError(error.message || 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const depts = await employeeService.getDepartments()
      setDepartments(depts.map(dept => dept.name))
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(employees.map(emp => emp.id)))
    } else {
      setSelectedEmployees(new Set())
    }
  }, [employees])

  const handleSelectEmployee = useCallback((employeeId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmployees)
    if (checked) {
      newSelected.add(employeeId)
    } else {
      newSelected.delete(employeeId)
    }
    setSelectedEmployees(newSelected)
  }, [selectedEmployees])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      department: 'all',
      status: 'all',
      employmentType: 'all',
      joinDateFrom: '',
      joinDateTo: ''
    })
    setCurrentPage(1)
  }

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || 
           filters.department !== 'all' || 
           filters.status !== 'all' || 
           filters.employmentType !== 'all' ||
           filters.joinDateFrom !== '' ||
           filters.joinDateTo !== ''
  }, [filters])

  const exportEmployees = () => {
    console.log('Exporting employees:', selectedEmployees.size > 0 ? Array.from(selectedEmployees) : 'all')
  }

  const bulkActions = [
    { label: 'Export Selected', action: exportEmployees, icon: Download },
    { label: 'Bulk Edit', action: () => console.log('Bulk edit'), icon: Edit },
    { label: 'Deactivate', action: () => console.log('Bulk deactivate'), icon: Trash2 }
  ]

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status as any}>{status}</StatusBadge>
  }

  const getEmploymentTypeBadge = (type: string) => {
    return (
      <Badge 
        variant="outline" 
        className={type === 'permanent' ? 'text-blue-700' : 'text-purple-700'}
      >
        {type}
      </Badge>
    )
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4 text-gray-400" />
        {sortField === field && (
          <span className="text-xs">
            {sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </span>
        )}
      </div>
    </TableHead>
  )

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className={cn("space-y-4 md:space-y-6", className)}>
      {/* Header with bulk actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Employee Directory</h2>
          <p className="text-sm md:text-base text-gray-600">
            {totalCount.toLocaleString()} employee{totalCount !== 1 ? 's' : ''} found
            {selectedEmployees.size > 0 && (
              <span className="ml-2 font-medium">
                • {selectedEmployees.size} selected
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full sm:w-auto">
          {selectedEmployees.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs md:text-sm">
                  <CheckSquare className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Bulk Actions</span>
                  <span className="sm:hidden">Bulk</span>
                  ({selectedEmployees.size})
                  <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {bulkActions.map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.action}>
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)} 
            className="gap-2 text-xs md:text-sm"
          >
            <Filter className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
            {hasActiveFilters && <Badge variant="secondary" className="ml-1 text-xs">!</Badge>}
          </Button>
          
          <Button onClick={onAddEmployee} size="sm" className="gap-2 text-xs md:text-sm">
            <UserPlus className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Add Employee</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Name, ID, NIK, NPWP..."
                    className="pl-8"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem 
                        key={typeof dept === 'string' ? dept : (dept as {department_name: string}).department_name} 
                        value={typeof dept === 'string' ? dept : (dept as {department_name: string}).department_name}
                      >
                        {typeof dept === 'object' && dept ? (dept as {department_name: string}).department_name : dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Employment Type</label>
                <Select value={filters.employmentType} onValueChange={(value) => handleFilterChange('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Join Date From</label>
                <Input
                  type="date"
                  value={filters.joinDateFrom}
                  onChange={(e) => handleFilterChange('joinDateFrom', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Join Date To</label>
                <Input
                  type="date"
                  value={filters.joinDateTo}
                  onChange={(e) => handleFilterChange('joinDateTo', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee List</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton variant="table" className="p-6" />
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No employees found"
              description={
                hasActiveFilters
                  ? "No employees match your current search criteria. Try adjusting your filters."
                  : "Start building your team by adding your first employee."
              }
              action={{
                label: hasActiveFilters ? "Clear Filters" : "Add Employee",
                onClick: hasActiveFilters ? clearFilters : onAddEmployee
              }}
              className="py-12"
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEmployees.size === employees.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <SortableHeader field="full_name">Employee</SortableHeader>
                      <SortableHeader field="employee_id">ID / NIK</SortableHeader>
                      <SortableHeader field="department">Department</SortableHeader>
                      <SortableHeader field="position_title">Position</SortableHeader>
                      <SortableHeader field="employee_status">Status</SortableHeader>
                      <TableHead>Type</TableHead>
                      <SortableHeader field="join_date">Join Date</SortableHeader>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployees.has(employee.id)}
                            onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.full_name}</div>
                            {employee.email && (
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-mono text-sm">{employee.employee_id}</div>
                            <div className="text-xs text-gray-500">{employee.nik}</div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department?.department_name || 'N/A'}</TableCell>
                        <TableCell>{employee.position?.position_title || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(employee.employee_status)}</TableCell>
                        <TableCell>{getEmploymentTypeBadge(employee.employment_status)}</TableCell>
                        <TableCell>{new Date(employee.join_date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Employee
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Terminate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {employees.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedEmployees.has(employee.id)}
                            onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                          />
                          <div>
                            <h3 className="font-medium text-base">{employee.full_name}</h3>
                            <p className="text-sm text-gray-600">{employee.position?.position_title || 'N/A'}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Employee
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Terminate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">ID:</span>
                          <span className="ml-1 font-mono">{employee.employee_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">NIK:</span>
                          <span className="ml-1 font-mono text-xs">{employee.nik}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <span className="ml-1">{employee.department?.department_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Joined:</span>
                          <span className="ml-1">{new Date(employee.join_date).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                      
                      {employee.email && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Email:</span>
                          <span className="ml-1 text-blue-600">{employee.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(employee.employee_status)}
                          {getEmploymentTypeBadge(employee.employment_status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className="px-2">...</span>
                          <Button
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}