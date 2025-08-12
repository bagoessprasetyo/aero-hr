import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
import type { AppConfiguration } from '@/lib/types/database'

export interface TaxConfiguration {
  // PTKP (Penghasilan Tidak Kena Pajak) amounts
  ptkp_amounts: {
    TK_0: number  // Tidak Kawin, 0 tanggungan
    TK_1: number  // Tidak Kawin, 1 tanggungan
    TK_2: number  // Tidak Kawin, 2 tanggungan
    TK_3: number  // Tidak Kawin, 3 tanggungan
    K_0: number   // Kawin, 0 tanggungan
    K_1: number   // Kawin, 1 tanggungan
    K_2: number   // Kawin, 2 tanggungan
    K_3: number   // Kawin, 3 tanggungan
  }
  
  // PPh 21 tax brackets
  tax_brackets: {
    bracket_1: { min: number; max: number; rate: number } // 5%
    bracket_2: { min: number; max: number; rate: number } // 15%
    bracket_3: { min: number; max: number; rate: number } // 25%
    bracket_4: { min: number; max: number; rate: number } // 30%
    bracket_5: { min: number; max: number | null; rate: number } // 35%
  }
  
  // BPJS contribution rates
  bpjs_rates: {
    health: {
      employee_rate: number
      company_rate: number
      max_salary: number
    }
    employment: {
      jht: { employee_rate: number; company_rate: number }
      jp: { employee_rate: number; company_rate: number }
      jkk_rate: number
      jkm_rate: number
    }
  }
  
  // Other tax settings
  occupational_cost: {
    rate: number
    max_monthly: number
  }
  
  // System settings
  effective_date: string
  last_updated: string
  updated_by: string
}

export class TaxConfigService {
  async getCurrentTaxConfiguration(): Promise<TaxConfiguration> {
    try {
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration found, return defaults
          return this.getDefaultConfiguration()
        }
        throw error
      }

      return this.parseConfiguration(data)
    } catch (error) {
      console.error('Error fetching tax configuration:', error)
      return this.getDefaultConfiguration()
    }
  }

  private getDefaultConfiguration(): TaxConfiguration {
    return {
      ptkp_amounts: {
        TK_0: 54000000,   // 54 juta per tahun
        TK_1: 58500000,   // 58.5 juta per tahun
        TK_2: 63000000,   // 63 juta per tahun
        TK_3: 67500000,   // 67.5 juta per tahun
        K_0: 58500000,    // 58.5 juta per tahun
        K_1: 63000000,    // 63 juta per tahun
        K_2: 67500000,    // 67.5 juta per tahun
        K_3: 72000000     // 72 juta per tahun
      },
      tax_brackets: {
        bracket_1: { min: 0, max: 60000000, rate: 0.05 },        // 5%
        bracket_2: { min: 60000000, max: 250000000, rate: 0.15 }, // 15%
        bracket_3: { min: 250000000, max: 500000000, rate: 0.25 }, // 25%
        bracket_4: { min: 500000000, max: 5000000000, rate: 0.30 }, // 30%
        bracket_5: { min: 5000000000, max: null, rate: 0.35 }    // 35%
      },
      bpjs_rates: {
        health: {
          employee_rate: 0.01,  // 1%
          company_rate: 0.04,   // 4%
          max_salary: 12000000  // 12 juta cap
        },
        employment: {
          jht: { employee_rate: 0.02, company_rate: 0.037 }, // 2% & 3.7%
          jp: { employee_rate: 0.01, company_rate: 0.02 },   // 1% & 2%
          jkk_rate: 0.0024,  // 0.24%
          jkm_rate: 0.003    // 0.3%
        }
      },
      occupational_cost: {
        rate: 0.05,        // 5%
        max_monthly: 500000 // 500 ribu per bulan
      },
      effective_date: new Date().toISOString().split('T')[0],
      last_updated: new Date().toISOString(),
      updated_by: 'system'
    }
  }

  private parseConfiguration(data: AppConfiguration): TaxConfiguration {
    try {
      return {
        ptkp_amounts: data.ptkp_amounts as any,
        tax_brackets: data.tax_brackets as any,
        bpjs_rates: data.bpjs_rates as any,
        occupational_cost: data.occupational_cost as any,
        effective_date: data.effective_date,
        last_updated: data.updated_at,
        updated_by: data.updated_by || 'system'
      }
    } catch (error) {
      console.error('Error parsing tax configuration:', error)
      return this.getDefaultConfiguration()
    }
  }

  async updateTaxConfiguration(
    config: Partial<TaxConfiguration>, 
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get current configuration
      const currentConfig = await this.getCurrentTaxConfiguration()
      
      // Merge with updates
      const updatedConfig = {
        ...currentConfig,
        ...config,
        last_updated: new Date().toISOString(),
        updated_by: updatedBy
      }

      // Validate the configuration
      const validation = this.validateConfiguration(updatedConfig)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Deactivate current configuration
      await supabase
        .from('app_configuration')
        .update({ is_active: false })
        .eq('is_active', true)

      // Insert new configuration
      const { error } = await supabase
        .from('app_configuration')
        .insert({
          ptkp_amounts: updatedConfig.ptkp_amounts,
          tax_brackets: updatedConfig.tax_brackets,
          bpjs_rates: updatedConfig.bpjs_rates,
          occupational_cost: updatedConfig.occupational_cost,
          effective_date: updatedConfig.effective_date,
          updated_by: updatedBy,
          is_active: true
        })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error updating tax configuration:', error)
      return { success: false, error: error.message }
    }
  }

  private validateConfiguration(config: TaxConfiguration): { isValid: boolean; error?: string } {
    try {
      // Validate PTKP amounts
      const ptkpValues = Object.values(config.ptkp_amounts)
      if (ptkpValues.some(val => val <= 0 || val > 200000000)) {
        return { isValid: false, error: 'PTKP amounts must be between 0 and 200 million' }
      }

      // Validate tax brackets
      const brackets = Object.values(config.tax_brackets)
      for (const bracket of brackets) {
        if (bracket.rate < 0 || bracket.rate > 1) {
          return { isValid: false, error: 'Tax rates must be between 0 and 1' }
        }
        if (bracket.min < 0) {
          return { isValid: false, error: 'Tax bracket minimums must be non-negative' }
        }
        if (bracket.max !== null && bracket.max <= bracket.min) {
          return { isValid: false, error: 'Tax bracket maximums must be greater than minimums' }
        }
      }

      // Validate BPJS rates
      const bpjs = config.bpjs_rates
      if (bpjs.health.employee_rate < 0 || bpjs.health.employee_rate > 0.1) {
        return { isValid: false, error: 'BPJS Health employee rate must be between 0 and 10%' }
      }
      if (bpjs.health.company_rate < 0 || bpjs.health.company_rate > 0.1) {
        return { isValid: false, error: 'BPJS Health company rate must be between 0 and 10%' }
      }
      if (bpjs.health.max_salary <= 0 || bpjs.health.max_salary > 50000000) {
        return { isValid: false, error: 'BPJS Health max salary must be between 0 and 50 million' }
      }

      // Validate employment BPJS rates
      const emp = bpjs.employment
      if (emp.jht.employee_rate < 0 || emp.jht.employee_rate > 0.1) {
        return { isValid: false, error: 'JHT employee rate must be between 0 and 10%' }
      }
      if (emp.jht.company_rate < 0 || emp.jht.company_rate > 0.1) {
        return { isValid: false, error: 'JHT company rate must be between 0 and 10%' }
      }
      if (emp.jp.employee_rate < 0 || emp.jp.employee_rate > 0.1) {
        return { isValid: false, error: 'JP employee rate must be between 0 and 10%' }
      }
      if (emp.jp.company_rate < 0 || emp.jp.company_rate > 0.1) {
        return { isValid: false, error: 'JP company rate must be between 0 and 10%' }
      }
      if (emp.jkk_rate < 0 || emp.jkk_rate > 0.02) {
        return { isValid: false, error: 'JKK rate must be between 0 and 2%' }
      }
      if (emp.jkm_rate < 0 || emp.jkm_rate > 0.02) {
        return { isValid: false, error: 'JKM rate must be between 0 and 2%' }
      }

      // Validate occupational cost
      if (config.occupational_cost.rate < 0 || config.occupational_cost.rate > 1) {
        return { isValid: false, error: 'Occupational cost rate must be between 0 and 100%' }
      }
      if (config.occupational_cost.max_monthly <= 0) {
        return { isValid: false, error: 'Occupational cost max monthly must be greater than 0' }
      }

      return { isValid: true }
    } catch (error: any) {
      return { isValid: false, error: error.message }
    }
  }

  async getConfigurationHistory(limit: number = 10): Promise<AppConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching configuration history:', error)
      return []
    }
  }

  async getPTKPAmount(status: string): Promise<number> {
    try {
      const config = await this.getCurrentTaxConfiguration()
      const ptkpKey = status.replace('/', '_') as keyof typeof config.ptkp_amounts
      return config.ptkp_amounts[ptkpKey] || config.ptkp_amounts.TK_0
    } catch (error) {
      console.error('Error getting PTKP amount:', error)
      return 54000000 // Default TK/0
    }
  }

  async getTaxBrackets() {
    try {
      const config = await this.getCurrentTaxConfiguration()
      return config.tax_brackets
    } catch (error) {
      console.error('Error getting tax brackets:', error)
      return this.getDefaultConfiguration().tax_brackets
    }
  }

  async getBPJSRates() {
    try {
      const config = await this.getCurrentTaxConfiguration()
      return config.bpjs_rates
    } catch (error) {
      console.error('Error getting BPJS rates:', error)
      return this.getDefaultConfiguration().bpjs_rates
    }
  }

  async getOccupationalCostSettings() {
    try {
      const config = await this.getCurrentTaxConfiguration()
      return config.occupational_cost
    } catch (error) {
      console.error('Error getting occupational cost settings:', error)
      return this.getDefaultConfiguration().occupational_cost
    }
  }
}