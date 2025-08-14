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
      console.log('Fetching tax configuration from key-value structure...')
      
      // Get all active configuration entries
      const { data, error } = await supabase
        .from('app_configuration')
        .select('key, value')
        .eq('is_active', true)

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.log('No configuration found, returning defaults')
        return this.getDefaultConfiguration()
      }

      console.log('Raw configuration data from database:', data)
      return this.parseKeyValueConfiguration(data)
    } catch (error) {
      console.error('Error fetching tax configuration:', error)
      return this.getDefaultConfiguration()
    }
  }

  private parseKeyValueConfiguration(data: { key: string; value: string }[]): TaxConfiguration {
    console.log('Parsing key-value configuration:', data)
    
    // Convert array to key-value map
    const configMap = data.reduce((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {} as Record<string, string>)
    
    console.log('Configuration map:', configMap)
    
    // Helper function to safely parse JSON or return default
    const safeParseValue = (key: string, defaultValue: any) => {
      try {
        const value = configMap[key]
        if (!value) return defaultValue
        
        // Try to parse as number first
        if (!isNaN(Number(value))) {
          return Number(value)
        }
        
        // Try to parse as JSON
        return JSON.parse(value)
      } catch (error) {
        console.warn(`Error parsing ${key}:`, error)
        return defaultValue
      }
    }
    
    const defaultConfig = this.getDefaultConfiguration()
    
    // Parse PTKP amounts
    const ptkp_amounts = {
      TK_0: safeParseValue('ptkp_TK_0', defaultConfig.ptkp_amounts.TK_0),
      TK_1: safeParseValue('ptkp_TK_1', defaultConfig.ptkp_amounts.TK_1),
      TK_2: safeParseValue('ptkp_TK_2', defaultConfig.ptkp_amounts.TK_2),
      TK_3: safeParseValue('ptkp_TK_3', defaultConfig.ptkp_amounts.TK_3),
      K_0: safeParseValue('ptkp_K_0', defaultConfig.ptkp_amounts.K_0),
      K_1: safeParseValue('ptkp_K_1', defaultConfig.ptkp_amounts.K_1),
      K_2: safeParseValue('ptkp_K_2', defaultConfig.ptkp_amounts.K_2),
      K_3: safeParseValue('ptkp_K_3', defaultConfig.ptkp_amounts.K_3)
    }
    
    // Parse tax brackets
    const tax_brackets = {
      bracket_1: safeParseValue('tax_bracket_1', defaultConfig.tax_brackets.bracket_1),
      bracket_2: safeParseValue('tax_bracket_2', defaultConfig.tax_brackets.bracket_2),
      bracket_3: safeParseValue('tax_bracket_3', defaultConfig.tax_brackets.bracket_3),
      bracket_4: safeParseValue('tax_bracket_4', defaultConfig.tax_brackets.bracket_4),
      bracket_5: safeParseValue('tax_bracket_5', defaultConfig.tax_brackets.bracket_5)
    }
    
    // Parse BPJS rates
    const bpjs_rates = {
      health: {
        employee_rate: safeParseValue('bpjs_health_employee_rate', defaultConfig.bpjs_rates.health.employee_rate),
        company_rate: safeParseValue('bpjs_health_company_rate', defaultConfig.bpjs_rates.health.company_rate),
        max_salary: safeParseValue('bpjs_health_max_salary', defaultConfig.bpjs_rates.health.max_salary)
      },
      employment: {
        jht: {
          employee_rate: safeParseValue('bpjs_jht_employee_rate', defaultConfig.bpjs_rates.employment.jht.employee_rate),
          company_rate: safeParseValue('bpjs_jht_company_rate', defaultConfig.bpjs_rates.employment.jht.company_rate)
        },
        jp: {
          employee_rate: safeParseValue('bpjs_jp_employee_rate', defaultConfig.bpjs_rates.employment.jp.employee_rate),
          company_rate: safeParseValue('bpjs_jp_company_rate', defaultConfig.bpjs_rates.employment.jp.company_rate)
        },
        jkk_rate: safeParseValue('bpjs_jkk_rate', defaultConfig.bpjs_rates.employment.jkk_rate),
        jkm_rate: safeParseValue('bpjs_jkm_rate', defaultConfig.bpjs_rates.employment.jkm_rate)
      }
    }
    
    // Parse occupational cost
    const occupational_cost = {
      rate: safeParseValue('occupational_cost_rate', defaultConfig.occupational_cost.rate),
      max_monthly: safeParseValue('occupational_cost_max_monthly', defaultConfig.occupational_cost.max_monthly)
    }
    
    // Parse system fields
    const effective_date = configMap['effective_date'] || defaultConfig.effective_date
    const last_updated = configMap['last_updated'] || defaultConfig.last_updated
    const updated_by = configMap['updated_by'] || defaultConfig.updated_by
    
    const parsedConfig = {
      ptkp_amounts,
      tax_brackets,
      bpjs_rates,
      occupational_cost,
      effective_date,
      last_updated,
      updated_by
    }
    
    console.log('Parsed configuration:', parsedConfig)
    return parsedConfig
  }

  getDefaultConfiguration(): TaxConfiguration {
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

  // Debug method to inspect database data
  async debugDatabaseConfiguration(): Promise<any> {
    try {
      console.log('Debugging database configuration...')
      
      // Check if table exists and get all configurations
      const { data: allConfigs, error: allError } = await supabase
        .from('app_configuration')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('All configurations in database:', allConfigs)
      console.log('Database query error:', allError)
      
      // Check specifically for active configuration
      const { data: activeConfig, error: activeError } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
      
      console.log('Active configuration:', activeConfig)
      console.log('Active query error:', activeError)
      
      return {
        allConfigs,
        allError,
        activeConfig,
        activeError
      }
    } catch (error) {
      console.error('Debug method error:', error)
      return { error }
    }
  }

  private convertConfigToKeyValuePairs(config: TaxConfiguration): { key: string; value: string }[] {
    const pairs: { key: string; value: string }[] = []
    
    // PTKP amounts
    Object.entries(config.ptkp_amounts).forEach(([key, value]) => {
      pairs.push({ key: `ptkp_${key}`, value: value.toString() })
    })
    
    // Tax brackets
    Object.entries(config.tax_brackets).forEach(([key, value]) => {
      pairs.push({ key: `tax_${key}`, value: JSON.stringify(value) })
    })
    
    // BPJS rates
    pairs.push({ key: 'bpjs_health_employee_rate', value: config.bpjs_rates.health.employee_rate.toString() })
    pairs.push({ key: 'bpjs_health_company_rate', value: config.bpjs_rates.health.company_rate.toString() })
    pairs.push({ key: 'bpjs_health_max_salary', value: config.bpjs_rates.health.max_salary.toString() })
    
    pairs.push({ key: 'bpjs_jht_employee_rate', value: config.bpjs_rates.employment.jht.employee_rate.toString() })
    pairs.push({ key: 'bpjs_jht_company_rate', value: config.bpjs_rates.employment.jht.company_rate.toString() })
    pairs.push({ key: 'bpjs_jp_employee_rate', value: config.bpjs_rates.employment.jp.employee_rate.toString() })
    pairs.push({ key: 'bpjs_jp_company_rate', value: config.bpjs_rates.employment.jp.company_rate.toString() })
    pairs.push({ key: 'bpjs_jkk_rate', value: config.bpjs_rates.employment.jkk_rate.toString() })
    pairs.push({ key: 'bpjs_jkm_rate', value: config.bpjs_rates.employment.jkm_rate.toString() })
    
    // Occupational cost
    pairs.push({ key: 'occupational_cost_rate', value: config.occupational_cost.rate.toString() })
    pairs.push({ key: 'occupational_cost_max_monthly', value: config.occupational_cost.max_monthly.toString() })
    
    // System fields
    pairs.push({ key: 'effective_date', value: config.effective_date })
    pairs.push({ key: 'last_updated', value: config.last_updated })
    pairs.push({ key: 'updated_by', value: config.updated_by })
    
    return pairs
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

      // Deactivate current configuration entries
      await supabase
        .from('app_configuration')
        .update({ is_active: false })
        .eq('is_active', true)

      // Convert config to key-value pairs
      const keyValuePairs = this.convertConfigToKeyValuePairs(updatedConfig)
      
      // Insert new configuration entries
      const configEntries = keyValuePairs.map(pair => ({
        key: pair.key,
        value: pair.value,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('app_configuration')
        .insert(configEntries)

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

  async getConfigurationHistory(limit: number = 10): Promise<TaxConfiguration[]> {
    try {
      // Get distinct configuration timestamps
      const { data: timestamps, error: timestampError } = await supabase
        .from('app_configuration')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(limit * 50) // Get more records to account for multiple keys per config

      if (timestampError) throw timestampError
      
      // Get unique timestamps (each config update creates multiple rows)
      const uniqueTimestamps = [...new Set(timestamps?.map(t => t.created_at))].slice(0, limit)
      
      const configurations: TaxConfiguration[] = []
      
      // For each timestamp, get all configuration entries
      for (const timestamp of uniqueTimestamps) {
        const { data: configData, error } = await supabase
          .from('app_configuration')
          .select('key, value, created_at, updated_at')
          .eq('created_at', timestamp)

        if (error) continue // Skip failed entries
        
        if (configData && configData.length > 0) {
          try {
            const config = this.parseKeyValueConfiguration(configData)
            configurations.push(config)
          } catch (parseError) {
            console.warn('Error parsing historical configuration:', parseError)
          }
        }
      }

      return configurations
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

  async initializeDatabaseWithDefaults(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Initializing database with default tax configuration...')
      
      // Check if there's any existing configuration
      const { data: existingData, error: checkError } = await supabase
        .from('app_configuration')
        .select('id')
        .limit(1)

      if (checkError) {
        console.error('Error checking existing configuration:', checkError)
        throw checkError
      }

      if (existingData && existingData.length > 0) {
        console.log('Configuration already exists, skipping initialization')
        return { success: true }
      }

      // Get default configuration
      const defaultConfig = this.getDefaultConfiguration()
      
      // Convert to key-value pairs
      const keyValuePairs = this.convertConfigToKeyValuePairs(defaultConfig)
      
      // Insert configuration entries
      const configEntries = keyValuePairs.map(pair => ({
        key: pair.key,
        value: pair.value,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('app_configuration')
        .insert(configEntries)

      if (insertError) {
        console.error('Error inserting default configuration:', insertError)
        throw insertError
      }

      console.log('Successfully initialized database with default tax configuration')
      return { success: true }
    } catch (error: any) {
      console.error('Error initializing database with defaults:', error)
      return { success: false, error: error.message }
    }
  }

  async reinitializeDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Reinitializing database with fresh default configuration...')
      
      // Delete all existing configuration
      const { error: deleteError } = await supabase
        .from('app_configuration')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

      if (deleteError) {
        console.error('Error clearing existing configuration:', deleteError)
        throw deleteError
      }

      // Initialize with defaults
      return await this.initializeDatabaseWithDefaults()
    } catch (error: any) {
      console.error('Error reinitializing database:', error)
      return { success: false, error: error.message }
    }
  }
}