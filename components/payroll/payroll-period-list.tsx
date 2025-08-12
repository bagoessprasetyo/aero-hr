"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  AlertTriangle 
} from "lucide-react"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { Payroll } from "@/lib/types/database"

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
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [availableYears, setAvailableYears] = useState<number[]>([])

  useEffect(() => {
    loadPayrolls()
  }, [statusFilter, yearFilter, refreshTrigger])

  const loadPayrolls = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      
      if (statusFilter !== "all") filters.status = statusFilter
      if (yearFilter !== "all") filters.year = parseInt(yearFilter)
      
      const data = await payrollService.getPayrollPeriods(filters)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        )
      case 'calculated':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Calculator className="h-3 w-3 mr-1" />
            Calculated
          </Badge>
        )
      case 'finalized':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Finalized
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="calculated">Calculated</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[180px]">
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
        </CardContent>
      </Card>

      {/* Payroll List */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Periods</CardTitle>
          <CardDescription>
            {payrolls.length} payroll period{payrolls.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading payroll periods...</p>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payroll periods found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first payroll period to get started
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Total PPh 21</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <div className="font-medium">
                          {formatPeriod(payroll.period_month, payroll.period_year)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                      <TableCell>
                        {payroll.total_employees > 0 ? (
                          <span>{payroll.total_employees}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payroll.total_gross_salary > 0 ? (
                          formatCurrency(payroll.total_gross_salary)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payroll.total_pph21 > 0 ? (
                          formatCurrency(payroll.total_pph21)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payroll.total_net_salary > 0 ? (
                          <span className="font-medium">
                            {formatCurrency(payroll.total_net_salary)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(payroll.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewPayroll(payroll)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {payroll.status !== 'finalized' && (
                              <DropdownMenuItem onClick={() => onEditPayroll(payroll)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit & Calculate
                              </DropdownMenuItem>
                            )}
                            {payroll.status === 'draft' && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeletePayroll(payroll)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}