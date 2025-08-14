import type { Employee, SalaryComponent } from '@/lib/types/database'
import type { PayrollCalculationResult } from '@/lib/calculations/payroll'
import { formatCurrency } from '@/lib/utils/validation'
import { jsPDF } from 'jspdf'

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
  static generatePayslipPDF(data: PayslipData): jsPDF {
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
    
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    // Set font
    doc.setFont('helvetica')

    // Company Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('SLIP GAJI KARYAWAN', pageWidth / 2, y, { align: 'center' })
    y += 15

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(companyInfo.name, pageWidth / 2, y, { align: 'center' })
    y += 6
    doc.text(companyInfo.address, pageWidth / 2, y, { align: 'center' })
    y += 6
    if (companyInfo.phone) {
      doc.text(`Telp: ${companyInfo.phone}`, pageWidth / 2, y, { align: 'center' })
      y += 6
    }
    if (companyInfo.email) {
      doc.text(`Email: ${companyInfo.email}`, pageWidth / 2, y, { align: 'center' })
      y += 6
    }

    // Period
    y += 10
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`PERIODE: ${periodText}`, pageWidth / 2, y, { align: 'center' })
    y += 15

    // Employee Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMASI KARYAWAN:', margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    const employeeInfo = [
      ['NIK', employee.employee_id],
      ['Nama', employee.full_name],
      ['Jabatan', employee.position?.position_title || '-'],
      ['Departemen', typeof employee.department === 'string' ? employee.department : (employee.department?.department_name || '-')],
      ['NPWP', employee.npwp || '-'],
      ['Status PTKP', employee.ptkp_status || '-']
    ]

    employeeInfo.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, y)
      doc.text(value, margin + 40, y)
      y += 6
    })

    y += 10

    // Earnings Section
    doc.setFont('helvetica', 'bold')
    doc.text('PENDAPATAN:', margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    
    // Add salary components
    salaryComponents
      .filter(comp => comp.is_active && ['basic_salary', 'allowance'].includes(comp.component_type))
      .forEach(component => {
        doc.text(component.component_name, margin, y)
        doc.text(formatCurrency(component.amount), pageWidth - margin, y, { align: 'right' })
        y += 6
      })

    // Add variable components
    if (calculation.variableComponents.bonus > 0) {
      doc.text('Bonus', margin, y)
      doc.text(formatCurrency(calculation.variableComponents.bonus), pageWidth - margin, y, { align: 'right' })
      y += 6
    }

    if (calculation.variableComponents.overtimePay > 0) {
      doc.text('Lembur', margin, y)
      doc.text(formatCurrency(calculation.variableComponents.overtimePay), pageWidth - margin, y, { align: 'right' })
      y += 6
    }

    if (calculation.variableComponents.otherAllowances > 0) {
      doc.text('Tunjangan Lainnya', margin, y)
      doc.text(formatCurrency(calculation.variableComponents.otherAllowances), pageWidth - margin, y, { align: 'right' })
      y += 6
    }

    // Gross salary total
    y += 5
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL PENDAPATAN KOTOR', margin, y)
    doc.text(formatCurrency(calculation.grossSalary), pageWidth - margin, y, { align: 'right' })
    y += 15

    // Deductions Section
    doc.setFont('helvetica', 'bold')
    doc.text('POTONGAN:', margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    
    // BPJS and tax deductions
    const deductions = [
      ['BPJS Kesehatan (1%)', calculation.bpjsCalculation.healthEmployee],
      ['BPJS Ketenagakerjaan', calculation.bpjsCalculation.jhtEmployee + calculation.bpjsCalculation.jpEmployee],
      ['PPh 21', calculation.pph21Calculation.pph21Monthly]
    ]

    deductions.forEach(([label, amount]) => {
      if (Number(amount) > 0) {
        doc.text(String(label), margin, y)
        doc.text(formatCurrency(Number(amount)), pageWidth - margin, y, { align: 'right' })
        y += 6
      }
    })

    // Other deductions
    salaryComponents
      .filter(comp => comp.is_active && comp.component_type === 'deduction')
      .forEach(component => {
        doc.text(component.component_name, margin, y)
        doc.text(formatCurrency(component.amount), pageWidth - margin, y, { align: 'right' })
        y += 6
      })

    if (calculation.variableComponents.otherDeductions > 0) {
      doc.text('Potongan Lainnya', margin, y)
      doc.text(formatCurrency(calculation.variableComponents.otherDeductions), pageWidth - margin, y, { align: 'right' })
      y += 6
    }

    const totalDeductions = calculation.totalDeductions + 
                           calculation.bpjsCalculation.healthEmployee + 
                           calculation.bpjsCalculation.jhtEmployee + 
                           calculation.bpjsCalculation.jpEmployee + 
                           calculation.pph21Calculation.pph21Monthly +
                           calculation.variableComponents.otherDeductions

    // Total deductions
    y += 5
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL POTONGAN', margin, y)
    doc.text(formatCurrency(totalDeductions), pageWidth - margin, y, { align: 'right' })
    y += 15

    // Net Salary
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('GAJI BERSIH', margin, y)
    doc.text(formatCurrency(calculation.netSalary), pageWidth - margin, y, { align: 'right' })
    y += 20

    // Signature section
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('TANDA TANGAN:', margin, y)
    y += 15

    const signatureColumns = ['Karyawan', 'HR Department', 'Finance']
    const columnWidth = (pageWidth - 2 * margin) / 3

    signatureColumns.forEach((column, index) => {
      const x = margin + (index * columnWidth)
      doc.text(column, x, y)
      
      // Signature line
      doc.line(x, y + 15, x + columnWidth - 10, y + 15)
      
      if (index === 0) {
        doc.text(employee.full_name, x, y + 20)
      } else if (index === 1) {
        doc.text('HR Manager', x, y + 20)
      } else {
        doc.text('Finance Manager', x, y + 20)
      }
    })

    y += 35

    // Footer
    doc.setFontSize(8)
    doc.text('Slip gaji ini dibuat secara otomatis oleh sistem Aero HR', pageWidth / 2, y, { align: 'center' })
    y += 4
    doc.text('Dokumen ini sah dan tidak memerlukan tanda tangan basah', pageWidth / 2, y, { align: 'center' })
    y += 4
    const printDate = new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Dicetak pada: ${printDate}`, pageWidth / 2, y, { align: 'center' })

    return doc
  }

  static async downloadPayslip(data: PayslipData, filename?: string): Promise<void> {
    const pdf = this.generatePayslipPDF(data)
    
    const defaultFilename = `payslip-${data.employee.employee_id}-${data.payrollPeriod.period_year}-${String(data.payrollPeriod.period_month).padStart(2, '0')}.pdf`
    
    pdf.save(filename || defaultFilename)
  }

  static async generateBulkPayslips(payslipsData: PayslipData[]): Promise<jsPDF[]> {
    const payslips: jsPDF[] = []
    
    for (const data of payslipsData) {
      const pdf = this.generatePayslipPDF(data)
      payslips.push(pdf)
    }
    
    return payslips
  }

  static async generatePayslipBlob(data: PayslipData): Promise<Blob> {
    const pdf = this.generatePayslipPDF(data)
    return pdf.output('blob')
  }

  // Legacy text generation for backwards compatibility
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
Jabatan             : ${employee.position?.position_title}
Departemen          : ${typeof employee.department === 'string' ? employee.department : (employee.department?.department_name || '-')}
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
}