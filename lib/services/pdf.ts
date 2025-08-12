import type { Employee, SalaryComponent } from '@/lib/types/database'
import type { PayrollCalculationResult } from '@/lib/calculations/payroll'
import { formatCurrency } from '@/lib/utils/validation'

export interface PayslipData {
  employee: Employee
  salaryComponents: SalaryComponent[]
  calculation: PayrollCalculationResult
  payrollPeriod: {
    period_month: number
    period_year: number
    status: string
  }
  companyInfo?: {
    name: string
    address: string
    phone?: string
    email?: string
  }
}

export class PDFService {
  static generatePayslipText(data: PayslipData): string {
    const {
      employee,
      salaryComponents,
      calculation,
      payrollPeriod,
      companyInfo = {
        name: 'PT. Aero Teknologi Indonesia',
        address: 'Jakarta Selatan, DKI Jakarta 12950',
        phone: '+62 21 1234 5678',
        email: 'hr@aerotech.co.id'
      }
    } = data

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    const periodText = `${monthNames[payrollPeriod.period_month - 1]} ${payrollPeriod.period_year}`
    
    let payslipText = `
===============================================================================
                              SLIP GAJI KARYAWAN
===============================================================================

${companyInfo.name}
${companyInfo.address}
${companyInfo.phone ? `Telp: ${companyInfo.phone}` : ''}
${companyInfo.email ? `Email: ${companyInfo.email}` : ''}

===============================================================================

PERIODE: ${periodText}

INFORMASI KARYAWAN:
-------------------------------------------------------------------------------
NIK                 : ${employee.employee_id}
Nama                : ${employee.full_name}
Jabatan             : ${employee.position_title}
Departemen          : ${employee.department}
NPWP                : ${employee.npwp || '-'}
Status PTKP         : ${employee.ptkp_status}

===============================================================================
                                PENDAPATAN
===============================================================================
`

    // Add salary components
    salaryComponents
      .filter(comp => comp.is_active && ['basic_salary', 'allowance'].includes(comp.component_type))
      .forEach(component => {
        const name = component.component_name.padEnd(40)
        const amount = formatCurrency(component.amount).padStart(20)
        payslipText += `${name} ${amount}\n`
      })

    // Add variable components
    if (calculation.variableComponents.bonus > 0) {
      const name = 'Bonus'.padEnd(40)
      const amount = formatCurrency(calculation.variableComponents.bonus).padStart(20)
      payslipText += `${name} ${amount}\n`
    }

    if (calculation.variableComponents.overtimePay > 0) {
      const name = 'Lembur'.padEnd(40)
      const amount = formatCurrency(calculation.variableComponents.overtimePay).padStart(20)
      payslipText += `${name} ${amount}\n`
    }

    if (calculation.variableComponents.otherAllowances > 0) {
      const name = 'Tunjangan Lainnya'.padEnd(40)
      const amount = formatCurrency(calculation.variableComponents.otherAllowances).padStart(20)
      payslipText += `${name} ${amount}\n`
    }

    payslipText += `-------------------------------------------------------------------------------
${'TOTAL PENDAPATAN KOTOR'.padEnd(40)} ${formatCurrency(calculation.grossSalary).padStart(20)}

===============================================================================
                                POTONGAN
===============================================================================
${'BPJS Kesehatan (1%)'.padEnd(40)} ${formatCurrency(calculation.bpjsCalculation.healthEmployee).padStart(20)}
${'BPJS Ketenagakerjaan'.padEnd(40)} ${formatCurrency(calculation.bpjsCalculation.jhtEmployee + calculation.bpjsCalculation.jpEmployee).padStart(20)}
${'PPh 21'.padEnd(40)} ${formatCurrency(calculation.pph21Calculation.pph21Monthly).padStart(20)}
`

    // Add other deductions
    salaryComponents
      .filter(comp => comp.is_active && comp.component_type === 'deduction')
      .forEach(component => {
        const name = component.component_name.padEnd(40)
        const amount = formatCurrency(component.amount).padStart(20)
        payslipText += `${name} ${amount}\n`
      })

    if (calculation.variableComponents.otherDeductions > 0) {
      const name = 'Potongan Lainnya'.padEnd(40)
      const amount = formatCurrency(calculation.variableComponents.otherDeductions).padStart(20)
      payslipText += `${name} ${amount}\n`
    }

    const totalDeductions = calculation.totalDeductions + 
                           calculation.bpjsCalculation.healthEmployee + 
                           calculation.bpjsCalculation.jhtEmployee + 
                           calculation.bpjsCalculation.jpEmployee + 
                           calculation.pph21Calculation.pph21Monthly +
                           calculation.variableComponents.otherDeductions

    payslipText += `-------------------------------------------------------------------------------
${'TOTAL POTONGAN'.padEnd(40)} ${formatCurrency(totalDeductions).padStart(20)}

===============================================================================
                               GAJI BERSIH
===============================================================================
${'TOTAL GAJI BERSIH'.padEnd(40)} ${formatCurrency(calculation.netSalary).padStart(20)}

===============================================================================

TANDA TANGAN:

Karyawan                    HR Department               Finance
                                      
                                      
${employee.full_name.padEnd(24)}HR Manager                  Finance Manager

===============================================================================

Slip gaji ini dibuat secara otomatis oleh sistem Aero HR
Dokumen ini sah dan tidak memerlukan tanda tangan basah
Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

===============================================================================
`

    return payslipText
  }

  static async downloadPayslip(data: PayslipData, filename?: string): Promise<void> {
    const payslipText = this.generatePayslipText(data)
    const blob = new Blob([payslipText], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    
    const defaultFilename = `payslip-${data.employee.employee_id}-${data.payrollPeriod.period_year}-${String(data.payrollPeriod.period_month).padStart(2, '0')}.txt`
    
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', filename || defaultFilename)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  static async generateBulkPayslips(payslipsData: PayslipData[]): Promise<string[]> {
    const payslips: string[] = []
    
    for (const data of payslipsData) {
      const payslipText = this.generatePayslipText(data)
      payslips.push(payslipText)
    }
    
    return payslips
  }

  static async generatePayslipBlob(data: PayslipData): Promise<Blob> {
    const payslipText = this.generatePayslipText(data)
    return new Blob([payslipText], { type: 'text/plain;charset=utf-8' })
  }
}