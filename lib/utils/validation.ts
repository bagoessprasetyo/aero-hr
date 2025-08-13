import { z } from 'zod'

// Indonesian NIK (National ID) validation
export const nikSchema = z
  .string()
  .min(16, 'NIK must be 16 digits')
  .max(16, 'NIK must be 16 digits')
  .regex(/^\d{16}$/, 'NIK must contain only numbers')
  .refine((value) => {
    // Basic NIK validation - check if it's not all zeros or repeating digits
    if (value === '0000000000000000') return false
    if (/^(\d)\1{15}$/.test(value)) return false // All same digits
    return true
  }, 'Invalid NIK format')

// Indonesian NPWP (Tax ID) validation
export const npwpSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true // Optional field
    // Remove dots and hyphens for validation
    const cleanNpwp = value.replace(/[.-]/g, '')
    return /^\d{15}$/.test(cleanNpwp)
  }, 'NPWP must be 15 digits (format: XX.XXX.XXX.X-XXX.XXX)')

// Employee ID validation
export const employeeIdSchema = z
  .string()
  .min(3, 'Employee ID must be at least 3 characters')
  .max(20, 'Employee ID must be at most 20 characters')
  .regex(/^[A-Z0-9]+$/, 'Employee ID must contain only uppercase letters and numbers')

// Indonesian phone number validation
export const phoneSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true
    // Indonesian phone number patterns
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '')
    return /^(\+62|62|0)[0-9]{8,12}$/.test(cleanPhone)
  }, 'Invalid Indonesian phone number format')

// Bank account validation
export const bankAccountSchema = z
  .string()
  .min(8, 'Bank account number must be at least 8 digits')
  .max(20, 'Bank account number must be at most 20 digits')
  .regex(/^\d+$/, 'Bank account number must contain only numbers')

// Employee form validation schema
export const employeeFormSchema = z.object({
  // Personal Information
  employee_id: employeeIdSchema,
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .regex(/^[a-zA-Z\s.,'-]+$/, 'Full name contains invalid characters'),
  nik: nikSchema,
  npwp: npwpSchema,
  address: z
    .string()
    .optional()
    .refine((value) => !value || value.length <= 500, 'Address must be at most 500 characters'),
  phone: phoneSchema,
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),

  // Employment Information
  position_title: z
    .string()
    .min(2, 'Position title must be at least 2 characters')
    .max(100, 'Position title must be at most 100 characters'),
  department: z
    .string()
    .min(2, 'Department must be at least 2 characters')
    .max(50, 'Department must be at most 50 characters'),
  join_date: z
    .string()
    .refine((value) => {
      const date = new Date(value)
      return !isNaN(date.getTime()) && date <= new Date()
    }, 'Join date must be a valid date and not in the future'),
  employment_status: z.enum(['permanent', 'contract']),
  employee_status: z.enum(['active', 'resigned', 'terminated']),

  // Financial Information
  bank_name: z
    .string()
    .min(2, 'Bank name must be at least 2 characters')
    .max(50, 'Bank name must be at most 50 characters'),
  bank_account_number: bankAccountSchema,
  ptkp_status: z.enum(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']),

  // BPJS Enrollment
  bpjs_health_enrolled: z.boolean(),
  bpjs_manpower_enrolled: z.boolean(),
})

// Salary component validation schema
export const salaryComponentSchema = z.object({
  component_name: z
    .string()
    .min(2, 'Component name must be at least 2 characters')
    .max(100, 'Component name must be at most 100 characters'),
  component_type: z.enum(['basic_salary', 'fixed_allowance', 'deduction']),
  amount: z
    .number()
    .min(0, 'Amount must be positive')
    .max(999999999999.99, 'Amount is too large'),
  is_active: z.boolean(),
})

// Utility functions for formatting
export const formatNIK = (value: string): string => {
  const clean = value.replace(/\D/g, '')
  return clean.slice(0, 16)
}

export const formatNPWP = (value: string): string => {
  const clean = value.replace(/\D/g, '')
  if (clean.length <= 2) return clean
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`
  if (clean.length <= 9) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8)}`
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9)}`
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 15)}`
}

export const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '')
  if (clean.startsWith('0')) {
    // Format: 0812-3456-7890
    if (clean.length <= 4) return clean
    if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`
  }
  return clean
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatEmployeeId = (value: string): string => {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Note: Department, position, and bank data is now managed through the master data system
// See /admin for master data management interface