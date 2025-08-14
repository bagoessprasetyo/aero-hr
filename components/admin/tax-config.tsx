"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { 
  ProfessionalCard, 
  ActionButton, 
  EmptyState, 
  StatusBadge
} from "@/components/ui/professional"
import {
  Settings,
  Calculator,
  Shield,
  History,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  // Compare,
  Download,
  Upload,
  BarChart3,
  FileText,
  Zap,
  Target,
  DollarSign,
  Percent,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  GitCompare,
  Database
} from "lucide-react"
import { TaxConfigService, type TaxConfiguration } from "@/lib/services/tax-config"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"
import { CurrencyInput, PercentageInput } from "@/components/ui/currency-input"

interface TaxConfigProps {
  className?: string
}

interface CalculationPreview {
  gross_income: number
  ptkp_status: string
  occupational_cost: number
  bpjs_health_employee: number
  bpjs_employment_employee: number
  taxable_income: number
  tax_brackets: Array<{
    bracket: string
    income_portion: number
    tax_rate: number
    tax_amount: number
  }>
  total_tax: number
  net_income: number
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

const taxConfigService = new TaxConfigService()

export function TaxConfig({ className }: TaxConfigProps) {
  const [config, setConfig] = useState<TaxConfiguration | null>(null)
  const [editedConfig, setEditedConfig] = useState<TaxConfiguration | null>(null)
  const [previousConfig, setPreviousConfig] = useState<TaxConfiguration | null>(null)
  const [history, setHistory] = useState<TaxConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Calculation Preview State
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSalary, setPreviewSalary] = useState(15000000)
  const [previewPTKP, setPreviewPTKP] = useState('TK_0')
  const [calculationResult, setCalculationResult] = useState<CalculationPreview | null>(null)

  // Comparison State
  const [compareOpen, setCompareOpen] = useState(false)
  const [selectedHistoryConfig, setSelectedHistoryConfig] = useState<TaxConfiguration | null>(null)

  useEffect(() => {
    loadConfiguration()
    loadHistory()
  }, [])

  useEffect(() => {
    if (config && editedConfig) {
      const hasChanges = JSON.stringify(config) !== JSON.stringify(editedConfig)
      setHasChanges(hasChanges)
      if (hasChanges) {
        validateConfiguration(editedConfig)
      } else {
        setValidationErrors([])
      }
    }
  }, [config, editedConfig])

  // Real-time calculation preview
  useEffect(() => {
    if (editedConfig && previewSalary > 0 && !loading) {
      // Ensure config has all required properties before calculating
      const hasRequiredProperties = editedConfig.ptkp_amounts && 
                                   editedConfig.tax_brackets && 
                                   editedConfig.bpjs_rates && 
                                   editedConfig.occupational_cost
      
      if (hasRequiredProperties) {
        // Add a small delay to ensure config is fully loaded
        const timeoutId = setTimeout(() => {
          calculatePreview()
        }, 100)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [editedConfig, previewSalary, previewPTKP, loading])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      setError(null) // Clear previous errors
      
      console.log('Loading tax configuration...')
      
      // First, debug the database to see what's there
      await taxConfigService.debugDatabaseConfiguration()
      
      const currentConfig = await taxConfigService.getCurrentTaxConfiguration()
      console.log('Loaded config:', currentConfig)
      console.log('PTKP amounts:', currentConfig.ptkp_amounts)
      console.log('Tax brackets:', currentConfig.tax_brackets)
      
      if (!currentConfig) {
        throw new Error('No configuration received from service')
      }
      
      // Validate the loaded configuration
      if (!currentConfig.ptkp_amounts || !currentConfig.tax_brackets || !currentConfig.bpjs_rates) {
        console.warn('Incomplete configuration received, some properties are missing')
        console.log('Missing properties check:', {
          ptkp_amounts: !!currentConfig.ptkp_amounts,
          tax_brackets: !!currentConfig.tax_brackets,
          bpjs_rates: !!currentConfig.bpjs_rates,
          occupational_cost: !!currentConfig.occupational_cost
        })
        
        // If critical properties are missing, fall back to defaults
        const defaultConfig = taxConfigService.getDefaultConfiguration()
        console.log('Using default configuration due to missing properties')
        setConfig(defaultConfig)
        setEditedConfig(defaultConfig)
        setError('Loaded default configuration. Database configuration appears incomplete.')
        return
      }
      
      setConfig(currentConfig)
      setEditedConfig(currentConfig)
      console.log('Configuration loaded successfully')
    } catch (error: any) {
      console.error('Error loading configuration:', error)
      setError('Failed to load tax configuration: ' + error.message)
      
      // As a fallback, use defaults
      try {
        console.log('Attempting to load default configuration...')
        const defaultConfig = taxConfigService.getDefaultConfiguration()
        console.log('Using default configuration as fallback')
        setConfig(defaultConfig)
        setEditedConfig(defaultConfig)
        setError('Using default configuration. ' + error.message)
      } catch (defaultError) {
        console.error('Failed to get default configuration:', defaultError)
        setError('Failed to load any configuration.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const configHistory = await taxConfigService.getConfigurationHistory(10)
      setHistory(configHistory)
      if (configHistory.length > 1) {
        setPreviousConfig(configHistory[1] as any)
      }
    } catch (error: any) {
      console.error('Failed to load configuration history:', error)
    }
  }

  const validateConfiguration = (config: TaxConfiguration): ValidationError[] => {
    const errors: ValidationError[] = []

    // Validate PTKP amounts
    Object.entries(config.ptkp_amounts).forEach(([status, amount]) => {
      if (amount < 0) {
        errors.push({
          field: `ptkp_${status}`,
          message: `PTKP ${status} cannot be negative`,
          severity: 'error'
        })
      }
      if (amount > 100000000) {
        errors.push({
          field: `ptkp_${status}`,
          message: `PTKP ${status} seems unusually high`,
          severity: 'warning'
        })
      }
    })

    // Validate tax brackets
    Object.entries(config.tax_brackets).forEach(([bracket, taxConfig]) => {
      if (taxConfig.rate < 0 || taxConfig.rate > 1) {
        errors.push({
          field: `tax_${bracket}_rate`,
          message: `Tax rate for ${bracket} must be between 0% and 100%`,
          severity: 'error'
        })
      }
      if (taxConfig.min < 0) {
        errors.push({
          field: `tax_${bracket}_min`,
          message: `Minimum income for ${bracket} cannot be negative`,
          severity: 'error'
        })
      }
    })

    // Validate BPJS rates
    const healthRates = config.bpjs_rates.health
    if (healthRates.employee_rate + healthRates.company_rate > 0.2) {
      errors.push({
        field: 'bpjs_health_total',
        message: 'Total BPJS Health rate seems unusually high (>20%)',
        severity: 'warning'
      })
    }

    // Validate occupational cost
    if (config.occupational_cost.rate > 0.1) {
      errors.push({
        field: 'occupational_cost_rate',
        message: 'Occupational cost rate seems high (>10%)',
        severity: 'warning'
      })
    }

    setValidationErrors(errors)
    return errors
  }

  const calculatePreview = async () => {
    if (!editedConfig) return

    try {
      // Validate that required config properties exist
      if (!editedConfig.ptkp_amounts) {
        console.error('PTKP amounts not available in config')
        return
      }

      const grossIncome = previewSalary * 12 // Annual
      const ptkpKey = previewPTKP as keyof typeof editedConfig.ptkp_amounts
      const ptkpAmount = editedConfig.ptkp_amounts[ptkpKey]
      
      if (ptkpAmount === undefined) {
        console.error(`PTKP amount for ${previewPTKP} not found`)
        return
      }
      
      // Validate other required config properties
      if (!editedConfig.occupational_cost || !editedConfig.bpjs_rates || !editedConfig.tax_brackets) {
        console.error('Missing required config properties')
        return
      }

      // Calculate occupational cost (biaya jabatan)
      const occupationalCost = Math.min(
        grossIncome * editedConfig.occupational_cost.rate,
        editedConfig.occupational_cost.max_monthly * 12
      )

      // Calculate BPJS contributions (annual)
      const bpjsHealthEmployee = Math.min(previewSalary, editedConfig.bpjs_rates.health.max_salary) * 
        editedConfig.bpjs_rates.health.employee_rate * 12
      
      const bpjsEmploymentEmployee = (
        previewSalary * editedConfig.bpjs_rates.employment.jht.employee_rate +
        previewSalary * editedConfig.bpjs_rates.employment.jp.employee_rate
      ) * 12

      // Calculate taxable income
      const taxableIncome = Math.max(0, grossIncome - occupationalCost - bpjsHealthEmployee - bpjsEmploymentEmployee - ptkpAmount)

      // Calculate tax by brackets
      let remainingIncome = taxableIncome
      let totalTax = 0
      const bracketDetails: any[] = []

      const brackets = Object.entries(editedConfig.tax_brackets)
      for (const [bracket, config] of brackets) {
        if (remainingIncome <= 0) break
        
        const bracketMin = config.min
        const bracketMax = config.max || Infinity
        const bracketRange = bracketMax - bracketMin
        const incomeInBracket = Math.min(remainingIncome, Math.max(0, bracketRange))
        const taxInBracket = incomeInBracket * config.rate

        if (incomeInBracket > 0) {
          bracketDetails.push({
            bracket: bracket.replace('_', ' ').toUpperCase(),
            income_portion: incomeInBracket,
            tax_rate: config.rate,
            tax_amount: taxInBracket
          })
          totalTax += taxInBracket
          remainingIncome -= incomeInBracket
        }
      }

      const netIncome = grossIncome - bpjsHealthEmployee - bpjsEmploymentEmployee - totalTax

      setCalculationResult({
        gross_income: grossIncome,
        ptkp_status: previewPTKP,
        occupational_cost: occupationalCost,
        bpjs_health_employee: bpjsHealthEmployee,
        bpjs_employment_employee: bpjsEmploymentEmployee,
        taxable_income: taxableIncome,
        tax_brackets: bracketDetails,
        total_tax: totalTax,
        net_income: netIncome
      })

    } catch (error) {
      console.error('Calculation preview error:', error)
      // Clear calculation result on error
      setCalculationResult(null)
      // Optionally show an error message to the user
      setError('Failed to calculate tax preview. Please check your configuration.')
    }
  }

  const handleSave = async () => {
    if (!editedConfig) return

    const errors = validateConfiguration(editedConfig)
    const hasErrors = errors.some(e => e.severity === 'error')
    
    if (hasErrors) {
      setError('Please fix validation errors before saving')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const result = await taxConfigService.updateTaxConfiguration(
        editedConfig,
        'admin' // In real implementation, get from auth context
      )

      if (result.success) {
        setConfig(editedConfig)
        setHasChanges(false)
        setSuccess('Tax configuration updated successfully')
        await loadHistory()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to update configuration')
      }
    } catch (error: any) {
      setError('Failed to save configuration: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (config) {
      setEditedConfig({ ...config })
      setHasChanges(false)
      setError(null)
      setValidationErrors([])
    }
  }

  const handleInitializeDefaults = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Initializing database with default configuration...')
      
      // Use the new database initialization method
      const result = await taxConfigService.initializeDatabaseWithDefaults()
      
      if (result.success) {
        setSuccess('Database initialized with default tax configuration!')
        console.log('Database initialization successful, reloading configuration...')
        
        // Reload the configuration to reflect the new data
        await loadConfiguration()
        setHasChanges(false)
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      } else {
        console.error('Database initialization failed:', result.error)
        setError(result.error || 'Failed to initialize default configuration')
      }
    } catch (error: any) {
      console.error('Error initializing default configuration:', error)
      setError('Error initializing default configuration: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updatePTKP = (status: keyof TaxConfiguration['ptkp_amounts'], value: number) => {
    if (!editedConfig) return
    setEditedConfig({
      ...editedConfig,
      ptkp_amounts: {
        ...editedConfig.ptkp_amounts,
        [status]: value
      }
    })
  }

  const updateTaxBracket = (
    bracket: keyof TaxConfiguration['tax_brackets'], 
    field: 'min' | 'max' | 'rate', 
    value: number | null
  ) => {
    if (!editedConfig) return
    setEditedConfig({
      ...editedConfig,
      tax_brackets: {
        ...editedConfig.tax_brackets,
        [bracket]: {
          ...editedConfig.tax_brackets[bracket],
          [field]: value
        }
      }
    })
  }

  const updateBPJSRate = (path: string, value: number) => {
    if (!editedConfig) return
    
    const pathParts = path.split('.')
    const newBpjsRates = { ...editedConfig.bpjs_rates }
    
    // Navigate to the nested property and update it
    let current: any = newBpjsRates
    for (let i = 0; i < pathParts.length - 1; i++) {
      current[pathParts[i]] = { ...current[pathParts[i]] }
      current = current[pathParts[i]]
    }
    current[pathParts[pathParts.length - 1]] = value
    
    setEditedConfig({
      ...editedConfig,
      bpjs_rates: newBpjsRates
    })
  }

  const updateOccupationalCost = (field: 'rate' | 'max_monthly', value: number) => {
    if (!editedConfig) return
    setEditedConfig({
      ...editedConfig,
      occupational_cost: {
        ...editedConfig.occupational_cost,
        [field]: value
      }
    })
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const errorCount = useMemo(() => {
    return validationErrors.filter(e => e.severity === 'error').length
  }, [validationErrors])

  const warningCount = useMemo(() => {
    return validationErrors.filter(e => e.severity === 'warning').length
  }, [validationErrors])

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!config || !editedConfig) {
    return (
      <EmptyState
        icon={Settings}
        title="Configuration not found"
        description="Unable to load tax configuration"
        action={{
          label: "Retry",
          onClick: loadConfiguration
        }}
      />
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header */}
      <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Tax & BPJS Configuration
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage Indonesian tax brackets, PTKP amounts, and BPJS contribution rates
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <StatusBadge status={hasChanges ? "warning" : "success"}>
                  <Settings className="h-3 w-3 mr-1" />
                  {hasChanges ? "Unsaved Changes" : "Up to Date"}
                </StatusBadge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Effective: {new Date(config.effective_date).toLocaleDateString('id-ID')}
                </Badge>
                {validationErrors.length > 0 && (
                  <Badge variant={errorCount > 0 ? "destructive" : "secondary"} className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errorCount} errors, {warningCount} warnings
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ActionButton variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Preview
              </ActionButton>
              <ActionButton variant="secondary" size="sm" onClick={() => setCompareOpen(true)}>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </ActionButton>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Enhanced Statistics Dashboard */}
      {calculationResult && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ProfessionalCard variant="interactive" className="group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tax Efficiency</CardTitle>
                <div className="text-2xl font-bold text-gray-900">
                  {((calculationResult.total_tax / calculationResult.gross_income) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                Effective tax rate on gross income
              </div>
              <Progress value={((calculationResult.total_tax / calculationResult.gross_income) * 100)} className="h-1 mt-2" />
            </CardContent>
          </ProfessionalCard>

          <ProfessionalCard variant="interactive" className="group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">BPJS Total</CardTitle>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculationResult.bpjs_health_employee + calculationResult.bpjs_employment_employee)}
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                Annual employee contribution
              </div>
            </CardContent>
          </ProfessionalCard>

          <ProfessionalCard variant="interactive" className="group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Take Home</CardTitle>
                <div className="text-2xl font-bold text-gray-900">
                  {((calculationResult.net_income / calculationResult.gross_income) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                Net to gross ratio
              </div>
            </CardContent>
          </ProfessionalCard>

          <ProfessionalCard variant="interactive" className="group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxable Income</CardTitle>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculationResult.taxable_income)}
                </div>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                After deductions and PTKP
              </div>
            </CardContent>
          </ProfessionalCard>
        </div>
      )}

      {/* Validation Alerts */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.filter(e => e.severity === 'error').map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}
          {validationErrors.filter(e => e.severity === 'warning').map((error, index) => (
            <Alert key={index}>
              <Info className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('default configuration') && (
              <div className="mt-2">
                <ActionButton 
                  variant="outline" 
                  size="sm"
                  onClick={handleInitializeDefaults}
                  disabled={saving}
                  className="bg-white"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {saving ? 'Initializing...' : 'Initialize Database'}
                </ActionButton>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Action Bar */}
      <ProfessionalCard>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant={hasChanges ? "destructive" : "default"}>
                  {hasChanges ? "Unsaved Changes" : "Up to Date"}
                </Badge>
                <Badge variant="outline">
                  Effective: {new Date(config.effective_date).toLocaleDateString('id-ID')}
                </Badge>
              </div>
              {validationErrors.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errorCount} errors, {warningCount} warnings</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <ActionButton 
                variant="secondary" 
                onClick={handleReset}
                disabled={!hasChanges || saving}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleSave}
                disabled={!hasChanges || saving || errorCount > 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </ActionButton>
            </div>
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Enhanced Configuration Tabs */}
      <Tabs defaultValue="ptkp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ptkp">PTKP Amounts</TabsTrigger>
          <TabsTrigger value="tax">Tax Brackets</TabsTrigger>
          <TabsTrigger value="bpjs">BPJS Rates</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* PTKP Configuration - Enhanced */}
        <TabsContent value="ptkp" className="space-y-4">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>PTKP (Penghasilan Tidak Kena Pajak)</span>
                  </CardTitle>
                  <CardDescription>
                    Tax-free income amounts by marital status and dependents (annual amounts)
                  </CardDescription>
                </div>
                <ActionButton variant="secondary" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Guide
                </ActionButton>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editedConfig && editedConfig.ptkp_amounts && Object.entries(editedConfig.ptkp_amounts).map(([status, amount]) => {
                  const hasError = validationErrors.some(e => e.field === `ptkp_${status}`)
                  return (
                    <div key={status} className="space-y-3">
                      <Label htmlFor={`ptkp-${status}`} className="flex items-center justify-between">
                        <span>{status.replace('_', '/')} - {getPTKPDescription(status)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(amount.toString(), `ptkp-${status}`)}
                        >
                          {copiedField === `ptkp-${status}` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </Label>
                      <CurrencyInput
                        id={`ptkp-${status}`}
                        value={amount}
                        onChange={(value) => updatePTKP(status as any, value)}
                        className={cn(hasError && "border-red-500")}
                        placeholder="54000000"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          {formatCurrency(amount)} per year
                        </p>
                        <p className="text-xs text-muted-foreground pt-2">
                          Monthly: {formatCurrency(amount / 12)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* PTKP Impact Analysis */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Impact Analysis</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Tax Savings by Status</div>
                    <div className="space-y-1 text-xs">
                      {editedConfig && editedConfig.ptkp_amounts && Object.entries(editedConfig.ptkp_amounts).slice(0,3).map(([status, amount]) => {
                        const taxSaving = amount * 0.05 // Assuming 5% tax bracket
                        return (
                          <div key={status} className="flex justify-between">
                            <span>{status}:</span>
                            <span>{formatCurrency(taxSaving)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Coverage Distribution</div>
                    <div className="space-y-2">
                      
                      {editedConfig && editedConfig.ptkp_amounts && Object.entries(editedConfig.ptkp_amounts).slice(0, 3).map(([status, amount]) => (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{status}</span>
                            <span>{formatCurrency(amount)}</span>
                          </div>
                          <Progress value={((amount / Math.max(...Object.values(editedConfig.ptkp_amounts))) * 100)} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Tax Brackets - Enhanced */}
        <TabsContent value="tax" className="space-y-4">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>PPh 21 Tax Brackets</span>
                  </CardTitle>
                  <CardDescription>
                    Progressive tax rates for Indonesian income tax (annual income brackets)
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {editedConfig && editedConfig.tax_brackets && Object.keys(editedConfig.tax_brackets).length} brackets
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {editedConfig && editedConfig.tax_brackets && Object.entries(editedConfig.tax_brackets).map(([bracket, config], index) => {
                const hasError = validationErrors.some(e => e.field.startsWith(`tax_${bracket}`))
                return (
                  <div key={bracket} className={cn("border rounded-lg p-6 space-y-4", hasError && "border-red-300")}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-lg flex items-center space-x-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0 ? "bg-green-500" :
                          index === 1 ? "bg-yellow-500" :
                          index === 2 ? "bg-orange-500" : "bg-red-500"
                        )} />
                        <span>{bracket.replace('_', ' ').toUpperCase()}</span>
                      </h4>
                      <Badge variant="secondary">
                        {(config.rate * 100).toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Income (Rp)</Label>
                        <CurrencyInput
                          value={config.min}
                          onChange={(value) => updateTaxBracket(bracket as any, 'min', value)}
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-600">
                          {formatCurrency(config.min)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Income (Rp)</Label>
                        <Input
                          type="number"
                          value={config.max || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null
                            updateTaxBracket(bracket as any, 'max', value)
                          }}
                          placeholder="No limit"
                          className="text-right"
                        />
                        <p className="text-xs text-gray-600">
                          {config.max ? formatCurrency(config.max) : 'No limit'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <PercentageInput
                          value={config.rate}
                          onChange={(value) => updateTaxBracket(bracket as any, 'rate', value)}
                          minValue={0}
                          maxValue={1}
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Effective rate</span>
                          <span className="font-medium">{(config.rate * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Bracket Analysis */}
                    <div className="bg-gray-50 rounded p-4 space-y-2">
                      <div className="text-sm font-medium">Bracket Analysis</div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-600">Income Range:</span>
                          <div className="font-medium">
                            {formatCurrency(config.min)} - {config.max ? formatCurrency(config.max) : 'No limit'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Max Tax in Bracket:</span>
                          <div className="font-medium">
                            {config.max ? formatCurrency((config.max - config.min) * config.rate) : 'Unlimited'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* BPJS Configuration - Enhanced */}
        <TabsContent value="bpjs" className="space-y-4">
          <div className="space-y-6">
            {/* BPJS Kesehatan */}
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>BPJS Kesehatan</span>
                    </CardTitle>
                    <CardDescription>Health insurance contribution rates</CardDescription>
                  </div>
                  <Badge variant="outline">
                    Total: {editedConfig && editedConfig.bpjs_rates && ((editedConfig.bpjs_rates.health.employee_rate + editedConfig.bpjs_rates.health.company_rate) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label>Employee Rate (%)</Label>
                    <PercentageInput
                      value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.health.employee_rate : 0}
                      onChange={(value) => updateBPJSRate('health.employee_rate', value)}
                      minValue={0}
                      maxValue={0.1}
                    />
                    <div className="text-xs text-gray-600">
                      Employee contribution
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Company Rate (%)</Label>
                    <PercentageInput
                      value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.health.company_rate : 0}
                      onChange={(value) => updateBPJSRate('health.company_rate', value)}
                      minValue={0}
                      maxValue={0.1}
                    />
                    <div className="text-xs text-gray-600">
                      Company contribution
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Max Salary (Rp)</Label>
                    <CurrencyInput
                      value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.health.max_salary : 0}
                      onChange={(value) => updateBPJSRate('health.max_salary', value)}
                      placeholder="12000000"
                    />
                    <div className="text-xs text-gray-600">
                      {formatCurrency(editedConfig && editedConfig.bpjs_rates && editedConfig.bpjs_rates.health.max_salary)}
                    </div>
                  </div>
                </div>

                {/* Health BPJS Impact */}
                <Separator />
                <div className="bg-blue-50 rounded p-4">
                  <h4 className="font-medium mb-3">Impact Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Max Employee Contribution:</div>
                      <div className="font-medium">
                        {formatCurrency(editedConfig && editedConfig.bpjs_rates && editedConfig.bpjs_rates.health.max_salary * editedConfig.bpjs_rates.health.employee_rate)} / month
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Max Company Contribution:</div>
                      <div className="font-medium">
                        {formatCurrency(editedConfig && editedConfig.bpjs_rates && editedConfig.bpjs_rates.health.max_salary * editedConfig.bpjs_rates.health.company_rate)} / month
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* BPJS Ketenagakerjaan - Enhanced */}
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>BPJS Ketenagakerjaan</span>
                </CardTitle>
                <CardDescription>Employment social security contribution rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* JHT */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">JHT (Jaminan Hari Tua)</h4>
                    <Badge variant="outline" className="text-xs">Old Age Security</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>Employee Rate (%)</Label>
                      <PercentageInput
                        value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.employment.jht.employee_rate : 0}
                        onChange={(value) => updateBPJSRate('employment.jht.employee_rate', value)}
                        minValue={0}
                        maxValue={0.1}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Company Rate (%)</Label>
                      <PercentageInput
                        value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.employment.jht.company_rate : 0}
                        onChange={(value) => updateBPJSRate('employment.jht.company_rate', value)}
                        minValue={0}
                        maxValue={0.1}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* JP */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">JP (Jaminan Pensiun)</h4>
                    <Badge variant="outline" className="text-xs">Pension Security</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>Employee Rate (%)</Label>
                      <PercentageInput
                        value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.employment.jp.employee_rate : 0}
                        onChange={(value) => updateBPJSRate('employment.jp.employee_rate', value)}
                        minValue={0}
                        maxValue={0.1}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Company Rate (%)</Label>
                      <PercentageInput
                        value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.employment.jp.company_rate : 0}
                        onChange={(value) => updateBPJSRate('employment.jp.company_rate', value)}
                        minValue={0}
                        maxValue={0.1}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* JKK & JKM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Label>JKK Rate (%)</Label>
                      <Badge variant="outline" className="text-xs">Work Accident</Badge>
                    </div>
                    <PercentageInput
                      value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.employment.jkk_rate : 0}
                      onChange={(value) => updateBPJSRate('employment.jkk_rate', value)}
                      minValue={0}
                      maxValue={0.02}
                    />
                    <p className="text-xs text-gray-600">Company contribution only</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Label>JKM Rate (%)</Label>
                      <Badge variant="outline" className="text-xs">Death Benefit</Badge>
                    </div>
                    <PercentageInput
                      value={editedConfig && editedConfig.bpjs_rates ? editedConfig.bpjs_rates.employment.jkm_rate : 0}
                      onChange={(value) => updateBPJSRate('employment.jkm_rate', value)}
                      minValue={0}
                      maxValue={0.02}
                    />
                    <p className="text-xs text-gray-600">Company contribution only</p>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* Occupational Cost - Enhanced */}
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Occupational Cost (Biaya Jabatan)</span>
                </CardTitle>
                <CardDescription>Tax-deductible occupational expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Rate (%)</Label>
                    <PercentageInput
                      value={editedConfig && editedConfig.occupational_cost ? editedConfig.occupational_cost.rate : 0}
                      onChange={(value) => updateOccupationalCost('rate', value)}
                      minValue={0}
                      maxValue={1}
                    />
                    <div className="text-xs text-gray-600">
                      Percentage of gross income
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Max Monthly (Rp)</Label>
                    <CurrencyInput
                      value={editedConfig && editedConfig.occupational_cost ? editedConfig.occupational_cost.max_monthly : 0}
                      onChange={(value) => updateOccupationalCost('max_monthly', value)}
                      placeholder="500000"
                    />
                    <div className="text-xs text-gray-600">
                      {formatCurrency(editedConfig && editedConfig.occupational_cost && editedConfig.occupational_cost.max_monthly)} per month
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-amber-50 rounded p-4">
                  <h4 className="font-medium mb-3">Calculation Impact</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Max Deduction:</span>
                      <span className="font-medium">
                        {formatCurrency(editedConfig && editedConfig.occupational_cost && editedConfig.occupational_cost.max_monthly * 12)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate Cap:</span>
                      <span className="font-medium">
                        {(editedConfig && editedConfig.occupational_cost && editedConfig.occupational_cost.rate != null ? (editedConfig.occupational_cost.rate * 100).toFixed(1) : '0.0')}% of gross income
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Deduction is the minimum of rate calculation and maximum amount
                    </div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </TabsContent>

        {/* Live Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <PlayCircle className="h-5 w-5" />
                    <span>Live Tax Calculation Preview</span>
                  </CardTitle>
                  <CardDescription>
                    See how configuration changes affect tax calculations in real-time
                  </CardDescription>
                </div>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Live Updates</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="preview-salary">Monthly Salary (Rp)</Label>
                  <CurrencyInput
                    id="preview-salary"
                    value={previewSalary}
                    onChange={setPreviewSalary}
                    placeholder="15000000"
                  />
                  <div className="text-xs text-gray-600">
                    {formatCurrency(previewSalary)} per month
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="preview-ptkp">PTKP Status</Label>
                  <select
                    id="preview-ptkp"
                    value={previewPTKP}
                    onChange={(e) => setPreviewPTKP(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editedConfig && editedConfig.ptkp_amounts && Object.keys(editedConfig.ptkp_amounts).map((status) => (
                      <option key={status} value={status}>
                        {status} - {getPTKPDescription(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculation Results */}
              {calculationResult && (
                <div className="space-y-6">
                  <Separator />
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium">Gross Income</div>
                      <div className="text-lg font-bold text-green-900">
                        {formatCurrency(calculationResult.gross_income)}
                      </div>
                      <div className="text-xs text-green-600">Annual</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-sm text-red-600 font-medium">Total Tax</div>
                      <div className="text-lg font-bold text-red-900">
                        {formatCurrency(calculationResult.total_tax)}
                      </div>
                      <div className="text-xs text-red-600">
                        {((calculationResult.total_tax / calculationResult.gross_income) * 100).toFixed(1)}% effective rate
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 font-medium">Net Income</div>
                      <div className="text-lg font-bold text-blue-900">
                        {formatCurrency(calculationResult.net_income)}
                      </div>
                      <div className="text-xs text-blue-600">
                        {formatCurrency(calculationResult.net_income / 12)} monthly
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Calculation Breakdown</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Gross Income (Annual)</span>
                        <span className="font-medium">{formatCurrency(calculationResult.gross_income)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="ml-4">Less: Occupational Cost</span>
                        <span>({formatCurrency(calculationResult.occupational_cost)})</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="ml-4">Less: BPJS Health Employee</span>
                        <span>({formatCurrency(calculationResult.bpjs_health_employee)})</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="ml-4">Less: BPJS Employment Employee</span>
                        <span>({formatCurrency(calculationResult.bpjs_employment_employee)})</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="ml-4">Less: PTKP ({calculationResult.ptkp_status})</span>
                        <span>({formatCurrency(editedConfig.ptkp_amounts[calculationResult.ptkp_status as keyof typeof editedConfig.ptkp_amounts])})</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center font-medium">
                        <span>Taxable Income</span>
                        <span>{formatCurrency(calculationResult.taxable_income)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Brackets Breakdown */}
                  {calculationResult.tax_brackets.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Tax by Brackets</h4>
                      <div className="space-y-2">
                        {calculationResult.tax_brackets.map((bracket, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{bracket.bracket}</div>
                                <div className="text-xs text-gray-600">
                                  {formatCurrency(bracket.income_portion)} × {(bracket.tax_rate * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(bracket.tax_amount)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center font-bold bg-blue-50 rounded p-3">
                          <span>Total Tax</span>
                          <span>{formatCurrency(calculationResult.total_tax)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Enhanced History */}
        <TabsContent value="history" className="space-y-4">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Configuration History</span>
                  </CardTitle>
                  <CardDescription>
                    Track changes and compare different configuration versions
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {history.length} versions
                  </Badge>
                  <ActionButton variant="secondary" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export History
                  </ActionButton>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No history available"
                  description="Configuration changes will appear here as you make updates"
                />
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={index} className={cn(
                      "border rounded-lg p-4 transition-all",
                      index === 0 && "border-green-300 bg-green-50"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              Version {history.length - index}
                            </span>
                            {index === 0 && (
                              <StatusBadge status="success">
                                Current
                              </StatusBadge>
                            )}
                            {index === 1 && (
                              <Badge variant="outline" className="text-xs">
                                Previous
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(item.last_updated).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <ActionButton variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Effective Date:</div>
                          <div className="font-medium">
                            {new Date(item.effective_date).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Updated By:</div>
                          <div className="font-medium">{item.updated_by || 'System'}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Status:</div>
                          <StatusBadge status={index === 0 ? "success" : "inactive"}>
                            {index === 0 ? 'Current' : 'Historical'}
                          </StatusBadge>
                        </div>
                      </div>

                      {/* {item. && (
                        <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
                          <div className="text-gray-600 mb-1">Change Description:</div>
                          <div>{item.changes}</div>
                        </div>
                      )} */}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>
      </Tabs>

      {/* Calculation Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Tax Calculation Preview</DialogTitle>
            <DialogDescription>
              Interactive preview of tax calculations with current configuration
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Input Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="preview-modal-salary">Monthly Salary</Label>
                <CurrencyInput
                  id="preview-modal-salary"
                  value={previewSalary}
                  onChange={setPreviewSalary}
                  placeholder="15000000"
                />
                <div className="text-xs text-gray-600">
                  {formatCurrency(previewSalary)} per month
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-modal-ptkp">PTKP Status</Label>
                <select
                  id="preview-modal-ptkp"
                  value={previewPTKP}
                  onChange={(e) => setPreviewPTKP(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editedConfig?.ptkp_amounts && Object.keys(editedConfig.ptkp_amounts).map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', '/')} - {getPTKPDescription(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculation Results */}
            {calculationResult ? (
              <div className="space-y-4">
                {/* Summary Card */}
                <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Gross Income (Annual)</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(calculationResult.gross_income)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Total Tax (Annual)</div>
                        <div className="text-xl font-bold text-orange-600">
                          {formatCurrency(calculationResult.total_tax)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Net Income (Annual)</div>
                        <div className="text-xl font-bold text-blue-600">
                          {formatCurrency(calculationResult.net_income)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(calculationResult.net_income / 12)} per month
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Deductions */}
                  <ProfessionalCard>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <DollarSign className="h-5 w-5" />
                        <span>Deductions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>PTKP ({calculationResult.ptkp_status}):</span>
                        <span className="font-medium">
                          {formatCurrency(editedConfig?.ptkp_amounts?.[calculationResult.ptkp_status as keyof typeof editedConfig.ptkp_amounts] || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupational Cost:</span>
                        <span className="font-medium">
                          {formatCurrency(calculationResult.occupational_cost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>BPJS Health (Employee):</span>
                        <span className="font-medium">
                          {formatCurrency(calculationResult.bpjs_health_employee)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>BPJS Employment (Employee):</span>
                        <span className="font-medium">
                          {formatCurrency(calculationResult.bpjs_employment_employee)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Taxable Income:</span>
                        <span>{formatCurrency(calculationResult.taxable_income)}</span>
                      </div>
                    </CardContent>
                  </ProfessionalCard>

                  {/* Tax Calculation */}
                  <ProfessionalCard>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Calculator className="h-5 w-5" />
                        <span>Tax Brackets</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {calculationResult.tax_brackets.map((bracket, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{bracket.bracket} ({bracket.tax_rate * 100}%):</span>
                            <span className="font-medium">
                              {formatCurrency(bracket.tax_amount)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            On {formatCurrency(bracket.income_portion)}
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-medium text-orange-600">
                        <span>Total PPh 21:</span>
                        <span>{formatCurrency(calculationResult.total_tax)}</span>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                </div>

                {/* Effective Tax Rate */}
                <ProfessionalCard variant="elevated">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Effective Tax Rate</div>
                      <div className="text-2xl font-bold text-primary">
                        {((calculationResult.total_tax / calculationResult.gross_income) * 100).toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Based on gross annual income
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Enter salary and PTKP status to see tax calculation preview
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 mt-4">
            <ActionButton variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Comparison Modal */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="w-[95vw] sm:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Configuration Comparison</DialogTitle>
            <DialogDescription>
              Compare current configuration with previous versions
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Configuration Selection */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="compare-config-select">Select Configuration to Compare With</Label>
              <select
                id="compare-config-select"
                value={selectedHistoryConfig ? history.indexOf(selectedHistoryConfig) : ''}
                onChange={(e) => {
                  const index = parseInt(e.target.value)
                  setSelectedHistoryConfig(index >= 0 ? history[index] : null)
                }}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a historical configuration...</option>
                {history.map((historyItem, index) => (
                  <option key={index} value={index}>
                    Version {history.length - index} - {new Date(historyItem.last_updated).toLocaleDateString('id-ID')} by {historyItem.updated_by}
                  </option>
                ))}
              </select>
            </div>

            {/* Comparison Content */}
            {selectedHistoryConfig && editedConfig ? (
              <div className="space-y-6">
                {/* PTKP Comparison */}
                <ProfessionalCard>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>PTKP Amounts Comparison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-green-600 mb-3">Current Configuration</h4>
                        <div className="space-y-2">
                          {Object.entries(editedConfig.ptkp_amounts).map(([status, amount]) => (
                            <div key={status} className="flex justify-between text-sm">
                              <span>{status.replace('_', '/')}:</span>
                              <span className="font-medium">{formatCurrency(amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-600 mb-3">Selected Configuration</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedHistoryConfig.ptkp_amounts).map(([status, amount]) => {
                            const currentAmount = editedConfig.ptkp_amounts[status as keyof typeof editedConfig.ptkp_amounts]
                            const difference = currentAmount - amount
                            const percentChange = ((difference / amount) * 100)
                            
                            return (
                              <div key={status} className="flex justify-between text-sm">
                                <span>{status.replace('_', '/')}:</span>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(amount)}</div>
                                  {difference !== 0 && (
                                    <div className={cn(
                                      "text-xs",
                                      difference > 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                      {difference > 0 ? '+' : ''}{formatCurrency(difference)} ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>

                {/* Tax Brackets Comparison */}
                <ProfessionalCard>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Tax Brackets Comparison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(editedConfig.tax_brackets).map(([bracket, config]) => {
                        const historicalConfig = selectedHistoryConfig.tax_brackets[bracket as keyof typeof selectedHistoryConfig.tax_brackets]
                        const rateChange = ((config.rate - historicalConfig.rate) * 100)
                        
                        return (
                          <div key={bracket} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{bracket.replace('_', ' ').replace('bracket', 'Bracket')}</span>
                              <div className="text-sm text-gray-600">
                                {formatCurrency(config.min)} - {config.max ? formatCurrency(config.max) : 'unlimited'}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-green-600">Current Rate: {(config.rate * 100).toFixed(2)}%</div>
                              </div>
                              <div>
                                <div className="text-blue-600">Historical Rate: {(historicalConfig.rate * 100).toFixed(2)}%</div>
                                {rateChange !== 0 && (
                                  <div className={cn(
                                    "text-xs",
                                    rateChange > 0 ? "text-red-600" : "text-green-600"
                                  )}>
                                    {rateChange > 0 ? '+' : ''}{rateChange.toFixed(2)}% change
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </ProfessionalCard>

                {/* BPJS Rates Comparison */}
                <ProfessionalCard>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>BPJS Rates Comparison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">BPJS Health</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Employee Rate:</span>
                            <div className="text-right">
                              <div className="text-green-600">{(editedConfig.bpjs_rates.health.employee_rate * 100).toFixed(2)}%</div>
                              <div className="text-blue-600 text-xs">
                                vs {(selectedHistoryConfig.bpjs_rates.health.employee_rate * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span>Company Rate:</span>
                            <div className="text-right">
                              <div className="text-green-600">{(editedConfig.bpjs_rates.health.company_rate * 100).toFixed(2)}%</div>
                              <div className="text-blue-600 text-xs">
                                vs {(selectedHistoryConfig.bpjs_rates.health.company_rate * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Salary:</span>
                            <div className="text-right">
                              <div className="text-green-600">{formatCurrency(editedConfig.bpjs_rates.health.max_salary)}</div>
                              <div className="text-blue-600 text-xs">
                                vs {formatCurrency(selectedHistoryConfig.bpjs_rates.health.max_salary)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">BPJS Employment</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>JHT Employee:</span>
                            <div className="text-right">
                              <div className="text-green-600">{(editedConfig.bpjs_rates.employment.jht.employee_rate * 100).toFixed(2)}%</div>
                              <div className="text-blue-600 text-xs">
                                vs {(selectedHistoryConfig.bpjs_rates.employment.jht.employee_rate * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span>JP Employee:</span>
                            <div className="text-right">
                              <div className="text-green-600">{(editedConfig.bpjs_rates.employment.jp.employee_rate * 100).toFixed(2)}%</div>
                              <div className="text-blue-600 text-xs">
                                vs {(selectedHistoryConfig.bpjs_rates.employment.jp.employee_rate * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span>JKK Rate:</span>
                            <div className="text-right">
                              <div className="text-green-600">{(editedConfig.bpjs_rates.employment.jkk_rate * 100).toFixed(2)}%</div>
                              <div className="text-blue-600 text-xs">
                                vs {(selectedHistoryConfig.bpjs_rates.employment.jkk_rate * 100).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>

                {/* Impact Summary */}
                <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Impact Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Configuration Comparison Impact</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">PTKP Changes</div>
                          <div className="text-lg font-bold">
                            {Object.values(editedConfig.ptkp_amounts).reduce((acc, val, idx) => {
                              const historical = Object.values(selectedHistoryConfig.ptkp_amounts)[idx]
                              return acc + (val - historical)
                            }, 0) > 0 ? '↑' : '↓'} 
                            {Object.values(editedConfig.ptkp_amounts).filter((val, idx) => {
                              const historical = Object.values(selectedHistoryConfig.ptkp_amounts)[idx]
                              return val !== historical
                            }).length} Changed
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Tax Bracket Changes</div>
                          <div className="text-lg font-bold">
                            {Object.values(editedConfig.tax_brackets).filter((val, idx) => {
                              const historical = Object.values(selectedHistoryConfig.tax_brackets)[idx]
                              return val.rate !== historical.rate
                            }).length} Modified
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">BPJS Rate Changes</div>
                          <div className="text-lg font-bold">
                            {[
                              editedConfig.bpjs_rates.health.employee_rate !== selectedHistoryConfig.bpjs_rates.health.employee_rate,
                              editedConfig.bpjs_rates.health.company_rate !== selectedHistoryConfig.bpjs_rates.health.company_rate,
                              editedConfig.bpjs_rates.employment.jht.employee_rate !== selectedHistoryConfig.bpjs_rates.employment.jht.employee_rate,
                              editedConfig.bpjs_rates.employment.jp.employee_rate !== selectedHistoryConfig.bpjs_rates.employment.jp.employee_rate
                            ].filter(Boolean).length} Updated
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              </div>
            ) : (
              <div className="text-center py-8">
                <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Select a historical configuration to compare with current settings
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 mt-4">
            <ActionButton variant="outline" onClick={() => setCompareOpen(false)}>
              Close
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getPTKPDescription(status: string): string {
  const descriptions: Record<string, string> = {
    TK_0: 'Single, no dependents',
    TK_1: 'Single, 1 dependent',
    TK_2: 'Single, 2 dependents', 
    TK_3: 'Single, 3 dependents',
    K_0: 'Married, no dependents',
    K_1: 'Married, 1 dependent',
    K_2: 'Married, 2 dependents',
    K_3: 'Married, 3 dependents'
  }
  return descriptions[status] || ''
}