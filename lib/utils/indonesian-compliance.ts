import type { PTKPStatus } from '@/lib/types/database'
import type { ReportFormatting, ExportOptions } from '@/lib/types/tax-reports'

// Indonesian locale formatting utilities
export const INDONESIAN_LOCALE = 'id-ID'
export const INDONESIAN_CURRENCY = 'IDR'

// Default Indonesian formatting settings
export const DEFAULT_INDONESIAN_FORMATTING: ReportFormatting = {
  currency: 'IDR',
  date_format: 'DD/MM/YYYY',
  number_format: 'id-ID',
  decimal_places: 0,
  thousands_separator: '.',
  decimal_separator: ','
}

/**
 * Format Indonesian Rupiah currency
 */
export function formatIDR(amount: number, options?: {
  showSymbol?: boolean
  showDecimals?: boolean
}): string {
  const { showSymbol = true, showDecimals = false } = options || {}
  
  const formatted = new Intl.NumberFormat(INDONESIAN_LOCALE, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: INDONESIAN_CURRENCY,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)

  return formatted
}

/**
 * Format Indonesian date
 */
export function formatIndonesianDate(
  date: string | Date,
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    default:
      return `${day}/${month}/${year}`
  }
}

/**
 * Format Indonesian number with proper separators
 */
export function formatIndonesianNumber(
  number: number,
  decimalPlaces: number = 0
): string {
  return new Intl.NumberFormat(INDONESIAN_LOCALE, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number)
}

/**
 * Get Indonesian month name
 */
export function getIndonesianMonthName(month: number): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return monthNames[month - 1] || 'Invalid Month'
}

/**
 * Get PTKP status description in Indonesian
 */
export function getPTKPStatusDescription(status: PTKPStatus): string {
  const descriptions: Record<PTKPStatus, string> = {
    'TK/0': 'Tidak Kawin, tanpa tanggungan',
    'TK/1': 'Tidak Kawin, 1 tanggungan',
    'TK/2': 'Tidak Kawin, 2 tanggungan',
    'TK/3': 'Tidak Kawin, 3 tanggungan',
    'K/0': 'Kawin, tanpa tanggungan',
    'K/1': 'Kawin, 1 tanggungan',
    'K/2': 'Kawin, 2 tanggungan',
    'K/3': 'Kawin, 3 tanggungan'
  }
  return descriptions[status] || status
}

/**
 * Validate Indonesian NIK (Nomor Induk Kependudukan)
 */
export function validateNIK(nik: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Basic format check
  if (!nik || nik.length !== 16) {
    errors.push('NIK harus terdiri dari 16 digit')
  }
  
  if (!/^\d{16}$/.test(nik)) {
    errors.push('NIK hanya boleh berisi angka')
  }
  
  // Additional validation could be added here
  // - Province code validation (first 2 digits)
  // - District code validation (digits 3-4)
  // - Subdistrict code validation (digits 5-6)
  // - Birth date validation (digits 7-12)
  // - Gender validation (day +40 for female)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate Indonesian NPWP (Nomor Pokok Wajib Pajak)
 */
export function validateNPWP(npwp: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Remove dots and dashes for validation
  const cleanNPWP = npwp.replace(/[.-]/g, '')
  
  // Basic format check
  if (!cleanNPWP || cleanNPWP.length !== 15) {
    errors.push('NPWP harus terdiri dari 15 digit')
  }
  
  if (!/^\d{15}$/.test(cleanNPWP)) {
    errors.push('NPWP hanya boleh berisi angka')
  }
  
  // Check format pattern (XX.XXX.XXX.X-XXX.XXX)
  const formattedPattern = /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/
  if (npwp.length === 20 && !formattedPattern.test(npwp)) {
    errors.push('Format NPWP tidak valid. Format yang benar: XX.XXX.XXX.X-XXX.XXX')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format NPWP with standard Indonesian formatting
 */
export function formatNPWP(npwp: string): string {
  const cleanNPWP = npwp.replace(/[.-]/g, '')
  
  if (cleanNPWP.length !== 15) {
    return npwp // Return as-is if invalid length
  }
  
  return `${cleanNPWP.slice(0, 2)}.${cleanNPWP.slice(2, 5)}.${cleanNPWP.slice(5, 8)}.${cleanNPWP.slice(8, 9)}-${cleanNPWP.slice(9, 12)}.${cleanNPWP.slice(12, 15)}`
}

/**
 * Get tax year display string
 */
export function getTaxYearDisplay(year: number): string {
  return `Tahun Pajak ${year}`
}

/**
 * Get period display string in Indonesian
 */
export function getPeriodDisplay(month: number, year: number): string {
  const monthName = getIndonesianMonthName(month)
  return `${monthName} ${year}`
}

/**
 * Validate bank account number (basic validation)
 */
export function validateBankAccount(accountNumber: string, bankCode?: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!accountNumber || accountNumber.trim().length === 0) {
    errors.push('Nomor rekening harus diisi')
    return { isValid: false, errors }
  }
  
  // Remove spaces and dashes
  const cleanAccount = accountNumber.replace(/[\s-]/g, '')
  
  // Basic length validation (Indonesian bank accounts are typically 8-16 digits)
  if (cleanAccount.length < 8 || cleanAccount.length > 16) {
    errors.push('Nomor rekening harus terdiri dari 8-16 digit')
  }
  
  if (!/^\d+$/.test(cleanAccount)) {
    errors.push('Nomor rekening hanya boleh berisi angka')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate Indonesian compliance report header
 */
export function generateComplianceReportHeader(
  reportType: string,
  companyName: string,
  period: { month: number; year: number }
): string {
  const monthName = getIndonesianMonthName(period.month)
  const reportTypeNames: Record<string, string> = {
    'pph21': 'Laporan PPh Pasal 21',
    'bpjs_health': 'Laporan BPJS Kesehatan',
    'bpjs_employment': 'Laporan BPJS Ketenagakerjaan',
    'form_1721a1': 'Formulir 1721-A1'
  }
  
  const reportName = reportTypeNames[reportType] || reportType
  
  return `${reportName}\n${companyName}\nPeriode: ${monthName} ${period.year}`
}

/**
 * Calculate Indonesian business days in a month
 */
export function getBusinessDaysInMonth(month: number, year: number): number {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  let businessDays = 0
  
  const current = new Date(startDate)
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    // Monday = 1, Tuesday = 2, ..., Friday = 5
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      businessDays++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return businessDays
}

/**
 * Check if date falls on Indonesian public holiday (simplified)
 */
export function isIndonesianPublicHoliday(date: Date): boolean {
  // This is a simplified implementation
  // In a real application, you would maintain a comprehensive list of Indonesian public holidays
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Some fixed holidays
  const fixedHolidays = [
    { month: 1, day: 1 },  // New Year
    { month: 8, day: 17 }, // Independence Day
    { month: 12, day: 25 } // Christmas
  ]
  
  return fixedHolidays.some(holiday => 
    holiday.month === month && holiday.day === day
  )
}

/**
 * Generate file name with Indonesian naming convention
 */
export function generateIndonesianFileName(
  reportType: string,
  month: number,
  year: number,
  companyName: string,
  extension: string = 'xlsx'
): string {
  const cleanCompanyName = companyName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  const monthStr = month.toString().padStart(2, '0')
  const reportTypeMap: Record<string, string> = {
    'pph21': 'PPh21',
    'bpjs_health': 'BPJS_Kesehatan',
    'bpjs_employment': 'BPJS_Ketenagakerjaan',
    'form_1721a1': 'Form_1721A1',
    'bank_transfer': 'Transfer_Gaji'
  }
  
  const typeStr = reportTypeMap[reportType] || reportType
  
  return `${typeStr}_${cleanCompanyName}_${monthStr}_${year}.${extension}`
}

/**
 * Convert export options to Indonesian-compliant format
 */
export function getIndonesianExportOptions(baseOptions?: Partial<ExportOptions>): ExportOptions {
  return {
    format: 'excel',
    include_headers: true,
    encoding: 'utf-8-bom',
    page_size: 'A4',
    orientation: 'landscape',
    locale: 'id-ID',
    currency_symbol: 'Rp',
    ...baseOptions
  }
}

/**
 * Validate tax calculation accuracy against government standards
 */
export function validateTaxCalculationAccuracy(
  calculatedAmount: number,
  expectedAmount: number,
  tolerance: number = 0.01
): {
  isAccurate: boolean
  difference: number
  differencePercentage: number
} {
  const difference = Math.abs(calculatedAmount - expectedAmount)
  const differencePercentage = expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0
  
  return {
    isAccurate: differencePercentage <= tolerance,
    difference,
    differencePercentage
  }
}