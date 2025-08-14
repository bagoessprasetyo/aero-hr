"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Calculator, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock,
  FileText,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  ArrowUpDown,
  Grid3X3,
  List
} from "lucide-react"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { Payroll } from "@/lib/types/database"
import { 
  ProfessionalCard, 
  StatusBadge, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton 
} from "@/components/ui/professional"
import { cn } from "@/lib/utils"

interface PayrollPeriodListProps {
  onViewPayroll: (payroll: Payroll) => void
  onEditPayroll: (payroll: Payroll) => void
  refreshTrigger?: number
}

const payrollService = new PayrollService()

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function PayrollPeriodList({ onViewPayroll, onEditPayroll, refreshTrigger }: PayrollPeriodListProps) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [filteredPayrolls, setFilteredPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Payroll>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadPayrolls()
  }, [refreshTrigger])

  useEffect(() => {
    filterAndSortPayrolls()
  }, [payrolls, statusFilter, yearFilter, searchTerm, sortField, sortDirection])

  const loadPayrolls = async () => {
    try {
      setLoading(true)
      
      // Load all payrolls without server-side filtering for better client-side control
      const data = await payrollService.getPayrollPeriods()
      setPayrolls(data)

      // Extract available years
      const years = Array.from(new Set(data.map(p => p.period_year))).sort((a, b) => b - a)
      setAvailableYears(years)
    } catch (error) {
      console.error('Error loading payrolls:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPayrolls = () => {
    let filtered = [...payrolls]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Apply year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(p => p.period_year === parseInt(yearFilter))
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => {
        const monthName = months[p.period_month - 1].toLowerCase()
        const yearStr = p.period_year.toString()
        const periodStr = `${monthName} ${yearStr}`.toLowerCase()
        return periodStr.includes(term)
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle special sorting cases
      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredPayrolls(filtered)
  }

  const handleSort = (field: keyof Payroll) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setYearFilter("all")
    setSearchTerm("")
    setSortField("created_at")
    setSortDirection("desc")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <StatusBadge status="inactive">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </StatusBadge>
        )
      case 'calculated':
        return (
          <StatusBadge status="warning">
            <Calculator className="h-3 w-3 mr-1" />
            Calculated
          </StatusBadge>
        )
      case 'finalized':
        return (
          <StatusBadge status="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Finalized
          </StatusBadge>
        )
      default:
        return <StatusBadge status="inactive">{status}</StatusBadge>
    }
  }

  const renderGridView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredPayrolls.map((payroll) => {
        const periodName = formatPeriod(payroll.period_month, payroll.period_year)
        return (
          <ProfessionalCard 
            key={payroll.id}
            variant="interactive"
            className="cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => onViewPayroll(payroll)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{periodName}</CardTitle>
                    <CardDescription>
                      {payroll.total_employees || 0} employees
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(payroll.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Gross Salary</p>
                    <p className="font-semibold">
                      {payroll.total_gross_salary > 0 ? formatCurrency(payroll.total_gross_salary) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Net Salary</p>
                    <p className="font-semibold text-green-600">
                      {payroll.total_net_salary > 0 ? formatCurrency(payroll.total_net_salary) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    Created {new Date(payroll.created_at).toLocaleDateString('id-ID')}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <ActionButton variant="secondary" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </ActionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewPayroll(payroll) }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {payroll.status !== 'finalized' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditPayroll(payroll) }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit & Calculate
                        </DropdownMenuItem>
                      )}
                      {payroll.status === 'draft' && (
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); handleDeletePayroll(payroll) }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>
        )
      })}
    </div>
  )

  const SortableHeader = ({ field, children }: { field: keyof Payroll; children: React.ReactNode }) => (
    <TableHead>
      <button
        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
        onClick={() => handleSort(field)}
      >
        <span>{children}</span>
        <ArrowUpDown className={cn(
          "h-4 w-4",
          sortField === field ? "text-blue-600" : "text-gray-400"
        )} />
      </button>
    </TableHead>
  )

  const handleDeletePayroll = async (payroll: Payroll) => {
    if (payroll.status !== 'draft') {
      alert('Only draft payrolls can be deleted')
      return
    }

    if (confirm(`Are you sure you want to delete payroll for ${months[payroll.period_month - 1]} ${payroll.period_year}?`)) {
      try {
        await payrollService.deletePayroll(payroll.id)
        loadPayrolls()
      } catch (error: any) {
        alert(`Error deleting payroll: ${error.message}`)
      }
    }
  }

  const formatPeriod = (month: number, year: number) => {
    return `${months[month - 1]} ${year}`
  }

  const hasActiveFilters = statusFilter !== "all" || yearFilter !== "all" || searchTerm.trim() !== ""

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-16" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingSkeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters & Search */}
      <ProfessionalCard >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Payroll Periods</span>
              </CardTitle>
              <CardDescription>
                {filteredPayrolls.length} of {payrolls.length} payroll periods
                {hasActiveFilters && " (filtered)"}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? "border-blue-300 bg-blue-50" : ""}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && <span className="ml-1 bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs">●</span>}
              </ActionButton>
              <div className="flex items-center space-x-1 border rounded-lg p-1">
                <ActionButton
                  variant={viewMode === "table" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="px-2 py-1"
                >
                  <List className="h-4 w-4" />
                </ActionButton>
                <ActionButton
                  variant={viewMode === "grid" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="px-2 py-1"
                >
                  <Grid3X3 className="h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Search Bar */}
        <CardContent className="pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search payroll periods... (e.g., January 2024)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Filter Options</h4>
                {hasActiveFilters && (
                  <ActionButton variant="secondary" size="sm" onClick={clearFilters}>
                    Clear All
                  </ActionButton>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">📝 Draft</SelectItem>
                      <SelectItem value="calculated">🧮 Calculated</SelectItem>
                      <SelectItem value="finalized">✅ Finalized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Year</label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Sort By</label>
                  <Select value={sortField} onValueChange={(value) => setSortField(value as keyof Payroll)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">📅 Date Created</SelectItem>
                      <SelectItem value="period_year">📊 Period Year</SelectItem>
                      <SelectItem value="status">🏷️ Status</SelectItem>
                      <SelectItem value="total_net_salary">💰 Total Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </ProfessionalCard>

      {/* Main Content */}
      {filteredPayrolls.length === 0 ? (
        <EmptyState
          icon={searchTerm || hasActiveFilters ? Search : Calendar}
          title={searchTerm || hasActiveFilters ? "No matching payrolls" : "No payroll periods"}
          description={
            searchTerm || hasActiveFilters
              ? "Try adjusting your search or filter criteria"
              : "Create your first payroll period to get started"
          }
          action={{
            label: hasActiveFilters ? "Clear Filters" : "Create First Payroll",
            onClick: hasActiveFilters ? clearFilters : () => window.location.href = '/payroll'
          }}
        />
      ) : viewMode === "grid" ? (
        renderGridView()
      ) : (
        <ProfessionalCard >
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="period_year">Period</SortableHeader>
                    <TableHead>Status</TableHead>
                    <SortableHeader field="total_employees">
                      <Users className="h-4 w-4 inline mr-1" />
                      Employees
                    </SortableHeader>
                    <SortableHeader field="total_gross_salary">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Gross Salary
                    </SortableHeader>
                    <SortableHeader field="total_pph21">Tax (PPh 21)</SortableHeader>
                    <SortableHeader field="total_net_salary">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      Net Salary
                    </SortableHeader>
                    <SortableHeader field="created_at">Created</SortableHeader>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrolls.map((payroll) => (
                    <TableRow 
                      key={payroll.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onViewPayroll(payroll)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-gray-100 rounded">
                            <Calendar className="h-3 w-3 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {formatPeriod(payroll.period_month, payroll.period_year)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payroll.status === 'finalized' && payroll.finalized_at && 
                                `Finalized ${new Date(payroll.finalized_at).toLocaleDateString('id-ID')}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {payroll.total_employees > 0 ? (
                            <span className="font-medium">{payroll.total_employees}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payroll.total_gross_salary > 0 ? (
                          <div className="font-mono text-sm">
                            {formatCurrency(payroll.total_gross_salary)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payroll.total_pph21 > 0 ? (
                          <div className="font-mono text-sm text-red-600">
                            {formatCurrency(payroll.total_pph21)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payroll.total_net_salary > 0 ? (
                          <div className="font-mono text-sm font-semibold text-green-600">
                            {formatCurrency(payroll.total_net_salary)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(payroll.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <ActionButton 
                              variant="secondary" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </ActionButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewPayroll(payroll) }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {payroll.status !== 'finalized' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditPayroll(payroll) }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit & Calculate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* TODO: Export */ }}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            {payroll.status === 'draft' && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => { e.stopPropagation(); handleDeletePayroll(payroll) }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      {/* Summary Footer */}
      {filteredPayrolls.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-6">
            <span>
              <strong>{filteredPayrolls.length}</strong> periods shown
              {payrolls.length !== filteredPayrolls.length && ` of ${payrolls.length} total`}
            </span>
            <span>
              <strong>{filteredPayrolls.filter(p => p.status === 'finalized').length}</strong> finalized
            </span>
            <span>
              <strong>{filteredPayrolls.filter(p => p.status === 'draft').length}</strong> pending
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Total net payroll:</span>
            <strong className="text-green-600">
              {formatCurrency(
                filteredPayrolls
                  .filter(p => p.status === 'finalized')
                  .reduce((sum, p) => sum + (p.total_net_salary || 0), 0)
              )}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}