"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ProfessionalCard,
  ActionButton,
  StatusBadge,
  EmptyState
} from '@/components/ui/professional'
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Upload,
  Eye,
  Filter,
  Calendar,
  User,
  Settings,
  Database,
  Key,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Building2,
  Users,
  Briefcase,
  Copy,
  RefreshCw,
  ExternalLink,
  Zap,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit,
  Archive
} from 'lucide-react'
import { toast } from 'sonner'

interface ComplianceRule {
  id: string
  name: string
  description: string
  category: 'data_protection' | 'financial' | 'employment' | 'security' | 'operational'
  status: 'compliant' | 'warning' | 'non_compliant' | 'not_applicable'
  priority: 'low' | 'medium' | 'high' | 'critical'
  lastChecked: string
  nextCheck: string
  requirements: string[]
  evidenceCount: number
  responsibleTeam: string
}

interface AuditTrail {
  id: string
  timestamp: string
  userId: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failed' | 'unauthorized'
  details: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  category: 'authentication' | 'data_access' | 'configuration' | 'admin' | 'payroll' | 'employee'
}

interface ComplianceMetrics {
  overallScore: number
  compliantRules: number
  totalRules: number
  criticalIssues: number
  warningIssues: number
  lastAuditDate: string
  nextAuditDue: string
  certifications: {
    name: string
    status: 'active' | 'expired' | 'pending'
    expiryDate: string
    issuer: string
  }[]
}

interface RiskAssessment {
  id: string
  name: string
  category: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  probability: number
  impact: number
  lastAssessed: string
  mitigationStatus: 'planned' | 'in_progress' | 'completed' | 'not_started'
  owner: string
  description: string
}

export function AuditCompliance() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [auditFilter, setAuditFilter] = useState('all')
  const [complianceFilter, setComplianceFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics>({
    overallScore: 87.5,
    compliantRules: 42,
    totalRules: 48,
    criticalIssues: 2,
    warningIssues: 4,
    lastAuditDate: '2024-01-10',
    nextAuditDue: '2024-04-10',
    certifications: [
      {
        name: 'ISO 27001',
        status: 'active',
        expiryDate: '2024-12-31',
        issuer: 'BSI'
      },
      {
        name: 'GDPR Compliance',
        status: 'active',
        expiryDate: '2025-05-25',
        issuer: 'EU Commission'
      },
      {
        name: 'SOC 2 Type II',
        status: 'pending',
        expiryDate: '2024-06-30',
        issuer: 'AICPA'
      }
    ]
  })

  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([
    {
      id: '1',
      name: 'Data Encryption at Rest',
      description: 'All sensitive data must be encrypted using AES-256 encryption',
      category: 'data_protection',
      status: 'compliant',
      priority: 'high',
      lastChecked: '2024-01-14 10:00:00',
      nextCheck: '2024-02-14',
      requirements: ['Database encryption enabled', 'File storage encryption', 'Backup encryption'],
      evidenceCount: 3,
      responsibleTeam: 'IT Security'
    },
    {
      id: '2',
      name: 'Employee Data Access Controls',
      description: 'Role-based access control for employee personal data',
      category: 'data_protection',
      status: 'warning',
      priority: 'critical',
      lastChecked: '2024-01-13 15:30:00',
      nextCheck: '2024-01-20',
      requirements: ['RBAC implementation', 'Regular access reviews', 'Audit logging'],
      evidenceCount: 2,
      responsibleTeam: 'HR & IT'
    },
    {
      id: '3',
      name: 'Payroll Calculation Accuracy',
      description: 'PPh 21 calculations must comply with Indonesian tax regulations',
      category: 'financial',
      status: 'compliant',
      priority: 'critical',
      lastChecked: '2024-01-14 09:15:00',
      nextCheck: '2024-02-01',
      requirements: ['Tax calculation verification', 'PTKP status validation', 'Audit trail maintenance'],
      evidenceCount: 5,
      responsibleTeam: 'Payroll'
    },
    {
      id: '4',
      name: 'Password Policy Enforcement',
      description: 'Strong password requirements for all system users',
      category: 'security',
      status: 'non_compliant',
      priority: 'high',
      lastChecked: '2024-01-12 11:20:00',
      nextCheck: '2024-01-19',
      requirements: ['Minimum length 12 characters', 'Complexity requirements', 'Regular password changes'],
      evidenceCount: 1,
      responsibleTeam: 'IT Security'
    }
  ])

  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([
    {
      id: '1',
      timestamp: '2024-01-14 14:30:15',
      userId: 'admin_001',
      userEmail: 'admin@aerohr.com',
      action: 'Employee Data Access',
      resource: 'Employee Profile',
      resourceId: 'EMP-001',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success',
      details: { employeeId: 'EMP-001', fields: ['salary', 'personal_info'], reason: 'Payroll processing' },
      riskLevel: 'medium',
      category: 'data_access'
    },
    {
      id: '2',
      timestamp: '2024-01-14 14:15:42',
      userId: 'hr_002',
      userEmail: 'maya.putri@aerohr.com',
      action: 'Failed Login Attempt',
      resource: 'Authentication System',
      ipAddress: '203.128.45.67',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'failed',
      details: { reason: 'Invalid credentials', attempts: 3 },
      riskLevel: 'high',
      category: 'authentication'
    },
    {
      id: '3',
      timestamp: '2024-01-14 13:45:20',
      userId: 'payroll_003',
      userEmail: 'payroll@aerohr.com',
      action: 'Payroll Calculation',
      resource: 'Payroll System',
      resourceId: 'PAYROLL-202401',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success',
      details: { employees: 156, totalAmount: 2847500000, period: '2024-01' },
      riskLevel: 'medium',
      category: 'payroll'
    },
    {
      id: '4',
      timestamp: '2024-01-14 12:20:18',
      userId: 'admin_001',
      userEmail: 'admin@aerohr.com',
      action: 'System Configuration Change',
      resource: 'Tax Configuration',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success',
      details: { setting: 'PTKP_TK0', oldValue: 54000000, newValue: 58500000 },
      riskLevel: 'high',
      category: 'configuration'
    }
  ])

  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([
    {
      id: '1',
      name: 'Unauthorized Data Access',
      category: 'Data Security',
      riskLevel: 'high',
      probability: 30,
      impact: 85,
      lastAssessed: '2024-01-10',
      mitigationStatus: 'in_progress',
      owner: 'IT Security Team',
      description: 'Risk of unauthorized access to sensitive employee data'
    },
    {
      id: '2',
      name: 'Payroll Calculation Errors',
      category: 'Financial',
      riskLevel: 'medium',
      probability: 15,
      impact: 70,
      lastAssessed: '2024-01-08',
      mitigationStatus: 'completed',
      owner: 'Payroll Team',
      description: 'Risk of errors in tax calculations or BPJS contributions'
    },
    {
      id: '3',
      name: 'System Downtime',
      category: 'Operational',
      riskLevel: 'medium',
      probability: 25,
      impact: 60,
      lastAssessed: '2024-01-12',
      mitigationStatus: 'planned',
      owner: 'Infrastructure Team',
      description: 'Risk of system unavailability during critical business hours'
    }
  ])

  // Filter functions
  const filteredComplianceRules = useMemo(() => {
    return complianceRules.filter(rule => {
      const matchesSearch = searchQuery === '' || 
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter = complianceFilter === 'all' || rule.category === complianceFilter

      return matchesSearch && matchesFilter
    })
  }, [complianceRules, searchQuery, complianceFilter])

  const filteredAuditTrails = useMemo(() => {
    return auditTrails.filter(trail => {
      const matchesSearch = searchQuery === '' || 
        trail.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trail.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trail.resource.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter = auditFilter === 'all' || trail.category === auditFilter

      return matchesSearch && matchesFilter
    })
  }, [auditTrails, searchQuery, auditFilter])

  useEffect(() => {
    const loadAuditData = async () => {
      try {
        setLoading(true)
        // Simulate loading audit and compliance data
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Error loading audit data:', error)
        toast.error('Failed to load audit and compliance data')
      } finally {
        setLoading(false)
      }
    }

    loadAuditData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'success':
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'non_compliant':
      case 'failed':
      case 'unauthorized':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'not_applicable':
      case 'not_started':
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
  }

  const handleRunCompliance = async (ruleId: string) => {
    try {
      toast.success('Running compliance check...')
      // Simulate compliance check
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Compliance check completed')
    } catch (error) {
      toast.error('Failed to run compliance check')
    }
  }

  const handleExportAuditLog = () => {
    toast.success('Audit log exported successfully')
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <ProfessionalCard>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>Loading audit and compliance data...</span>
            </div>
          </CardContent>
        </ProfessionalCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Audit & Compliance</CardTitle>
                  <CardDescription className="text-base">
                    Monitor compliance status, audit trails, and risk assessments
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <Badge className={`${getStatusColor('compliant')} flex items-center space-x-1`}>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{complianceMetrics.overallScore}% Compliant</span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Last Audit: {complianceMetrics.lastAuditDate}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {complianceMetrics.criticalIssues} Critical Issues
                </Badge>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex items-center space-x-2">
                <ActionButton variant="secondary" onClick={handleExportAuditLog}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </ActionButton>
                <ActionButton variant="primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Audit
                </ActionButton>
              </div>
              <div className="text-sm text-muted-foreground">
                Next Audit Due: <span className="font-medium text-orange-600">{complianceMetrics.nextAuditDue}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Trails
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Compliance Score Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm">Compliance Score</CardTitle>
                  </div>
                  <Badge className={getStatusColor('compliant')}>
                    {complianceMetrics.overallScore}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Progress value={complianceMetrics.overallScore} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {complianceMetrics.compliantRules} of {complianceMetrics.totalRules} rules compliant
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-sm">Critical Issues</CardTitle>
                  </div>
                  <Badge className={getRiskColor('critical')}>
                    {complianceMetrics.criticalIssues}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-lg font-bold text-red-600">
                  {complianceMetrics.criticalIssues} Issues
                </div>
                <div className="text-xs text-muted-foreground">
                  Require immediate attention
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-sm">Warnings</CardTitle>
                  </div>
                  <Badge className={getRiskColor('medium')}>
                    {complianceMetrics.warningIssues}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-lg font-bold text-yellow-600">
                  {complianceMetrics.warningIssues} Warnings
                </div>
                <div className="text-xs text-muted-foreground">
                  Need attention soon
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-sm">Next Audit</CardTitle>
                  </div>
                  <Badge variant="outline">
                    Due Soon
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-lg font-bold text-blue-600">
                  {complianceMetrics.nextAuditDue}
                </div>
                <div className="text-xs text-muted-foreground">
                  Quarterly compliance review
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>

          {/* Compliance Categories */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <span>Compliance by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { category: 'Data Protection', compliant: 8, total: 10, color: 'bg-blue-500' },
                  { category: 'Financial', compliant: 12, total: 14, color: 'bg-green-500' },
                  { category: 'Employment', compliant: 15, total: 15, color: 'bg-green-500' },
                  { category: 'Security', compliant: 5, total: 7, color: 'bg-yellow-500' },
                  { category: 'Operational', compliant: 2, total: 2, color: 'bg-green-500' }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.category}</span>
                      <span className="font-medium">{item.compliant}/{item.total}</span>
                    </div>
                    <Progress 
                      value={(item.compliant / item.total) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-purple-600" />
                  <span>Active Certifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceMetrics.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Expires: {cert.expiryDate} • {cert.issuer}
                      </div>
                    </div>
                    <Badge className={getStatusColor(cert.status)}>
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </ProfessionalCard>
          </div>

          {/* Recent Activity */}
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Recent Compliance Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrails.slice(0, 5).map((trail) => (
                  <div key={trail.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${
                        trail.status === 'success' ? 'bg-green-500' :
                        trail.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{trail.action}</div>
                        <div className="text-xs text-muted-foreground">{trail.timestamp}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {trail.userEmail} • {trail.resource}
                      </div>
                    </div>
                    <Badge className={getRiskColor(trail.riskLevel)} variant="outline">
                      {trail.riskLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                    <span>Compliance Rules</span>
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage organizational compliance requirements
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <ActionButton variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </ActionButton>
                  <ActionButton variant="primary" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </ActionButton>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search compliance rules..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="data_protection">Data Protection</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rules List */}
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredComplianceRules.length === 0 ? (
                      <EmptyState
                        icon={FileCheck}
                        title="No compliance rules found"
                        description="No compliance rules match your current filters."
                        action={{
                          label: "Clear Filters",
                          onClick: () => {
                            setSearchQuery('')
                            setComplianceFilter('all')
                          }
                        }}
                      />
                    ) : (
                      filteredComplianceRules.map((rule) => (
                        <ProfessionalCard key={rule.id} variant="interactive" className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  {getPriorityIcon(rule.priority)}
                                  <CardTitle className="text-base">{rule.name}</CardTitle>
                                  <Badge className={getStatusColor(rule.status)}>
                                    {rule.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {rule.category.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <CardDescription className="text-sm">
                                  {rule.description}
                                </CardDescription>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <ActionButton variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </ActionButton>
                                <ActionButton variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </ActionButton>
                                <ActionButton 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRunCompliance(rule.id)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </ActionButton>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Checked:</span>
                                  <span className="font-medium">{rule.lastChecked}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Next Check:</span>
                                  <span className="font-medium">{rule.nextCheck}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Evidence Files:</span>
                                  <span className="font-medium">{rule.evidenceCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Owner:</span>
                                  <span className="font-medium">{rule.responsibleTeam}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Requirements:</Label>
                              <div className="flex flex-wrap gap-1">
                                {rule.requirements.map((req, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </ProfessionalCard>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Audit Trails Tab */}
        <TabsContent value="audit" className="space-y-6">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Audit Trail</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive log of system activities and user actions
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <ActionButton variant="outline" size="sm" onClick={handleExportAuditLog}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </ActionButton>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Audit Filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search audit logs..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={auditFilter} onValueChange={setAuditFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="data_access">Data Access</SelectItem>
                      <SelectItem value="configuration">Configuration</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Audit Log */}
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredAuditTrails.length === 0 ? (
                      <EmptyState
                        icon={Activity}
                        title="No audit logs found"
                        description="No audit logs match your current filters."
                        action={{
                          label: "Clear Filters",
                          onClick: () => {
                            setSearchQuery('')
                            setAuditFilter('all')
                          }
                        }}
                      />
                    ) : (
                      filteredAuditTrails.map((trail) => (
                        <div key={trail.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-2 h-2 rounded-full ${
                              trail.status === 'success' ? 'bg-green-500' :
                              trail.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className={getRiskColor(trail.riskLevel)} variant="outline">
                                  {trail.riskLevel}
                                </Badge>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {trail.category.replace('_', ' ')}
                                </Badge>
                                <Badge className={getStatusColor(trail.status)} variant="outline">
                                  {trail.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">{trail.timestamp}</span>
                                <ActionButton 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(trail.id, 'Audit ID')}
                                >
                                  <Copy className="h-3 w-3" />
                                </ActionButton>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium">{trail.action}</p>
                              <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                                <div className="space-y-1">
                                  <div><span className="font-medium">User:</span> {trail.userEmail}</div>
                                  <div><span className="font-medium">Resource:</span> {trail.resource}</div>
                                  {trail.resourceId && (
                                    <div><span className="font-medium">Resource ID:</span> {trail.resourceId}</div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div><span className="font-medium">IP Address:</span> {trail.ipAddress}</div>
                                  <div><span className="font-medium">User Agent:</span> {trail.userAgent.substring(0, 50)}...</div>
                                </div>
                              </div>
                              
                              {Object.keys(trail.details).length > 0 && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <span className="font-medium">Details:</span>
                                  <pre className="mt-1 text-muted-foreground">
                                    {JSON.stringify(trail.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-6">
          <div className="grid gap-6">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span>Risk Assessment Matrix</span>
                    </CardTitle>
                    <CardDescription>
                      Evaluate and monitor organizational risk factors
                    </CardDescription>
                  </div>
                  <ActionButton variant="primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Risk
                  </ActionButton>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {riskAssessments.map((risk) => (
                    <ProfessionalCard key={risk.id} variant="interactive" className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-base">{risk.name}</CardTitle>
                              <Badge className={getRiskColor(risk.riskLevel)}>
                                {risk.riskLevel} risk
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {risk.category}
                              </Badge>
                            </div>
                            <CardDescription className="text-sm">
                              {risk.description}
                            </CardDescription>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <ActionButton variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </ActionButton>
                            <ActionButton variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </ActionButton>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Probability</Label>
                            <div className="flex items-center space-x-2">
                              <Progress value={risk.probability} className="flex-1 h-2" />
                              <span className="text-sm font-medium w-10">{risk.probability}%</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Impact</Label>
                            <div className="flex items-center space-x-2">
                              <Progress value={risk.impact} className="flex-1 h-2" />
                              <span className="text-sm font-medium w-10">{risk.impact}%</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Risk Score</Label>
                            <div className="text-lg font-bold">
                              {Math.round((risk.probability * risk.impact) / 100)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Assessed:</span>
                              <span className="font-medium">{risk.lastAssessed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Owner:</span>
                              <span className="font-medium">{risk.owner}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mitigation:</span>
                              <Badge className={getStatusColor(risk.mitigationStatus)}>
                                {risk.mitigationStatus.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </ProfessionalCard>
                  ))}
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Compliance Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Monthly Compliance Report', date: '2024-01-31', status: 'ready' },
                  { name: 'Data Protection Audit', date: '2024-01-15', status: 'ready' },
                  { name: 'Security Assessment', date: '2024-01-10', status: 'generating' },
                  { name: 'Risk Analysis Report', date: '2024-01-05', status: 'ready' }
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{report.name}</div>
                      <div className="text-xs text-muted-foreground">Generated: {report.date}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      {report.status === 'ready' && (
                        <ActionButton variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </ActionButton>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span>Report Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Report Frequency</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Include Sections</Label>
                    <div className="space-y-2">
                      {[
                        'Compliance Score',
                        'Risk Assessment', 
                        'Audit Summary',
                        'Recommendations',
                        'Certification Status'
                      ].map((section, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox defaultChecked />
                          <Label className="text-sm">{section}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <ActionButton variant="primary" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Report
                  </ActionButton>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}