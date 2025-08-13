"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/rbac/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddEmployeeForm } from "@/components/employees/add-employee-form"
import { Plus, Search, Filter, MoreHorizontal, Edit, Eye, Trash2, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmployeeService } from "@/lib/services/employees"
import type { Employee } from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"

const employeeService = new EmployeeService()

export default function EmployeesPage() {
  return (
    <ProtectedRoute permission="employees.read">
      <EmployeesPageContent />
    </ProtectedRoute>
  )
}

function EmployeesPageContent() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [departments, setDepartments] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, resigned: 0, terminated: 0 })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadEmployees()
    loadDepartments()
    loadStats()
  }, [searchTerm, statusFilter, departmentFilter])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      
      if (searchTerm) filters.search = searchTerm
      if (statusFilter !== "all") filters.status = statusFilter
      if (departmentFilter !== "all") filters.department = departmentFilter
      
      const { employees } = await employeeService.getEmployees(filters)
      setEmployees(employees)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const depts = await employeeService.getDepartments()
      setDepartments(depts)
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const loadStats = async () => {
    try {
      const employeeStats = await employeeService.getEmployeeStats()
      setStats(employeeStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'resigned':
        return <Badge className="bg-yellow-100 text-yellow-800">Resigned</Badge>
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getEmploymentTypeBadge = (type: string) => {
    return type === 'permanent' 
      ? <Badge variant="outline" className="text-blue-700">Permanent</Badge>
      : <Badge variant="outline" className="text-purple-700">Contract</Badge>
  }

  const handleEmployeeAdded = () => {
    setIsAddDialogOpen(false)
    loadEmployees()
    loadStats()
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage employee profiles, salary components, and employment data
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a new employee profile with Indonesian compliance requirements
              </DialogDescription>
            </DialogHeader>
            <AddEmployeeForm 
              onSuccess={handleEmployeeAdded}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resigned</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminated</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.terminated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, employee ID, NIK, or NPWP..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>
            {employees.length} employee{employees.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading employees...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No employees found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search criteria or add a new employee
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>ID / NIK</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.full_name}</div>
                          {employee.email && (
                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">{employee.employee_id}</div>
                          <div className="text-xs text-muted-foreground">{employee.nik}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position_title}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}