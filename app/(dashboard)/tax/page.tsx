'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Calculator, Settings, TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react"
import { TaxReportService } from '@/lib/services/tax-reports'
import { PayrollService } from '@/lib/services/payroll'
import { formatIDR, formatIndonesianDate, getIndonesianMonthName } from '@/lib/utils/indonesian-compliance'
import { exportEngine } from '@/lib/utils/export-engine'
import type { ComplianceStatus, TaxAnalytics } from '@/lib/types/tax-reports'
import type { Payroll } from '@/lib/types/database'

export default function TaxPage() {
  const [payrollPeriods, setPayrollPeriods] = useState<Payroll[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [taxAnalytics, setTaxAnalytics] = useState<TaxAnalytics | null>(null)
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const taxReportService = new TaxReportService()
  const payrollService = new PayrollService()

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodAnalytics(selectedPeriod)
    }
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load recent finalized payroll periods
      const periods = await payrollService.getPayrollPeriods({
        status: 'finalized',
        limit: 6
      })
      
      setPayrollPeriods(periods)
      
      // Auto-select the most recent period
      if (periods.length > 0 && !selectedPeriod) {
        const mostRecent = periods[0]
        setSelectedPeriod(`${mostRecent.period_year}-${mostRecent.period_month}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadPeriodAnalytics = async (periodKey: string) => {
    try {
      const [year, month] = periodKey.split('-').map(Number)
      
      // Load tax analytics
      const analytics = await taxReportService.generateTaxAnalytics(month, year)
      setTaxAnalytics(analytics)
      
      // Load compliance status
      const compliance = await taxReportService.checkComplianceStatus(month, year)
      setComplianceStatus(compliance)
      
    } catch (err) {
      console.error('Error loading period analytics:', err)
    }
  }

  const handleExportReport = async (reportType: 'pph21' | 'bpjs_health' | 'bpjs_employment' | 'bank_transfer') => {
    if (!selectedPeriod || !taxAnalytics) return
    
    try {
      const [year, month] = selectedPeriod.split('-').map(Number)
      const companyInfo = {
        name: 'PT. Aero HR Indonesia', // Would come from app config
        npwp: '12.345.678.9-012.000',
        bpjs_number: 'BPJS-001-002-003'
      }

      let exportResult: any
      
      switch (reportType) {
        case 'pph21':
          const pph21Report = await taxReportService.generatePPh21Report(month, year, companyInfo)
          exportResult = await exportEngine.exportPPh21Report(pph21Report, { format: 'excel' })
          break
          
        case 'bpjs_health':
          const healthReport = await taxReportService.generateBPJSHealthReport(month, year, companyInfo)
          exportResult = await exportEngine.exportBPJSReport(healthReport, { format: 'excel' })
          break
          
        case 'bpjs_employment':
          const employmentReport = await taxReportService.generateBPJSEmploymentReport(month, year, companyInfo)
          exportResult = await exportEngine.exportBPJSReport(employmentReport, { format: 'excel' })
          break
          
        case 'bank_transfer':
          // Would need payroll ID - this is simplified
          const targetPeriod = payrollPeriods.find(p => 
            p.period_year === year && p.period_month === month
          )
          if (targetPeriod) {
            const transferFile = await taxReportService.generateBankTransferFile(
              targetPeriod.id,
              'generic',
              {
                bank_name: 'Bank Central Asia',
                account_number: '1234567890',
                account_name: 'PT. Aero HR Indonesia'
              },
              new Date().toISOString().split('T')[0]
            )
            exportResult = await exportEngine.exportBankTransferFile(transferFile)
          }
          break
      }

      if (exportResult) {
        // Create download link
        const url = URL.createObjectURL(
          exportResult.content instanceof Blob 
            ? exportResult.content 
            : new Blob([exportResult.content], { type: exportResult.mimeType })
        )
        const link = document.createElement('a')
        link.href = url
        link.download = exportResult.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
      
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export report. Please try again.')
    }
  }

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'current':
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">✓ {status}</Badge>
      case 'warning':
      case 'outdated':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠ {status}</Badge>
      case 'non_compliant':
      case 'not_ready':
        return <Badge className="bg-red-100 text-red-800">✗ {status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tax dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tax Management & Reports</h1>
            <p className="text-muted-foreground">
              PPh 21 calculations, tax reporting, and Indonesian compliance management
            </p>
          </div>
          <div className="w-64">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {payrollPeriods.map((period) => (
                  <SelectItem 
                    key={`${period.period_year}-${period.period_month}`}
                    value={`${period.period_year}-${period.period_month}`}
                  >
                    {getIndonesianMonthName(period.period_month)} {period.period_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {taxAnalytics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{taxAnalytics.total_employees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Gross Salary</p>
                  <p className="text-2xl font-bold">{formatIDR(taxAnalytics.total_gross_salary, { showSymbol: false })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total PPh 21</p>
                  <p className="text-2xl font-bold">{formatIDR(taxAnalytics.total_pph21, { showSymbol: false })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Effective Tax Rate</p>
                  <p className="text-2xl font-bold">{taxAnalytics.effective_tax_rate.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>PPh 21 Calculator</span>
            </CardTitle>
            <CardDescription>
              Indonesian income tax calculation engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Tax Year:</span>
                <span className="font-medium">{new Date().getFullYear()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active PTKP Rates:</span>
                <Badge variant="outline">8 Types</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Occupational Cost:</span>
                <span className="font-medium">5% (max 500k/mo)</span>
              </div>
              <Button className="w-full" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure Tax Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Monthly Reports</span>
            </CardTitle>
            <CardDescription>
              Generate tax and BPJS compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleExportReport('pph21')}
                disabled={!selectedPeriod}
              >
                <Download className="mr-2 h-4 w-4" />
                PPh 21 Summary (e-SPT)
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleExportReport('bpjs_health')}
                disabled={!selectedPeriod}
              >
                <Download className="mr-2 h-4 w-4" />
                BPJS Health Report
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleExportReport('bpjs_employment')}
                disabled={!selectedPeriod}
              >
                <Download className="mr-2 h-4 w-4" />
                BPJS Employment Report
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleExportReport('bank_transfer')}
                disabled={!selectedPeriod}
              >
                <Download className="mr-2 h-4 w-4" />
                Bank Transfer File
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Compliance Status</CardTitle>
            <CardDescription>
              Current compliance with Indonesian regulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceStatus ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PPh 21 Accuracy</span>
                    {getComplianceBadge(complianceStatus.checks.pph21_accuracy.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PTKP Updates</span>
                    {getComplianceBadge(complianceStatus.checks.ptkp_updates.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">BPJS Rates</span>
                    {getComplianceBadge(complianceStatus.checks.bpjs_rates.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Form 1721-A1</span>
                    {getComplianceBadge(complianceStatus.checks.form_1721a1_readiness.status)}
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <Badge variant={complianceStatus.overall_score >= 90 ? 'default' : 'secondary'}>
                        {complianceStatus.overall_score}/100
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">Loading compliance status...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tax Calculations</CardTitle>
            <CardDescription>
              Latest PPh 21 and BPJS calculations by payroll period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payrollPeriods.length > 0 ? (
                payrollPeriods.map((period) => (
                  <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {getIndonesianMonthName(period.period_month)} {period.period_year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {period.total_employees} employees • Total PPh 21: {formatIDR(period.total_pph21 || 0)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">Finalized</Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setSelectedPeriod(`${period.period_year}-${period.period_month}`)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No finalized payroll periods found. Complete a payroll calculation first.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}