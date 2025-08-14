"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ProfessionalCard, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton,
  StatusBadge
} from "@/components/ui/professional"
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Users,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Eye
} from "lucide-react"
import { EmployeeService } from "@/lib/services/employees"
import { SalaryHistoryService } from "@/lib/services/salary-history"
import type { 
  Employee, 
  ComplianceAuditLog,
  AuditType 
} from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface SalaryExportProps {
  className?: string
}

interface ExportFilters {
  startDate: string
  endDate: string
  departments?: string[]
  employeeIds?: string[]
  includeInactive: boolean
  exportFormat: 'csv' | 'excel' | 'pdf'
  exportType: 'salary_history' | 'compliance_report' | 'pph21_report' | 'bpjs_report'
}

interface ExportPreview {
  totalEmployees: number
  totalRecords: number
  dateRange: string
  departments: string[]
  estimatedFileSize: string
}

const employeeService = new EmployeeService()
const salaryHistoryService = new SalaryHistoryService()

export function SalaryExport({ className }: SalaryExportProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set())
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeInactive: false,
    exportFormat: 'excel',
    exportType: 'salary_history'
  })
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null)
  const [recentExports, setRecentExports] = useState<ComplianceAuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const employeeResponse = await employeeService.getEmployees()
      const employeeData = Array.isArray(employeeResponse) ? employeeResponse : employeeResponse.employees
      setEmployees(employeeData)
      
      const uniqueDepts = [...new Set(employeeData.map(emp => emp.department))]
      setDepartments(uniqueDepts)
      
      // Load recent export history (would need to implement this in service)
      // const exports = await salaryHistoryService.getRecentExports()
      // setRecentExports(exports)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentChange = (department: string, selected: boolean) => {
    const newSelection = new Set(selectedDepartments)
    if (selected) {
      newSelection.add(department)
      // Auto-select employees from this department
      const deptEmployees = employees
        .filter(emp => emp.department_id === department)
        .map(emp => emp.id)
      setSelectedEmployees(prev => new Set([...prev, ...deptEmployees]))
    } else {
      newSelection.delete(department)
      // Auto-deselect employees from this department
      const deptEmployees = employees
        .filter(emp => emp.department_id === department)
        .map(emp => emp.id)
      setSelectedEmployees(prev => {
        const newEmpSelection = new Set(prev)
        deptEmployees.forEach(id => newEmpSelection.delete(id))
        return newEmpSelection
      })
    }
    setSelectedDepartments(newSelection)
  }

  const generatePreview = async () => {
    const filteredEmployees = employees.filter(emp => {
      if (!exportFilters.includeInactive && emp.employee_status !== 'active') return false
      if (selectedDepartments.size > 0 && !selectedDepartments.has(emp.department_id)) return false
      if (selectedEmployees.size > 0 && !selectedEmployees.has(emp.id)) return false
      return true
    })

    const estimatedRecordsPerEmployee = 12 // Rough estimate based on export type
    const totalRecords = filteredEmployees.length * estimatedRecordsPerEmployee
    const estimatedFileSizeKB = totalRecords * 0.5 // Rough estimate

    setExportPreview({
      totalEmployees: filteredEmployees.length,
      totalRecords,
      dateRange: `${exportFilters.startDate} to ${exportFilters.endDate}`,
      departments: Array.from(selectedDepartments),
      estimatedFileSize: estimatedFileSizeKB > 1024 
        ? `${(estimatedFileSizeKB / 1024).toFixed(1)} MB`
        : `${estimatedFileSizeKB.toFixed(0)} KB`
    })
  }

  const executeExport = async () => {
    try {
      setExporting(true)
      
      const exportData = await salaryHistoryService.exportSalaryHistoryForCompliance(
        exportFilters.startDate,
        exportFilters.endDate,
        {
          employeeIds: selectedEmployees.size > 0 ? Array.from(selectedEmployees) : undefined,
          departments: selectedDepartments.size > 0 ? Array.from(selectedDepartments) : undefined,
          includeInactive: exportFilters.includeInactive
        }
      )

      // Create and download file based on format
      const filename = `salary-export-${exportFilters.exportType}-${exportFilters.startDate}-${exportFilters.endDate}`

      switch (exportFilters.exportFormat) {
        case 'csv':
          const csvContent = generateCSVContent(exportData.data)
          const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
          saveAs(csvBlob, `${filename}.csv`)
          break
          
        case 'excel':
          const workbook = generateExcelFile(exportData.data)
          if (workbook) {
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const excelBlob = new Blob([excelBuffer], { 
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            })
            saveAs(excelBlob, `${filename}.xlsx`)
          }
          break
          
        case 'pdf':
          // For PDF, we'll create a simple text-based report
          // In a real implementation, you might want to use a PDF library
          const textContent = generateTextReport(exportData.data)
          const textBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
          saveAs(textBlob, `${filename}.txt`)
          break
      }

      // Reset preview
      setExportPreview(null)
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(false)
    }
  }

  const generateCSVContent = (data: any[]) => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    )
    return [headers, ...rows].join('\n')
  }

  const generateExcelFile = (data: any[]) => {
    if (data.length === 0) return null

    // Create a new workbook
    const wb = XLSX.utils.book_new()
    
    // Summary worksheet
    const summaryData = [
      ['Laporan Ekspor Gaji'],
      ['Tanggal Dibuat', new Date().toLocaleDateString('id-ID')],
      ['Periode', `${exportFilters.startDate} s/d ${exportFilters.endDate}`],
      ['Jenis Laporan', getExportTypeDescription()],
      ['Total Karyawan', data.length],
      [],
      ['Ringkasan Statistik'],
    ]

    if (data.length > 0) {
      // Add statistical summary if data contains salary information
      const totalGrossField = data.find(item => 
        Object.keys(item).some(key => 
          key.toLowerCase().includes('gross') || key.toLowerCase().includes('kotor')
        )
      )
      
      if (totalGrossField) {
        const grossFieldName = Object.keys(totalGrossField).find(key => 
          key.toLowerCase().includes('gross') || key.toLowerCase().includes('kotor')
        )
        if (grossFieldName) {
          const totalGross = data.reduce((sum, item) => sum + (parseFloat(item[grossFieldName]) || 0), 0)
          const avgGross = totalGross / data.length
          summaryData.push(
            ['Total Gaji Kotor', formatCurrency(totalGross)],
            ['Rata-rata Gaji', formatCurrency(avgGross)]
          )
        }
      }
    }

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    
    // Set column widths for summary
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }]
    
    // Style the header
    const headerRange = XLSX.utils.decode_range(summaryWs['!ref'] || 'A1')
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: C })
      if (!summaryWs[cellRef]) continue
      summaryWs[cellRef].s = {
        font: { bold: true, sz: 14 },
        fill: { fgColor: { rgb: "2563eb" } }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan')
    
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
    
    // Style the header row
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: C })
      if (!detailWs[cellRef]) continue
      detailWs[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "f3f4f6" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, detailWs, 'Data Detail')
    
    return wb
  }

  const generateTextReport = (data: any[]) => {
    // Simple text report generation
    let report = `Salary Report\n`
    report += `Generated: ${new Date().toLocaleString('id-ID')}\n`
    report += `Period: ${exportFilters.startDate} to ${exportFilters.endDate}\n\n`
    
    data.forEach((item, index) => {
      report += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`
    })
    
    return report
  }

  const getExportTypeDescription = () => {
    switch (exportFilters.exportType) {
      case 'salary_history':
        return 'Complete salary change history with approval status and audit trail'
      case 'compliance_report':
        return 'Government compliance report with PPh21 and BPJS calculations'
      case 'pph21_report':
        return 'Income tax (PPh21) calculation details for tax reporting'
      case 'bpjs_report':
        return 'BPJS contribution details for social security reporting'
      default:
        return 'Export salary and payroll data'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Salary Data Export & Compliance Reports</span>
          </CardTitle>
          <CardDescription>
            Export salary history and generate compliance reports for government agencies
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Export Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-type">Export Type</Label>
                  <Select 
                    value={exportFilters.exportType} 
                    onValueChange={(value) => 
                      setExportFilters(prev => ({ ...prev, exportType: value as any }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary_history">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Salary History</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="compliance_report">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Compliance Report</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pph21_report">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>PPh21 Tax Report</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bpjs_report">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>BPJS Report</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    {getExportTypeDescription()}
                  </p>
                </div>

                <div>
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select 
                    value={exportFilters.exportFormat} 
                    onValueChange={(value) => 
                      setExportFilters(prev => ({ ...prev, exportFormat: value as any }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="pdf">PDF Report (.pdf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={exportFilters.startDate}
                    onChange={(e) => setExportFilters(prev => ({ 
                      ...prev, 
                      startDate: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={exportFilters.endDate}
                    onChange={(e) => setExportFilters(prev => ({ 
                      ...prev, 
                      endDate: e.target.value 
                    }))}
                  />
                </div>
              </div>

              {/* Department Selection */}
              <div>
                <Label>Departments (leave empty for all)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={selectedDepartments.has(dept)}
                        onCheckedChange={(checked) => 
                          handleDepartmentChange(dept, checked === true)
                        }
                      />
                      <label htmlFor={`dept-${dept}`} className="text-sm text-gray-700">
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-inactive"
                  checked={exportFilters.includeInactive}
                  onCheckedChange={(checked) => 
                    setExportFilters(prev => ({ 
                      ...prev, 
                      includeInactive: checked === true 
                    }))
                  }
                />
                <label htmlFor="include-inactive" className="text-sm text-gray-700">
                  Include inactive employees
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <ActionButton
                  variant="secondary"
                  onClick={generatePreview}
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Export
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={executeExport}
                  disabled={!exportPreview || exporting}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export Data'}
                </ActionButton>
              </div>
            </CardContent>
          </ProfessionalCard>
        </div>

        {/* Preview and Recent Exports */}
        <div className="space-y-6">
          {/* Preview */}
          {exportPreview && (
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Export Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employees:</span>
                  <span className="font-medium">{exportPreview.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Records:</span>
                  <span className="font-medium">{exportPreview.totalRecords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Period:</span>
                  <span className="font-medium text-xs">{exportPreview.dateRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">File Size:</span>
                  <span className="font-medium">{exportPreview.estimatedFileSize}</span>
                </div>
                {exportPreview.departments.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Departments:</span>
                    <div className="mt-1 space-y-1">
                      {exportPreview.departments.map(dept => (
                        <div key={dept} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {dept}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </ProfessionalCard>
          )}

          {/* Recent Exports */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Exports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentExports.length === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title="No recent exports"
                  description="Export history will appear here"
                />
              ) : (
                <div className="space-y-3">
                  {recentExports.slice(0, 5).map(exportLog => (
                    <div key={exportLog.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{exportLog.audit_type}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(exportLog.generated_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {exportLog.audit_description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {exportLog.total_employees_audited} employees
                        </span>
                        <StatusBadge status="success">
                          Completed
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </div>
      </div>
    </div>
  )
}