"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  Calendar
} from "lucide-react"
import { TaxConfigService, type TaxConfiguration } from "@/lib/services/tax-config"
import { formatCurrency } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"
import type { AppConfiguration } from "@/lib/types/database"

interface TaxConfigProps {
  className?: string
}

const taxConfigService = new TaxConfigService()

export function TaxConfig({ className }: TaxConfigProps) {
  const [config, setConfig] = useState<TaxConfiguration | null>(null)
  const [editedConfig, setEditedConfig] = useState<TaxConfiguration | null>(null)
  const [history, setHistory] = useState<AppConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadConfiguration()
    loadHistory()
  }, [])

  useEffect(() => {
    if (config && editedConfig) {
      const hasChanges = JSON.stringify(config) !== JSON.stringify(editedConfig)
      setHasChanges(hasChanges)
    }
  }, [config, editedConfig])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      const currentConfig = await taxConfigService.getCurrentTaxConfiguration()
      setConfig(currentConfig)
      setEditedConfig(currentConfig)
    } catch (error: any) {
      setError('Failed to load tax configuration: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const configHistory = await taxConfigService.getConfigurationHistory(5)
      setHistory(configHistory)
    } catch (error: any) {
      console.error('Failed to load configuration history:', error)
    }
  }

  const handleSave = async () => {
    if (!editedConfig) return

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

  if (!config || !editedConfig) {
    return (
      <EmptyState
        icon={Settings}
        title="Configuration not found"
        description="Unable to load tax configuration"
      />
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <ProfessionalCard>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Tax & BPJS Configuration</span>
          </CardTitle>
          <CardDescription>
            Manage Indonesian tax brackets, PTKP amounts, and BPJS contribution rates
          </CardDescription>
        </CardHeader>
      </ProfessionalCard>

      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant={hasChanges ? "destructive" : "default"}>
            {hasChanges ? "Unsaved Changes" : "Up to Date"}
          </Badge>
          <Badge variant="outline">
            Effective: {new Date(config.effective_date).toLocaleDateString('id-ID')}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!hasChanges || saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <ActionButton
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </ActionButton>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="ptkp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ptkp">PTKP Amounts</TabsTrigger>
          <TabsTrigger value="tax">Tax Brackets</TabsTrigger>
          <TabsTrigger value="bpjs">BPJS Rates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* PTKP Configuration */}
        <TabsContent value="ptkp" className="space-y-4">
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>PTKP (Penghasilan Tidak Kena Pajak)</span>
              </CardTitle>
              <CardDescription>
                Tax-free income amounts by marital status and dependents (annual amounts)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(editedConfig.ptkp_amounts).map(([status, amount]) => (
                  <div key={status} className="space-y-2">
                    <Label htmlFor={`ptkp-${status}`}>
                      {status.replace('_', '/')} - {getPTKPDescription(status)}
                    </Label>
                    <Input
                      id={`ptkp-${status}`}
                      type="number"
                      value={amount}
                      onChange={(e) => updatePTKP(status as any, parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                    <p className="text-xs text-gray-600">
                      {formatCurrency(amount)} per year
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Tax Brackets Configuration */}
        <TabsContent value="tax" className="space-y-4">
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>PPh 21 Tax Brackets</span>
              </CardTitle>
              <CardDescription>
                Progressive tax rates for Indonesian income tax (annual income brackets)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(editedConfig.tax_brackets).map(([bracket, config]) => (
                <div key={bracket} className="border rounded p-4 space-y-4">
                  <h4 className="font-medium">
                    {bracket.replace('_', ' ').toUpperCase()} - {(config.rate * 100)}%
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum (Rp)</Label>
                      <Input
                        type="number"
                        value={config.min}
                        onChange={(e) => updateTaxBracket(bracket as any, 'min', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                      <p className="text-xs text-gray-600">
                        {formatCurrency(config.min)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum (Rp)</Label>
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
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={config.rate * 100}
                        onChange={(e) => updateTaxBracket(bracket as any, 'rate', (parseFloat(e.target.value) || 0) / 100)}
                        className="text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* BPJS Configuration */}
        <TabsContent value="bpjs" className="space-y-4">
          <div className="space-y-4">
            {/* BPJS Kesehatan */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>BPJS Kesehatan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Employee Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedConfig.bpjs_rates.health.employee_rate * 100}
                      onChange={(e) => updateBPJSRate('health.employee_rate', (parseFloat(e.target.value) || 0) / 100)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedConfig.bpjs_rates.health.company_rate * 100}
                      onChange={(e) => updateBPJSRate('health.company_rate', (parseFloat(e.target.value) || 0) / 100)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Salary (Rp)</Label>
                    <Input
                      type="number"
                      value={editedConfig.bpjs_rates.health.max_salary}
                      onChange={(e) => updateBPJSRate('health.max_salary', parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                    <p className="text-xs text-gray-600">
                      {formatCurrency(editedConfig.bpjs_rates.health.max_salary)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* BPJS Ketenagakerjaan */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle>BPJS Ketenagakerjaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* JHT */}
                <div className="space-y-2">
                  <h4 className="font-medium">JHT (Jaminan Hari Tua)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedConfig.bpjs_rates.employment.jht.employee_rate * 100}
                        onChange={(e) => updateBPJSRate('employment.jht.employee_rate', (parseFloat(e.target.value) || 0) / 100)}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedConfig.bpjs_rates.employment.jht.company_rate * 100}
                        onChange={(e) => updateBPJSRate('employment.jht.company_rate', (parseFloat(e.target.value) || 0) / 100)}
                        className="text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* JP */}
                <div className="space-y-2">
                  <h4 className="font-medium">JP (Jaminan Pensiun)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedConfig.bpjs_rates.employment.jp.employee_rate * 100}
                        onChange={(e) => updateBPJSRate('employment.jp.employee_rate', (parseFloat(e.target.value) || 0) / 100)}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedConfig.bpjs_rates.employment.jp.company_rate * 100}
                        onChange={(e) => updateBPJSRate('employment.jp.company_rate', (parseFloat(e.target.value) || 0) / 100)}
                        className="text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* JKK & JKM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>JKK Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedConfig.bpjs_rates.employment.jkk_rate * 100}
                      onChange={(e) => updateBPJSRate('employment.jkk_rate', (parseFloat(e.target.value) || 0) / 100)}
                      className="text-right"
                    />
                    <p className="text-xs text-gray-600">Jaminan Kecelakaan Kerja</p>
                  </div>
                  <div className="space-y-2">
                    <Label>JKM Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedConfig.bpjs_rates.employment.jkm_rate * 100}
                      onChange={(e) => updateBPJSRate('employment.jkm_rate', (parseFloat(e.target.value) || 0) / 100)}
                      className="text-right"
                    />
                    <p className="text-xs text-gray-600">Jaminan Kematian</p>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* Occupational Cost */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle>Occupational Cost (Biaya Jabatan)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedConfig.occupational_cost.rate * 100}
                      onChange={(e) => updateOccupationalCost('rate', (parseFloat(e.target.value) || 0) / 100)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Monthly (Rp)</Label>
                    <Input
                      type="number"
                      value={editedConfig.occupational_cost.max_monthly}
                      onChange={(e) => updateOccupationalCost('max_monthly', parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                    <p className="text-xs text-gray-600">
                      {formatCurrency(editedConfig.occupational_cost.max_monthly)} per month
                    </p>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          <ProfessionalCard>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Configuration History</span>
              </CardTitle>
              <CardDescription>
                Recent changes to tax configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No history available"
                  description="Configuration changes will appear here"
                />
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          Configuration {item.is_active ? '(Active)' : ''}
                        </span>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={item.is_active ? "success" : "inactive"}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </StatusBadge>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Effective: {new Date(item.effective_date).toLocaleDateString('id-ID')}</div>
                        <div>Updated by: {item.updated_by || 'System'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>
      </Tabs>
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