"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  ProfessionalCard,
  ActionButton 
} from '@/components/ui/professional'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowLeft,
  Clock,
  User,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  FileText,
  Video,
  ExternalLink,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArticleContent {
  id: string
  title: string
  description: string
  category: string
  type: 'article' | 'video' | 'tutorial'
  readTime: number
  author: string
  lastUpdated: string
  content: ArticleSection[]
  relatedArticles?: string[]
  tags?: string[]
}

interface ArticleSection {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'image' | 'callout' | 'steps'
  content: string | string[]
  level?: number
  calloutType?: 'info' | 'warning' | 'success' | 'tip'
  language?: string
}

const helpArticles: Record<string, ArticleContent> = {
  'getting-started': {
    id: 'getting-started',
    title: 'Getting Started with Aero HR',
    description: 'Complete guide to setting up and using Aero HR for Indonesian payroll management',
    category: 'Getting Started',
    type: 'tutorial',
    readTime: 10,
    author: 'Aero HR Team',
    lastUpdated: '2024-01-15',
    tags: ['setup', 'tutorial', 'basics'],
    content: [
      {
        type: 'heading',
        content: 'Welcome to Aero HR',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Aero HR is a comprehensive payroll management system designed specifically for Indonesian businesses. This guide will help you get started with setting up your payroll system and managing employees effectively.'
      },
      {
        type: 'callout',
        content: 'Before you begin, make sure you have administrative access to your Aero HR account and have gathered all necessary employee information.',
        calloutType: 'info'
      },
      {
        type: 'heading',
        content: 'Initial Setup',
        level: 2
      },
      {
        type: 'steps',
        content: [
          'Log in to your Aero HR dashboard',
          'Complete your company profile with tax registration details',
          'Set up your payroll periods (monthly recommended)',
          'Configure BPJS and PPh 21 tax settings',
          'Add your first employees'
        ]
      },
      {
        type: 'heading',
        content: 'Adding Your First Employee',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'To add an employee, navigate to the Employees section and click "Add Employee". You\'ll need the following information:'
      },
      {
        type: 'list',
        content: [
          'Full name and personal details',
          'NIK (Indonesian ID number)',
          'NPWP (Tax ID number)',
          'BPJS enrollment status',
          'Basic salary and allowances',
          'PTKP status for tax calculation'
        ]
      },
      {
        type: 'callout',
        content: 'Accurate employee information is crucial for proper payroll calculations and compliance with Indonesian regulations.',
        calloutType: 'warning'
      },
      {
        type: 'heading',
        content: 'Setting Up Salary Components',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Salary components in Aero HR are flexible and can be customized based on your company\'s needs:'
      },
      {
        type: 'list',
        content: [
          'Basic Salary: The fixed monthly salary',
          'Fixed Allowances: Regular allowances like transport, meal, etc.',
          'Variable Components: Bonus, overtime, and other variable payments',
          'Deductions: Loan payments, late penalties, etc.'
        ]
      },
      {
        type: 'heading',
        content: 'Running Your First Payroll',
        level: 2
      },
      {
        type: 'steps',
        content: [
          'Create a new payroll period for the current month',
          'Add variable components (bonus, overtime) if any',
          'Run automatic calculations for BPJS and PPh 21',
          'Review all calculations for accuracy',
          'Generate payslips for employees',
          'Finalize the payroll when ready'
        ]
      },
      {
        type: 'callout',
        content: 'Always review payroll calculations before finalizing. Once finalized, payroll periods cannot be edited.',
        calloutType: 'warning'
      },
      {
        type: 'heading',
        content: 'Understanding Indonesian Compliance',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Aero HR automatically handles Indonesian payroll compliance:'
      },
      {
        type: 'list',
        content: [
          'BPJS Kesehatan: 1% of gross salary (employee contribution)',
          'BPJS Ketenagakerjaan: JHT (2%) + JP (1%) employee contributions',
          'PPh 21: Progressive tax calculation based on PTKP status',
          'Occupational cost: 5% of gross salary (max IDR 500,000/month)',
          'PTKP deductions based on marital and dependent status'
        ]
      },
      {
        type: 'callout',
        content: 'All calculations are updated automatically based on current Indonesian regulations. No manual intervention needed!',
        calloutType: 'success'
      },
      {
        type: 'heading',
        content: 'Next Steps',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Now that you\'ve completed the basic setup, explore these advanced features:'
      },
      {
        type: 'list',
        content: [
          'Bulk operations for managing multiple employees',
          'Advanced reporting and analytics',
          'Export compliance reports for tax authorities',
          'Set up automated payroll scheduling'
        ]
      }
    ],
    relatedArticles: ['employee-management', 'payroll-calculation', 'pph21-guide']
  },

  'employee-management': {
    id: 'employee-management',
    title: 'Employee Management Guide',
    description: 'Learn how to manage employee profiles, salary components, and personal data effectively',
    category: 'Employees',
    type: 'article',
    readTime: 8,
    author: 'HR Expert Team',
    lastUpdated: '2024-01-12',
    tags: ['employees', 'management', 'profiles'],
    content: [
      {
        type: 'heading',
        content: 'Employee Management Overview',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Effective employee management is the foundation of accurate payroll processing. This guide covers everything you need to know about managing employee data in Aero HR.'
      },
      {
        type: 'heading',
        content: 'Employee Profile Structure',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Each employee profile contains several key sections:'
      },
      {
        type: 'list',
        content: [
          'Personal Information: Name, ID numbers, contact details',
          'Employment Details: Position, department, hire date',
          'Salary Structure: Basic salary and allowances',
          'Tax Information: NPWP, PTKP status',
          'BPJS Enrollment: Health and employment insurance details',
          'Bank Information: For salary transfers'
        ]
      },
      {
        type: 'callout',
        content: 'Keep employee information up-to-date to ensure accurate payroll calculations and compliance.',
        calloutType: 'tip'
      },
      {
        type: 'heading',
        content: 'Adding New Employees',
        level: 2
      },
      {
        type: 'steps',
        content: [
          'Navigate to Employees → Add Employee',
          'Fill in personal information (name, NIK, address)',
          'Add employment details (position, department, start date)',
          'Configure salary structure (basic salary + allowances)',
          'Set up tax information (NPWP, PTKP status)',
          'Configure BPJS enrollment status',
          'Save and review the employee profile'
        ]
      },
      {
        type: 'heading',
        content: 'Salary Component Configuration',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Salary components determine how an employee\'s total compensation is calculated:'
      },
      {
        type: 'code',
        content: 'Total Gross Salary = Basic Salary + Fixed Allowances + Variable Components',
        language: 'formula'
      },
      {
        type: 'list',
        content: [
          'Basic Salary: Fixed monthly amount',
          'Transport Allowance: Regular transportation compensation',
          'Meal Allowance: Daily meal compensation',
          'Position Allowance: Role-specific additional compensation',
          'Other Allowances: Custom allowances as needed'
        ]
      },
      {
        type: 'callout',
        content: 'Allowances above IDR 500,000/month may be subject to PPh 21 tax. Aero HR handles this automatically.',
        calloutType: 'info'
      },
      {
        type: 'heading',
        content: 'PTKP Status Configuration',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'PTKP (Penghasilan Tidak Kena Pajak) status affects tax calculations:'
      },
      {
        type: 'list',
        content: [
          'TK/0: Single, no dependents',
          'TK/1: Single, 1 dependent',
          'TK/2: Single, 2 dependents',
          'TK/3: Single, 3 dependents',
          'K/0: Married, no dependents',
          'K/1: Married, 1 dependent',
          'K/2: Married, 2 dependents',
          'K/3: Married, 3 dependents'
        ]
      },
      {
        type: 'heading',
        content: 'BPJS Management',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'All Indonesian employees must be enrolled in BPJS programs:'
      },
      {
        type: 'list',
        content: [
          'BPJS Kesehatan: Health insurance (mandatory)',
          'BPJS Ketenagakerjaan: Employment insurance including JHT, JP, JKK, JKM',
          'Employee contributions are automatically deducted from salary',
          'Company contributions are calculated separately'
        ]
      },
      {
        type: 'callout',
        content: 'BPJS contributions are based on gross salary with specific minimum and maximum limits set by government regulations.',
        calloutType: 'info'
      },
      {
        type: 'heading',
        content: 'Bulk Employee Operations',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'For managing multiple employees efficiently:'
      },
      {
        type: 'list',
        content: [
          'Bulk salary adjustments across departments',
          'Mass BPJS enrollment updates',
          'Batch export of employee data',
          'Simultaneous position changes',
          'Group bonus distributions'
        ]
      },
      {
        type: 'callout',
        content: 'Use bulk operations carefully and always review changes before applying them to avoid errors.',
        calloutType: 'warning'
      }
    ],
    relatedArticles: ['salary-components', 'bpjs-setup', 'bulk-operations']
  },

  'payroll-calculation': {
    id: 'payroll-calculation',
    title: 'Payroll Calculation Process',
    description: 'Step-by-step guide to calculating and processing monthly payroll with Indonesian compliance',
    category: 'Payroll',
    type: 'tutorial',
    readTime: 12,
    author: 'Payroll Specialist',
    lastUpdated: '2024-01-10',
    tags: ['payroll', 'calculation', 'process'],
    content: [
      {
        type: 'heading',
        content: 'Payroll Calculation Overview',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Aero HR\'s payroll calculation follows Indonesian regulations and ensures compliance with tax and social security requirements. This guide explains the complete calculation process.'
      },
      {
        type: 'heading',
        content: 'Calculation Flow',
        level: 2
      },
      {
        type: 'steps',
        content: [
          'Calculate gross salary (basic + allowances + variables)',
          'Determine BPJS contributions (health + employment)',
          'Calculate occupational cost (5% of gross, max IDR 500K)',
          'Apply PTKP deductions based on marital status',
          'Calculate PPh 21 tax on taxable income',
          'Subtract all deductions to get net salary'
        ]
      },
      {
        type: 'heading',
        content: 'Gross Salary Calculation',
        level: 2
      },
      {
        type: 'code',
        content: 'Gross Salary = Basic Salary + Fixed Allowances + Variable Components (Bonus, Overtime, etc.)',
        language: 'formula'
      },
      {
        type: 'paragraph',
        content: 'Variable components include:'
      },
      {
        type: 'list',
        content: [
          'Monthly bonus payments',
          'Overtime compensation',
          'Performance incentives',
          'Holiday allowances',
          'Commission payments'
        ]
      },
      {
        type: 'heading',
        content: 'BPJS Contributions',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'BPJS contributions are calculated based on gross salary:'
      },
      {
        type: 'code',
        content: `BPJS Kesehatan (Employee): 1% of gross salary
BPJS JHT (Employee): 2% of gross salary
BPJS JP (Employee): 1% of gross salary
BPJS JKK (Company): 0.24-1.74% of gross salary
BPJS JKM (Company): 0.30% of gross salary`,
        language: 'calculation'
      },
      {
        type: 'callout',
        content: 'BPJS contributions have minimum and maximum limits that are updated annually by the government.',
        calloutType: 'info'
      },
      {
        type: 'heading',
        content: 'PPh 21 Tax Calculation',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'PPh 21 calculation follows these steps:'
      },
      {
        type: 'steps',
        content: [
          'Calculate annual gross income (monthly × 12)',
          'Add company BPJS contributions to gross income',
          'Subtract occupational cost (5% of gross, max IDR 6M/year)',
          'Subtract employee BPJS contributions',
          'Apply PTKP deductions based on status',
          'Calculate tax on remaining taxable income',
          'Divide by 12 for monthly PPh 21'
        ]
      },
      {
        type: 'heading',
        content: 'PTKP Deduction Amounts (2024)',
        level: 3
      },
      {
        type: 'code',
        content: `TK/0: IDR 54,000,000/year
TK/1: IDR 58,500,000/year  
TK/2: IDR 63,000,000/year
TK/3: IDR 67,500,000/year
K/0:  IDR 58,500,000/year
K/1:  IDR 63,000,000/year
K/2:  IDR 67,500,000/year
K/3:  IDR 72,000,000/year`,
        language: 'data'
      },
      {
        type: 'heading',
        content: 'Tax Brackets (2024)',
        level: 3
      },
      {
        type: 'code',
        content: `Up to IDR 60,000,000: 5%
IDR 60,000,001 - IDR 250,000,000: 15%
IDR 250,000,001 - IDR 500,000,000: 25%
IDR 500,000,001 - IDR 5,000,000,000: 30%
Above IDR 5,000,000,000: 35%`,
        language: 'data'
      },
      {
        type: 'heading',
        content: 'Net Salary Calculation',
        level: 2
      },
      {
        type: 'code',
        content: 'Net Salary = Gross Salary - BPJS Employee - PPh 21 - Other Deductions',
        language: 'formula'
      },
      {
        type: 'paragraph',
        content: 'Other deductions may include:'
      },
      {
        type: 'list',
        content: [
          'Loan repayments',
          'Salary advances',
          'Late penalties',
          'Uniform deductions',
          'Cooperative contributions'
        ]
      },
      {
        type: 'callout',
        content: 'All calculations are performed automatically by Aero HR. You can review and adjust individual components before finalizing.',
        calloutType: 'success'
      },
      {
        type: 'heading',
        content: 'Payroll Processing Steps',
        level: 2
      },
      {
        type: 'steps',
        content: [
          'Create new payroll period',
          'Add variable components for all employees',
          'Run automatic calculations',
          'Review calculation results',
          'Make adjustments if necessary',
          'Generate payslips',
          'Finalize payroll period',
          'Export reports for accounting'
        ]
      },
      {
        type: 'callout',
        content: 'Always backup your data before finalizing payroll. Finalized payrolls cannot be modified.',
        calloutType: 'warning'
      }
    ],
    relatedArticles: ['pph21-guide', 'bpjs-setup', 'variable-components']
  },

  'pph21-guide': {
    id: 'pph21-guide',
    title: 'PPh 21 Tax Configuration',
    description: 'Complete guide to setting up and managing Indonesian income tax calculations',
    category: 'Compliance',
    type: 'article',
    readTime: 15,
    author: 'Tax Compliance Expert',
    lastUpdated: '2024-01-08',
    tags: ['pph21', 'tax', 'compliance'],
    content: [
      {
        type: 'heading',
        content: 'PPh 21 Income Tax Overview',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'PPh 21 is Indonesian income tax withheld from employee salaries. This comprehensive guide covers everything you need to know about configuring and managing PPh 21 calculations in Aero HR.'
      },
      {
        type: 'callout',
        content: 'PPh 21 calculations must comply with current Indonesian tax regulations. Aero HR is updated regularly to reflect regulatory changes.',
        calloutType: 'info'
      },
      {
        type: 'heading',
        content: 'Understanding Taxable Income',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Not all income is subject to PPh 21. Here\'s what is included:'
      },
      {
        type: 'list',
        content: [
          'Basic salary',
          'Fixed allowances above IDR 500,000/month',
          'Bonus and incentive payments',
          'Overtime payments',
          'Holiday allowances (THR)',
          'Company BPJS contributions'
        ]
      },
      {
        type: 'paragraph',
        content: 'Excluded from taxable income:'
      },
      {
        type: 'list',
        content: [
          'Allowances up to IDR 500,000/month total',
          'Employee BPJS contributions',
          'Occupational cost (5% of gross salary)',
          'PTKP deductions'
        ]
      },
      {
        type: 'heading',
        content: 'PTKP Configuration',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'PTKP (Non-Taxable Income) varies based on marital status and dependents:'
      },
      {
        type: 'code',
        content: `Single (TK):
- TK/0: IDR 54,000,000/year
- TK/1: IDR 58,500,000/year (1 dependent)
- TK/2: IDR 63,000,000/year (2 dependents)
- TK/3: IDR 67,500,000/year (3 dependents)

Married (K):
- K/0: IDR 58,500,000/year
- K/1: IDR 63,000,000/year (1 dependent)
- K/2: IDR 67,500,000/year (2 dependents)
- K/3: IDR 72,000,000/year (3 dependents)`,
        language: 'data'
      },
      {
        type: 'callout',
        content: 'Dependents include children under 25 or disabled children of any age who are fully dependent on the taxpayer.',
        calloutType: 'tip'
      },
      {
        type: 'heading',
        content: 'Tax Calculation Method',
        level: 2
      },
      {
        type: 'steps',
        content: [
          'Calculate annual gross income (including company BPJS)',
          'Subtract occupational cost (5% of gross, max IDR 6M/year)',
          'Subtract employee BPJS contributions',
          'Subtract PTKP amount based on status',
          'Apply progressive tax rates to remaining income',
          'Divide annual tax by 12 for monthly withholding'
        ]
      },
      {
        type: 'heading',
        content: 'Progressive Tax Rates (2024)',
        level: 2
      },
      {
        type: 'code',
        content: `Taxable Income Range          | Tax Rate
IDR 0 - 60,000,000           | 5%
IDR 60,000,001 - 250,000,000 | 15%
IDR 250,000,001 - 500,000,000| 25%
IDR 500,000,001 - 5,000,000,000| 30%
Above IDR 5,000,000,000      | 35%`,
        language: 'table'
      },
      {
        type: 'heading',
        content: 'Monthly vs Annual Calculation',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Aero HR uses the annual calculation method for accuracy:'
      },
      {
        type: 'list',
        content: [
          'Calculates annual tax liability',
          'Divides by 12 for monthly withholding',
          'Adjusts for mid-year salary changes',
          'Handles bonus payments correctly',
          'Reconciles at year-end'
        ]
      },
      {
        type: 'callout',
        content: 'Annual calculation method ensures employees pay the correct amount of tax over the full year, avoiding over or under-withholding.',
        calloutType: 'success'
      },
      {
        type: 'heading',
        content: 'Special Cases',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Aero HR handles various special tax situations:'
      },
      {
        type: 'list',
        content: [
          'Mid-year hires and terminations',
          'Salary changes during the year',
          'Bonus and THR payments',
          'Employees with multiple income sources',
          'Expatriate tax calculations',
          'Part-time and contract workers'
        ]
      },
      {
        type: 'heading',
        content: 'Compliance Reporting',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Aero HR generates all required PPh 21 reports:'
      },
      {
        type: 'list',
        content: [
          'Monthly PPh 21 withholding reports',
          'Annual reconciliation statements',
          'Employee tax certificates (Form 1721-A1)',
          'Quarterly tax reports for DJP',
          'Year-end tax summary reports'
        ]
      },
      {
        type: 'callout',
        content: 'All reports are formatted according to DJP requirements and can be exported in Excel or PDF format.',
        calloutType: 'info'
      },
      {
        type: 'heading',
        content: 'Best Practices',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Keep employee PTKP status updated',
          'Review tax calculations monthly',
          'File PPh 21 reports on time',
          'Maintain proper documentation',
          'Stay updated on tax regulation changes',
          'Perform annual reconciliation'
        ]
      }
    ],
    relatedArticles: ['payroll-calculation', 'employee-management', 'compliance-reports']
  }
}

interface HelpArticleReaderProps {
  className?: string
}

export function HelpArticleReader({ className }: HelpArticleReaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [articleId, setArticleId] = useState<string | null>(null)
  const [article, setArticle] = useState<ArticleContent | null>(null)
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null)

  useEffect(() => {
    const id = searchParams.get('article')
    if (id && helpArticles[id]) {
      setArticleId(id)
      setArticle(helpArticles[id])
    } else {
      setArticleId(null)
      setArticle(null)
    }
  }, [searchParams])

  if (!article) {
    return null
  }

  const handleBack = () => {
    router.push('/help')
  }

  const handleRelatedArticle = (relatedId: string) => {
    router.push(`/help?article=${relatedId}`)
  }

  const handleHelpfulVote = (helpful: boolean) => {
    setIsHelpful(helpful)
    // In a real app, this would send the vote to the backend
  }

  const renderContent = (section: ArticleSection, index: number) => {
    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${section.level || 2}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag 
            key={index}
            className={cn(
              "font-bold text-gray-900 mt-8 mb-4",
              section.level === 1 && "text-3xl mt-0",
              section.level === 2 && "text-2xl",
              section.level === 3 && "text-xl"
            )}
          >
            {section.content}
          </HeadingTag>
        )

      case 'paragraph':
        return (
          <p key={index} className="text-gray-700 leading-relaxed mb-4">
            {section.content}
          </p>
        )

      case 'list':
        return (
          <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-gray-700">
            {(section.content as string[]).map((item, itemIndex) => (
              <li key={itemIndex} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        )

      case 'steps':
        return (
          <ol key={index} className="space-y-3 mb-6">
            {(section.content as string[]).map((step, stepIndex) => (
              <li key={stepIndex} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {stepIndex + 1}
                </div>
                <span className="text-gray-700 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        )

      case 'code':
        return (
          <pre key={index} className="bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-sm font-mono text-gray-800">
              {section.content}
            </code>
          </pre>
        )

      case 'callout':
        const calloutStyles = {
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          success: 'bg-green-50 border-green-200 text-green-800',
          tip: 'bg-purple-50 border-purple-200 text-purple-800'
        }
        
        const calloutIcons = {
          info: Info,
          warning: AlertCircle,
          success: CheckCircle,
          tip: Lightbulb
        }

        const CalloutIcon = calloutIcons[section.calloutType || 'info']

        return (
          <div key={index} className={cn(
            "border rounded-lg p-4 mb-4",
            calloutStyles[section.calloutType || 'info']
          )}>
            <div className="flex items-start space-x-3">
              <CalloutIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{section.content}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Center
        </Button>
      </div>

      {/* Article Header */}
      <ProfessionalCard variant="elevated" className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <Badge variant="outline" className="capitalize">
                  {article.type}
                </Badge>
                <Badge variant="secondary">
                  {article.category}
                </Badge>
                {article.tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <CardTitle className="text-3xl font-bold mb-3">
                {article.title}
              </CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                {article.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} min read</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Last updated: {new Date(article.lastUpdated).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmark
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Article Content */}
      <ProfessionalCard className="mb-8">
        <CardContent className="p-8">
          <div className="prose prose-lg max-w-none">
            {article.content.map((section, index) => renderContent(section, index))}
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Article Feedback */}
      <ProfessionalCard className="mb-8">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="font-semibold mb-4">Was this article helpful?</h3>
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={isHelpful === true ? "default" : "outline"}
                onClick={() => handleHelpfulVote(true)}
                className="flex items-center space-x-2"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Yes, helpful</span>
              </Button>
              <Button
                variant={isHelpful === false ? "default" : "outline"}
                onClick={() => handleHelpfulVote(false)}
                className="flex items-center space-x-2"
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Not helpful</span>
              </Button>
            </div>
            {isHelpful !== null && (
              <p className="text-sm text-muted-foreground mt-3">
                Thank you for your feedback!
              </p>
            )}
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Related Articles */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <ProfessionalCard>
          <CardHeader>
            <CardTitle>Related Articles</CardTitle>
            <CardDescription>
              Continue learning with these related guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {article.relatedArticles.map(relatedId => {
                const relatedArticle = helpArticles[relatedId]
                if (!relatedArticle) return null
                
                return (
                  <div
                    key={relatedId}
                    onClick={() => handleRelatedArticle(relatedId)}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-primary transition-colors">
                          {relatedArticle.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {relatedArticle.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {relatedArticle.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {relatedArticle.readTime} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </ProfessionalCard>
      )}
    </div>
  )
}