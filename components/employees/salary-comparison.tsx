"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ProfessionalCard, 
  StatsCard,
  ActionButton, 
  EmptyState, 
  LoadingSkeleton
} from "@/components/ui/professional"
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  Calculator,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { SalaryHistoryService } from "@/lib/services/salary-history"
import type { Employee, SalaryComponentHistory } from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

interface SalaryComparisonProps {
  employee: Employee
  className?: string
}

interface ComparisonData {
  employee: any
  fromSalary: {
    basic: number
    allowances: number
    gross: number
    components: any[]
  }
  toSalary: {
    basic: number
    allowances: number
    gross: number
    components: any[]
  }
  changes: SalaryComponentHistory[]
}

const salaryHistoryService = new SalaryHistoryService()

export function SalaryComparison({ employee, className }: SalaryComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [presetPeriod, setPresetPeriod] = useState<'3m' | '6m' | '1y' | 'custom'>('6m')

  useEffect(() => {
    // Set default dates based on preset
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    let defaultFromDate = ''
    
    switch (presetPeriod) {
      case '3m':
        defaultFromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        break
      case '6m':
        defaultFromDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        break
      case '1y':
        defaultFromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        break
      default:
        return // Don't auto-set for custom
    }
    
    if (presetPeriod === '3m' || presetPeriod === '6m' || presetPeriod === '1y') {
      setFromDate(defaultFromDate)
      setToDate(today)
    }
  }, [presetPeriod])

  useEffect(() => {
    if (fromDate && toDate && fromDate < toDate) {
      loadComparison()
    }
  }, [fromDate, toDate, employee.id])

  const loadComparison = async () => {
    if (!fromDate || !toDate) return

    try {
      setLoading(true)
      const data = await salaryHistoryService.getSalaryComparison(employee.id, fromDate, toDate)
      setComparisonData(data)
    } catch (error) {
      console.error('Error loading salary comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateChanges = () => {
    if (!comparisonData) return null

    const { fromSalary, toSalary } = comparisonData
    
    return {
      basic: {
        amount: toSalary.basic - fromSalary.basic,
        percentage: fromSalary.basic > 0 ? ((toSalary.basic - fromSalary.basic) / fromSalary.basic) * 100 : 0
      },
      allowances: {
        amount: toSalary.allowances - fromSalary.allowances,
        percentage: fromSalary.allowances > 0 ? ((toSalary.allowances - fromSalary.allowances) / fromSalary.allowances) * 100 : 0
      },
      gross: {
        amount: toSalary.gross - fromSalary.gross,
        percentage: fromSalary.gross > 0 ? ((toSalary.gross - fromSalary.gross) / fromSalary.gross) * 100 : 0
      }
    }
  }

  const getChangeIndicator = (amount: number) => {
    if (amount > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (amount < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <div className="h-4 w-4" />
  }

  const getChangeColor = (amount: number) => {
    if (amount > 0) return "text-green-600"
    if (amount < 0) return "text-red-600"
    return "text-gray-600"
  }

  const changes = calculateChanges()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Controls */}
      <ProfessionalCard module="employee">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Salary Comparison Analysis</span>
              </CardTitle>
              <CardDescription>
                Compare salary changes for {employee.full_name} between two periods
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comparison Period
              </label>
              <Select value={presetPeriod} onValueChange={(value: any) => setPresetPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">Last 3 months</SelectItem>
                  <SelectItem value="6m">Last 6 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={presetPeriod !== 'custom'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={presetPeriod !== 'custom'}
              />
            </div>

            <div className="flex items-end">
              <ActionButton
                variant="primary"
                onClick={loadComparison}
                disabled={!fromDate || !toDate || fromDate >= toDate}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Compare
              </ActionButton>
            </div>
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Comparison Results */}
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton />
        </div>
      ) : !comparisonData ? (
        <EmptyState
          icon={BarChart3}
          title="No comparison data"
          description="Select dates and click Compare to view salary changes"
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          {changes && (
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Basic Salary Change"
                value={formatCurrency(Math.abs(changes.basic.amount))}
                subtitle={`${changes.basic.percentage >= 0 ? '+' : ''}${changes.basic.percentage.toFixed(1)}%`}
                trend={{
                  value: Math.abs(changes.basic.percentage),
                  isPositive: changes.basic.amount >= 0,
                  label: "change"
                }}
                icon={DollarSign}
              />
              
              <StatsCard
                title="Allowances Change"
                value={formatCurrency(Math.abs(changes.allowances.amount))}
                subtitle={`${changes.allowances.percentage >= 0 ? '+' : ''}${changes.allowances.percentage.toFixed(1)}%`}
                trend={{
                  value: Math.abs(changes.allowances.percentage),
                  isPositive: changes.allowances.amount >= 0,
                  label: "change"
                }}
                icon={TrendingUp}
              />
              
              <StatsCard
                title="Total Gross Change"
                value={formatCurrency(Math.abs(changes.gross.amount))}
                subtitle={`${changes.gross.percentage >= 0 ? '+' : ''}${changes.gross.percentage.toFixed(1)}%`}
                trend={{
                  value: Math.abs(changes.gross.percentage),
                  isPositive: changes.gross.amount >= 0,
                  label: "change"
                }}
                icon={BarChart3}
              />
            </div>
          )}

          {/* Before/After Comparison */}
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Before & After Comparison</span>
              </CardTitle>
              <CardDescription>
                Detailed breakdown of salary components from {fromDate} to {toDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Before */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    Before ({new Date(fromDate).toLocaleDateString('id-ID')})
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Basic Salary</span>
                      <span className="font-semibold">{formatCurrency(comparisonData.fromSalary.basic)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Allowances</span>
                      <span className="font-semibold">{formatCurrency(comparisonData.fromSalary.allowances)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm font-bold text-blue-900">Gross Salary</span>
                      <span className="font-bold text-blue-900">{formatCurrency(comparisonData.fromSalary.gross)}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <ArrowRight className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">
                      {comparisonData.changes.length} changes
                    </span>
                  </div>
                </div>

                {/* After */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    After ({new Date(toDate).toLocaleDateString('id-ID')})
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Basic Salary</span>
                        {changes && getChangeIndicator(changes.basic.amount)}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(comparisonData.toSalary.basic)}</span>
                        {changes && changes.basic.amount !== 0 && (
                          <div className={cn("text-xs", getChangeColor(changes.basic.amount))}>
                            {changes.basic.amount > 0 ? '+' : ''}{formatCurrency(changes.basic.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Allowances</span>
                        {changes && getChangeIndicator(changes.allowances.amount)}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(comparisonData.toSalary.allowances)}</span>
                        {changes && changes.allowances.amount !== 0 && (
                          <div className={cn("text-xs", getChangeColor(changes.allowances.amount))}>
                            {changes.allowances.amount > 0 ? '+' : ''}{formatCurrency(changes.allowances.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-green-900">Gross Salary</span>
                        {changes && getChangeIndicator(changes.gross.amount)}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-900">{formatCurrency(comparisonData.toSalary.gross)}</span>
                        {changes && changes.gross.amount !== 0 && (
                          <div className={cn("text-xs font-medium", getChangeColor(changes.gross.amount))}>
                            {changes.gross.amount > 0 ? '+' : ''}{formatCurrency(changes.gross.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Change Details */}
          {comparisonData.changes.length > 0 && (
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Change Details</span>
                </CardTitle>
                <CardDescription>
                  All salary component changes during this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonData.changes.map((change, index) => (
                    <div 
                      key={change.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          change.action_type === 'CREATE' ? 'bg-green-100 text-green-600' :
                          change.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                          change.action_type === 'DELETE' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {change.action_type === 'CREATE' ? <CheckCircle2 className="h-4 w-4" /> :
                           change.action_type === 'UPDATE' ? <TrendingUp className="h-4 w-4" /> :
                           <AlertCircle className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{change.component_name}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {change.action_type.toLowerCase()} • {change.component_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {change.previous_amount !== null && change.previous_amount !== undefined && 
                         change.new_amount !== null && change.new_amount !== undefined && (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(change.previous_amount)}
                            </div>
                            <div className="font-semibold">
                              {formatCurrency(change.new_amount)}
                            </div>
                            <div className={cn(
                              "text-xs font-medium",
                              getChangeColor((change.new_amount || 0) - (change.previous_amount || 0))
                            )}>
                              {((change.new_amount || 0) - (change.previous_amount || 0)) > 0 ? '+' : ''}
                              {formatCurrency((change.new_amount || 0) - (change.previous_amount || 0))}
                            </div>
                          </div>
                        )}
                        {change.new_amount !== null && change.new_amount !== undefined && 
                         (change.previous_amount === null || change.previous_amount === undefined) && (
                          <div className="font-semibold text-green-600">
                            +{formatCurrency(change.new_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </ProfessionalCard>
          )}
        </div>
      )}
    </div>
  )
}