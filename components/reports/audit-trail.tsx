"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ProfessionalCard, 
  ActionButton, 
  EmptyState, 
  StatusBadge 
} from "@/components/ui/professional"
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Calendar,
  Users,
  Calculator,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Archive
} from "lucide-react"
import { AuditService, type CalculationAuditEntry, type AuditFilters } from "@/lib/services/audit"
import { EmployeeService } from "@/lib/services/employees"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"
import type { Employee } from "@/lib/types/database"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface AuditTrailProps {
  className?: string
}

const auditService = new AuditService()
const employeeService = new EmployeeService()

export function AuditTrail({ className }: AuditTrailProps) {
  const [auditEntries, setAuditEntries] = useState<CalculationAuditEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEntry, setSelectedEntry] = useState<CalculationAuditEntry | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  const [filters, setFilters] = useState<AuditFilters>({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load audit trail and summary in parallel
      const [auditData, summaryData, employeeData] = await Promise.all([
        auditService.getAuditTrail(filters, 100),
        auditService.getAuditSummary(filters),
        employeeService.getEmployees()
      ])
      
      setAuditEntries(auditData)
      setSummary(summaryData)
      
      const employeeList = Array.isArray(employeeData) ? employeeData : employeeData.employees
      setEmployees(employeeList)
      
    } catch (error) {
      console.error('Error loading audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const resetFilters = () => {
    setFilters({
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    })
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const { success, data, error } = await auditService.exportAuditTrail(filters, 'excel')
      
      if (success && data) {
        // Create Excel workbook
        const wb = XLSX.utils.book_new()
        
        // Summary worksheet
        const summaryData = [
          ['Audit Trail Report'],
          ['Generated:', new Date().toLocaleDateString('id-ID')],
          ['Period:', `${filters.start_date || 'All'} to ${filters.end_date || 'All'}`],
          [],
          ['Summary Statistics'],
          ['Total Calculations:', summary?.total_calculations || 0],
          ['Total Employees:', summary?.total_employees || 0],
          ['Total Gross Salary:', formatCurrency(summary?.total_gross_salary || 0)],
          ['Total PPh21:', formatCurrency(summary?.total_pph21 || 0)],
          ['Total Net Salary:', formatCurrency(summary?.total_net_salary || 0)],
          ['Finalized:', summary?.finalized_count || 0],
          ['Pending:', summary?.pending_count || 0]
        ]
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
        summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }]
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
        
        // Detail worksheet
        const detailWs = XLSX.utils.json_to_sheet(data)
        
        // Auto-fit columns
        const range = XLSX.utils.decode_range(detailWs['!ref'] || 'A1')
        const colWidths: any[] = []
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxWidth = 10
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
            const cell = detailWs[cellRef]
            if (cell && cell.v) {
              const cellLength = cell.v.toString().length
              if (cellLength > maxWidth) maxWidth = cellLength
            }
          }
          colWidths.push({ wch: Math.min(maxWidth + 2, 50) })
        }
        detailWs['!cols'] = colWidths
        
        XLSX.utils.book_append_sheet(wb, detailWs, 'Audit Detail')
        
        // Export
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        const filename = `audit-trail-${filters.start_date || 'all'}-to-${filters.end_date || 'all'}.xlsx`
        saveAs(blob, filename)
        
      } else {
        console.error('Export failed:', error)
      }
    } catch (error) {
      console.error('Error exporting audit trail:', error)
    } finally {
      setExporting(false)
    }
  }

  const getCalculationTypeIcon = (type: string) => {
    switch (type) {
      case 'payroll': return <Calculator className="h-4 w-4" />
      case 'salary_adjustment': return <TrendingUp className="h-4 w-4" />
      case 'tax_calculation': return <FileText className="h-4 w-4" />
      case 'bpjs_calculation': return <Shield className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCalculationTypeColor = (type: string) => {
    switch (type) {
      case 'payroll': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'salary_adjustment': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'tax_calculation': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'bpjs_calculation': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Archive className="h-5 w-5" />
            <span>Calculation Audit Trail</span>
          </CardTitle>
          <CardDescription>
            Complete audit trail for all payroll calculations and tax computations
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Total Calculations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_calculations}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_employees} employees
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_gross_salary)}</div>
              <p className="text-xs text-muted-foreground">
                Total processed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tax & BPJS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.total_pph21 + summary.total_bpjs_employee)}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>PPh21: {formatCurrency(summary.total_pph21)}</div>
                <div>BPJS: {formatCurrency(summary.total_bpjs_employee)}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Finalized:</span>
                  <span className="font-medium text-green-600">{summary.finalized_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending:</span>
                  <span className="font-medium text-orange-600">{summary.pending_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trail" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trail">Audit Trail</TabsTrigger>
          <TabsTrigger value="detail">Detail View</TabsTrigger>
        </TabsList>

        {/* Audit Trail Tab */}
        <TabsContent value="trail" className="space-y-4">
          {/* Filters */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={filters.employee_id || ''} onValueChange={(value) => handleFilterChange('employee_id', value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All employees</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.employee_id} - {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Calculation Type</Label>
                  <Select value={filters.calculation_type || ''} onValueChange={(value) => handleFilterChange('calculation_type', value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="salary_adjustment">Salary Adjustment</SelectItem>
                      <SelectItem value="tax_calculation">Tax Calculation</SelectItem>
                      <SelectItem value="bpjs_calculation">BPJS Calculation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="finalized-only"
                    checked={filters.is_finalized === true}
                    onCheckedChange={(checked) => handleFilterChange('is_finalized', checked ? true : undefined)}
                  />
                  <Label htmlFor="finalized-only">Finalized only</Label>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <ActionButton variant="primary" onClick={handleExport} disabled={exporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </ActionButton>
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Audit Entries */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle>Audit Entries ({auditEntries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {auditEntries.length === 0 ? (
                <EmptyState
                  icon={<Archive className="h-8 w-8" />}
                  title="No audit entries found"
                  description="No calculations match the selected filters"
                />
              ) : (
                <div className="space-y-3">
                  {auditEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs border",
                            getCalculationTypeColor(entry.calculation_type)
                          )}>
                            {getCalculationTypeIcon(entry.calculation_type)}
                            <span className="capitalize">{entry.calculation_type.replace('_', ' ')}</span>
                          </div>
                          <StatusBadge status={entry.is_finalized ? "success" : "warning"}>
                            {entry.is_finalized ? 'Finalized' : 'Pending'}
                          </StatusBadge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.calculation_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium">{entry.employee_name}</p>
                          <p className="text-xs text-gray-600">NIK: {entry.employee_nik}</p>
                        </div>
                        <div>
                          <p className="text-sm">Period: {entry.period_month}/{entry.period_year}</p>
                          <p className="text-xs text-gray-600">
                            Gross: {formatCurrency(entry.calculation_results.gross_salary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600">
                            Net: {formatCurrency(entry.calculation_results.net_salary)}
                          </p>
                          <p className="text-xs text-gray-600">
                            PPh21: {formatCurrency(entry.calculation_results.pph21)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Created by: {entry.created_by}
                        </p>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Detail View Tab */}
        <TabsContent value="detail" className="space-y-4">
          {selectedEntry ? (
            <div className="space-y-4">
              {/* Entry Header */}
              <ProfessionalCard>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Calculation Detail</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={selectedEntry.is_finalized ? "default" : "secondary"}>
                        {selectedEntry.is_finalized ? 'Finalized' : 'Pending'}
                      </Badge>
                      <Badge variant="outline">
                        {new Date(selectedEntry.calculation_date).toLocaleDateString('id-ID')}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {selectedEntry.employee_name} ({selectedEntry.employee_nik}) - Period {selectedEntry.period_month}/{selectedEntry.period_year}
                  </CardDescription>
                </CardHeader>
              </ProfessionalCard>

              {/* Calculation Steps */}
              <ProfessionalCard>
                <CardHeader>
                  <CardTitle>Calculation Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedEntry.calculation_steps.map((step, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Step {step.step}: {step.description}</h4>
                          <Badge variant="outline">{formatCurrency(step.result)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Input: {formatCurrency(step.input_value)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Calculation: {step.calculation}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </ProfessionalCard>

              {/* Compliance Information */}
              <ProfessionalCard>
                <CardHeader>
                  <CardTitle>Compliance Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Regulations Applied</h4>
                      <ul className="text-sm space-y-1">
                        {selectedEntry.compliance_info.regulations_applied.map((regulation, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>{regulation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tax Details</h4>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Tax Bracket:</span>
                          <span>{selectedEntry.compliance_info.tax_bracket_used}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PTKP Deduction:</span>
                          <span>{formatCurrency(selectedEntry.compliance_info.ptkp_deduction)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Occupational Cost:</span>
                          <span>{formatCurrency(selectedEntry.compliance_info.occupational_cost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </ProfessionalCard>

              {/* Input & Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfessionalCard>
                  <CardHeader>
                    <CardTitle className="text-lg">Input Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span className="font-mono">{formatCurrency(selectedEntry.input_data.basic_salary)}</span>
                    </div>
                    {Object.entries(selectedEntry.input_data.allowances).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace('_', ' ')}:</span>
                        <span className="font-mono">{formatCurrency(value)}</span>
                      </div>
                    ))}
                    {(selectedEntry.input_data.variable_components.bonus || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span className="font-mono">{formatCurrency(selectedEntry.input_data.variable_components.bonus || 0)}</span>
                      </div>
                    )}
                  </CardContent>
                </ProfessionalCard>

                <ProfessionalCard>
                  <CardHeader>
                    <CardTitle className="text-lg">Final Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Gross Salary:</span>
                      <span className="font-mono">{formatCurrency(selectedEntry.calculation_results.gross_salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PPh21:</span>
                      <span className="font-mono">{formatCurrency(selectedEntry.calculation_results.pph21)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>BPJS Employee:</span>
                      <span className="font-mono">
                        {formatCurrency(
                          selectedEntry.calculation_results.bpjs_employee.health + 
                          selectedEntry.calculation_results.bpjs_employee.jht + 
                          selectedEntry.calculation_results.bpjs_employee.jp
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-green-600 pt-2 border-t">
                      <span>Net Salary:</span>
                      <span className="font-mono">{formatCurrency(selectedEntry.calculation_results.net_salary)}</span>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Eye className="h-8 w-8" />}
              title="No entry selected"
              description="Select an audit entry from the trail tab to view details"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}