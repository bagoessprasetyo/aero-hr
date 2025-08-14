import type {
  PPh21Report,
  BPJSReport,
  Form1721A1,
  BankTransferFile,
  ExportOptions,
  ReportColumn,
  ReportFormatting
} from '@/lib/types/tax-reports'
import {
  formatIDR,
  formatIndonesianDate,
  formatIndonesianNumber,
  generateIndonesianFileName,
  getIndonesianExportOptions
} from './indonesian-compliance'

// Export engine for tax reports with multiple format support
export class TaxReportExportEngine {
  
  /**
   * Export PPh 21 Report to various formats
   */
  async exportPPh21Report(
    report: PPh21Report,
    options?: Partial<ExportOptions>
  ): Promise<{
    content: string | Blob
    filename: string
    mimeType: string
  }> {
    const exportOptions = getIndonesianExportOptions(options)
    const filename = generateIndonesianFileName(
      'pph21',
      report.report_period.month,
      report.report_period.year,
      report.company_name,
      exportOptions.format === 'csv' ? 'csv' : exportOptions.format === 'pdf' ? 'pdf' : 'xlsx'
    )

    switch (exportOptions.format) {
      case 'csv':
        return {
          content: this.generatePPh21CSV(report, exportOptions),
          filename,
          mimeType: 'text/csv'
        }
      
      case 'excel':
        return {
          content: await this.generatePPh21Excel(report, exportOptions),
          filename,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      
      case 'pdf':
        return {
          content: await this.generatePPh21PDF(report, exportOptions),
          filename,
          mimeType: 'application/pdf'
        }
      
      default:
        throw new Error(`Unsupported export format: ${exportOptions.format}`)
    }
  }

  /**
   * Export BPJS Report to various formats
   */
  async exportBPJSReport(
    report: BPJSReport,
    options?: Partial<ExportOptions>
  ): Promise<{
    content: string | Blob
    filename: string
    mimeType: string
  }> {
    const exportOptions = getIndonesianExportOptions(options)
    const reportType = report.type === 'health' ? 'bpjs_health' : 'bpjs_employment'
    const filename = generateIndonesianFileName(
      reportType,
      report.report_period.month,
      report.report_period.year,
      report.company_name,
      exportOptions.format === 'csv' ? 'csv' : exportOptions.format === 'pdf' ? 'pdf' : 'xlsx'
    )

    switch (exportOptions.format) {
      case 'csv':
        return {
          content: this.generateBPJSCSV(report, exportOptions),
          filename,
          mimeType: 'text/csv'
        }
      
      case 'excel':
        return {
          content: await this.generateBPJSExcel(report, exportOptions),
          filename,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      
      case 'pdf':
        return {
          content: await this.generateBPJSPDF(report, exportOptions),
          filename,
          mimeType: 'application/pdf'
        }
      
      default:
        throw new Error(`Unsupported export format: ${exportOptions.format}`)
    }
  }

  /**
   * Export Form 1721-A1 to various formats
   */
  async exportForm1721A1(
    form: Form1721A1,
    options?: Partial<ExportOptions>
  ): Promise<{
    content: string | Blob
    filename: string
    mimeType: string
  }> {
    const exportOptions = getIndonesianExportOptions(options)
    const filename = generateIndonesianFileName(
      'form_1721a1',
      12, // Annual report
      form.tax_year,
      form.company_name,
      exportOptions.format === 'csv' ? 'csv' : exportOptions.format === 'pdf' ? 'pdf' : 'xlsx'
    )

    switch (exportOptions.format) {
      case 'csv':
        return {
          content: this.generateForm1721A1CSV(form, exportOptions),
          filename,
          mimeType: 'text/csv'
        }
      
      case 'excel':
        return {
          content: await this.generateForm1721A1Excel(form, exportOptions),
          filename,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      
      case 'pdf':
        return {
          content: await this.generateForm1721A1PDF(form, exportOptions),
          filename,
          mimeType: 'application/pdf'
        }
      
      default:
        throw new Error(`Unsupported export format: ${exportOptions.format}`)
    }
  }

  /**
   * Export Bank Transfer File
   */
  async exportBankTransferFile(
    transferFile: BankTransferFile,
    options?: Partial<ExportOptions>
  ): Promise<{
    content: string
    filename: string
    mimeType: string
  }> {
    const exportOptions = { ...options, format: 'txt' as const }
    
    let content: string
    let filename: string
    
    switch (transferFile.bank_format) {
      case 'mandiri':
        content = this.generateMandiriTransferFormat(transferFile)
        filename = `mandiri_transfer_${transferFile.id}.txt`
        break
      
      case 'bca':
        content = this.generateBCATransferFormat(transferFile)
        filename = `bca_transfer_${transferFile.id}.txt`
        break
      
      case 'bni':
        content = this.generateBNITransferFormat(transferFile)
        filename = `bni_transfer_${transferFile.id}.txt`
        break
      
      case 'bri':
        content = this.generateBRITransferFormat(transferFile)
        filename = `bri_transfer_${transferFile.id}.txt`
        break
      
      default:
        content = this.generateGenericCSVTransferFormat(transferFile)
        filename = `generic_transfer_${transferFile.id}.csv`
    }

    return {
      content,
      filename,
      mimeType: transferFile.bank_format === 'generic' ? 'text/csv' : 'text/plain'
    }
  }

  // Private methods for generating specific formats

  private generatePPh21CSV(report: PPh21Report, options: ExportOptions): string {
    const headers = [
      'Nama Karyawan',
      'NIK',
      'NPWP',
      'Status PTKP',
      'Gaji Pokok',
      'Tunjangan',
      'Bonus',
      'Lembur',
      'Total Bruto',
      'BPJS Kesehatan',
      'BPJS Ketenagakerjaan',
      'Biaya Jabatan',
      'Total Potongan',
      'Penghasilan Kena Pajak (Bulanan)',
      'Penghasilan Kena Pajak (Tahunan)',
      'PTKP',
      'PKP Tahunan',
      'PPh 21 Tahunan',
      'PPh 21 Bulanan',
      'PPh 21 Terutang'
    ]

    const rows = report.items.map(item => [
      item.employee_name,
      item.nik,
      item.npwp || '',
      item.ptkp_status,
      formatIndonesianNumber(item.gross_salary),
      formatIndonesianNumber(item.allowances),
      formatIndonesianNumber(item.bonus),
      formatIndonesianNumber(item.overtime),
      formatIndonesianNumber(item.total_gross),
      formatIndonesianNumber(item.bpjs_health_employee),
      formatIndonesianNumber(item.bpjs_employment_employee),
      formatIndonesianNumber(item.occupational_cost),
      formatIndonesianNumber(item.total_deductions),
      formatIndonesianNumber(item.taxable_income_monthly),
      formatIndonesianNumber(item.taxable_income_yearly),
      formatIndonesianNumber(item.ptkp_amount),
      formatIndonesianNumber(item.pkp_yearly),
      formatIndonesianNumber(item.pph21_yearly),
      formatIndonesianNumber(item.pph21_monthly),
      formatIndonesianNumber(item.pph21_due)
    ])

    return this.arrayToCSV([headers, ...rows], options.encoding === 'utf-8-bom')
  }

  private generateBPJSCSV(report: BPJSReport, options: ExportOptions): string {
    if (report.type === 'health') {
      const headers = [
        'Nama Karyawan',
        'NIK',
        'Nomor BPJS Kesehatan',
        'Gaji Subject BPJS',
        'Iuran Karyawan',
        'Iuran Perusahaan',
        'Total Iuran'
      ]

      const rows = (report.health_items || []).map(item => [
        item.employee_name,
        item.nik,
        item.bpjs_health_number || '',
        formatIndonesianNumber(item.salary_subject_to_bpjs),
        formatIndonesianNumber(item.employee_contribution),
        formatIndonesianNumber(item.company_contribution),
        formatIndonesianNumber(item.total_contribution)
      ])

      return this.arrayToCSV([headers, ...rows], options.encoding === 'utf-8-bom')
    } else {
      const headers = [
        'Nama Karyawan',
        'NIK',
        'Nomor BPJS Ketenagakerjaan',
        'Upah Dasar',
        'JHT Karyawan',
        'JHT Perusahaan',
        'JP Karyawan',
        'JP Perusahaan',
        'JKK Perusahaan',
        'JKM Perusahaan',
        'Total Karyawan',
        'Total Perusahaan'
      ]

      const rows = (report.employment_items || []).map(item => [
        item.employee_name,
        item.nik,
        item.bpjs_employment_number || '',
        formatIndonesianNumber(item.salary_base),
        formatIndonesianNumber(item.jht_employee),
        formatIndonesianNumber(item.jht_company),
        formatIndonesianNumber(item.jp_employee),
        formatIndonesianNumber(item.jp_company),
        formatIndonesianNumber(item.jkk_company),
        formatIndonesianNumber(item.jkm_company),
        formatIndonesianNumber(item.total_employee),
        formatIndonesianNumber(item.total_company)
      ])

      return this.arrayToCSV([headers, ...rows], options.encoding === 'utf-8-bom')
    }
  }

  private generateForm1721A1CSV(form: Form1721A1, options: ExportOptions): string {
    const headers = [
      'Nama Karyawan',
      'NIK',
      'NPWP',
      'Status PTKP',
      'Total Penghasilan Bruto',
      'Total Tunjangan',
      'Total Bonus',
      'Total Bruto Tahunan',
      'Biaya Jabatan',
      'BPJS Kesehatan',
      'BPJS Ketenagakerjaan',
      'Potongan Lainnya',
      'Penghasilan Neto',
      'PTKP',
      'PKP',
      'PPh 21 Terhitung',
      'PPh 21 Dipotong',
      'PPh 21 Lebih Bayar',
      'PPh 21 Kurang Bayar'
    ]

    const rows = form.items.map(item => [
      item.employee_name,
      item.nik,
      item.npwp || '',
      item.ptkp_status,
      formatIndonesianNumber(item.total_gross_income),
      formatIndonesianNumber(item.total_allowances),
      formatIndonesianNumber(item.total_bonus),
      formatIndonesianNumber(item.annual_gross),
      formatIndonesianNumber(item.occupational_cost),
      formatIndonesianNumber(item.bpjs_health),
      formatIndonesianNumber(item.bpjs_employment),
      formatIndonesianNumber(item.other_deductions),
      formatIndonesianNumber(item.net_income),
      formatIndonesianNumber(item.ptkp_amount),
      formatIndonesianNumber(item.pkp),
      formatIndonesianNumber(item.pph21_calculated),
      formatIndonesianNumber(item.pph21_paid),
      formatIndonesianNumber(item.pph21_overpaid),
      formatIndonesianNumber(item.pph21_underpaid)
    ])

    return this.arrayToCSV([headers, ...rows], options.encoding === 'utf-8-bom')
  }

  // Bank transfer format generators
  private generateMandiriTransferFormat(transferFile: BankTransferFile): string {
    // Mandiri specific format (simplified)
    let content = `H|${transferFile.company_account.account_number}|${transferFile.transfer_date}|${transferFile.total_transfers}|${transferFile.total_amount}\n`
    
    transferFile.items.forEach((item, index) => {
      content += `D|${index + 1}|${item.account_number}|${item.account_name}|${item.transfer_amount}|${item.description}\n`
    })
    
    content += `T|${transferFile.total_transfers}|${transferFile.total_amount}\n`
    return content
  }

  private generateBCATransferFormat(transferFile: BankTransferFile): string {
    // BCA specific format (simplified)
    let content = `Header|${transferFile.company_account.account_number}|${transferFile.transfer_date}\n`
    
    transferFile.items.forEach(item => {
      content += `${item.account_number},${item.account_name},${item.transfer_amount},${item.description}\n`
    })
    
    return content
  }

  private generateBNITransferFormat(transferFile: BankTransferFile): string {
    // BNI specific format (simplified)
    return transferFile.items.map(item => 
      `${item.account_number}|${item.account_name}|${item.transfer_amount}|${item.description}`
    ).join('\n')
  }

  private generateBRITransferFormat(transferFile: BankTransferFile): string {
    // BRI specific format (simplified)
    let content = `${transferFile.company_account.account_number};${transferFile.transfer_date};${transferFile.total_amount}\n`
    
    transferFile.items.forEach(item => {
      content += `${item.account_number};${item.account_name};${item.transfer_amount};${item.description}\n`
    })
    
    return content
  }

  private generateGenericCSVTransferFormat(transferFile: BankTransferFile): string {
    const headers = [
      'Nama Karyawan',
      'Nama Bank',
      'Nomor Rekening',
      'Nama Rekening',
      'Jumlah Transfer',
      'Keterangan'
    ]

    const rows = transferFile.items.map(item => [
      item.employee_name,
      item.bank_name,
      item.account_number,
      item.account_name,
      formatIndonesianNumber(item.transfer_amount),
      item.description
    ])

    return this.arrayToCSV([headers, ...rows], true)
  }

  // Excel generation placeholders (would require a library like ExcelJS)
  private async generatePPh21Excel(report: PPh21Report, options: ExportOptions): Promise<Blob> {
    // This is a placeholder - in a real implementation, you would use a library like ExcelJS
    // to generate proper Excel files with formatting, styling, and multiple sheets
    const csvContent = this.generatePPh21CSV(report, options)
    return new Blob([csvContent], { type: 'text/csv' })
  }

  private async generateBPJSExcel(report: BPJSReport, options: ExportOptions): Promise<Blob> {
    const csvContent = this.generateBPJSCSV(report, options)
    return new Blob([csvContent], { type: 'text/csv' })
  }

  private async generateForm1721A1Excel(form: Form1721A1, options: ExportOptions): Promise<Blob> {
    const csvContent = this.generateForm1721A1CSV(form, options)
    return new Blob([csvContent], { type: 'text/csv' })
  }

  // PDF generation placeholders (would require a library like jsPDF or PDFKit)
  private async generatePPh21PDF(report: PPh21Report, options: ExportOptions): Promise<Blob> {
    // This is a placeholder - in a real implementation, you would use a PDF generation library
    const csvContent = this.generatePPh21CSV(report, options)
    return new Blob([csvContent], { type: 'text/plain' })
  }

  private async generateBPJSPDF(report: BPJSReport, options: ExportOptions): Promise<Blob> {
    const csvContent = this.generateBPJSCSV(report, options)
    return new Blob([csvContent], { type: 'text/plain' })
  }

  private async generateForm1721A1PDF(form: Form1721A1, options: ExportOptions): Promise<Blob> {
    const csvContent = this.generateForm1721A1CSV(form, options)
    return new Blob([csvContent], { type: 'text/plain' })
  }

  // Utility methods
  private arrayToCSV(data: string[][], addBOM: boolean = false): string {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    return addBOM ? '\ufeff' + csvContent : csvContent
  }
}

// Export singleton instance
export const exportEngine = new TaxReportExportEngine()