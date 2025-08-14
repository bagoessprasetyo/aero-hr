"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ProfessionalCard,
  ActionButton,
  StatusBadge,
  EmptyState
} from '@/components/ui/professional'
import {
  Database,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Shield,
  Key,
  Settings,
  FileText,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Copy,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Square,
  MonitorSpeaker,
  Wifi,
  Mail,
  Bell,
  Eye,
  Archive,
  Zap,
  Users,
  Building2,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'critical'
    connections: number
    maxConnections: number
    queryTime: number
    storage: number
    backups: number
    lastBackup: string
  }
  server: {
    status: 'running' | 'stopped' | 'maintenance'
    uptime: string
    cpu: number
    memory: number
    disk: number
    requests: number
    errors: number
  }
  cache: {
    status: 'active' | 'inactive' | 'clearing'
    hitRate: number
    size: number
    keys: number
    memory: number
  }
  security: {
    status: 'secure' | 'warning' | 'vulnerable'
    authEnabled: boolean
    sslEnabled: boolean
    firewallActive: boolean
    lastScan: string
    vulnerabilities: number
  }
}

interface SystemConfig {
  general: {
    siteName: string
    siteDescription: string
    timezone: string
    language: string
    dateFormat: string
    maintenanceMode: boolean
  }
  database: {
    host: string
    port: number
    name: string
    maxConnections: number
    timeout: number
    backupEnabled: boolean
    backupFrequency: string
  }
  email: {
    provider: string
    host: string
    port: number
    username: string
    secure: boolean
    enabled: boolean
  }
  notifications: {
    emailEnabled: boolean
    pushEnabled: boolean
    smsEnabled: boolean
    adminAlerts: boolean
    userNotifications: boolean
  }
  security: {
    sessionTimeout: number
    passwordMinLength: number
    requireTwoFactor: boolean
    loginAttempts: number
    lockoutDuration: number
  }
  performance: {
    cacheEnabled: boolean
    compressionEnabled: boolean
    cdnEnabled: boolean
    maxUploadSize: number
    requestTimeout: number
  }
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'critical'
  category: string
  message: string
  details?: string
  userId?: string
  ip?: string
}

export function SystemConfiguration() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [logFilter, setLogFilter] = useState('all')
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: {
      status: 'healthy',
      connections: 45,
      maxConnections: 100,
      queryTime: 12.5,
      storage: 67,
      backups: 14,
      lastBackup: '2 hours ago'
    },
    server: {
      status: 'running',
      uptime: '15 days, 4 hours',
      cpu: 23,
      memory: 68,
      disk: 45,
      requests: 15420,
      errors: 3
    },
    cache: {
      status: 'active',
      hitRate: 94.2,
      size: 128,
      keys: 2847,
      memory: 45
    },
    security: {
      status: 'secure',
      authEnabled: true,
      sslEnabled: true,
      firewallActive: true,
      lastScan: '1 day ago',
      vulnerabilities: 0
    }
  })

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    general: {
      siteName: 'Aero HR',
      siteDescription: 'Comprehensive HR Management System',
      timezone: 'Asia/Jakarta',
      language: 'id',
      dateFormat: 'dd/MM/yyyy',
      maintenanceMode: false
    },
    database: {
      host: 'localhost',
      port: 5432,
      name: 'aero_hr',
      maxConnections: 100,
      timeout: 30,
      backupEnabled: true,
      backupFrequency: 'daily'
    },
    email: {
      provider: 'smtp',
      host: 'smtp.gmail.com',
      port: 587,
      username: 'system@aerohr.com',
      secure: true,
      enabled: true
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: false,
      smsEnabled: false,
      adminAlerts: true,
      userNotifications: true
    },
    security: {
      sessionTimeout: 1440,
      passwordMinLength: 8,
      requireTwoFactor: false,
      loginAttempts: 5,
      lockoutDuration: 15
    },
    performance: {
      cacheEnabled: true,
      compressionEnabled: true,
      cdnEnabled: false,
      maxUploadSize: 10,
      requestTimeout: 30
    }
  })

  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2024-01-14 10:30:15',
      level: 'info',
      category: 'System',
      message: 'System backup completed successfully',
      details: 'Database backup completed in 4.2 seconds. 2.1GB archived.',
      userId: 'system'
    },
    {
      id: '2',
      timestamp: '2024-01-14 09:15:42',
      level: 'warning',
      category: 'Performance',
      message: 'High memory usage detected',
      details: 'Memory usage exceeded 85% threshold (68% current)',
      ip: '192.168.1.100'
    },
    {
      id: '3',
      timestamp: '2024-01-14 08:45:23',
      level: 'info',
      category: 'Security',
      message: 'User authentication successful',
      details: 'Administrator login from trusted IP',
      userId: 'admin',
      ip: '192.168.1.50'
    },
    {
      id: '4',
      timestamp: '2024-01-14 08:20:11',
      level: 'error',
      category: 'Database',
      message: 'Query timeout exceeded',
      details: 'SELECT query on employees table took 45.2 seconds',
      userId: 'hr_user'
    },
    {
      id: '5',
      timestamp: '2024-01-14 07:30:00',
      level: 'info',
      category: 'Maintenance',
      message: 'Cache cleared successfully',
      details: 'Application cache cleared. 2,847 keys removed.',
      userId: 'system'
    }
  ])

  // Filter logs based on search and filter
  const filteredLogs = useMemo(() => {
    return systemLogs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter = logFilter === 'all' || log.level === logFilter

      return matchesSearch && matchesFilter
    })
  }, [systemLogs, searchQuery, logFilter])

  useEffect(() => {
    const loadSystemData = async () => {
      try {
        setLoading(true)
        // Simulate loading system data
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Error loading system data:', error)
        toast.error('Failed to load system configuration')
      } finally {
        setLoading(false)
      }
    }

    loadSystemData()
  }, [])

  const handleConfigChange = (section: keyof SystemConfig, key: string, value: any) => {
    setSystemConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const handleSaveConfig = async () => {
    try {
      // Simulate saving configuration
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('System configuration saved successfully')
    } catch (error) {
      toast.error('Failed to save configuration')
    }
  }

  const handleRestartService = async (service: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`${service} service restarted successfully`)
    } catch (error) {
      toast.error(`Failed to restart ${service} service`)
    }
  }

  const handleClearCache = async () => {
    try {
      setSystemHealth(prev => ({
        ...prev,
        cache: { ...prev.cache, status: 'clearing' }
      }))
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSystemHealth(prev => ({
        ...prev,
        cache: { 
          ...prev.cache, 
          status: 'active',
          keys: 0,
          size: 0,
          memory: 0
        }
      }))
      
      toast.success('Cache cleared successfully')
    } catch (error) {
      toast.error('Failed to clear cache')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'active':
      case 'secure':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
      case 'vulnerable':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'stopped':
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <ProfessionalCard>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>Loading system configuration...</span>
            </div>
          </CardContent>
        </ProfessionalCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">System Configuration</CardTitle>
                  <CardDescription className="text-base">
                    Manage system settings, monitor health, and configure services
                  </CardDescription>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ActionButton variant="secondary" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </ActionButton>
              <ActionButton variant="primary" onClick={handleSaveConfig}>
                <Settings className="h-4 w-4 mr-2" />
                Save Config
              </ActionButton>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Health Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-sm">Database</CardTitle>
                  </div>
                  <Badge className={getStatusColor(systemHealth.database.status)}>
                    {systemHealth.database.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Connections</span>
                    <span className="font-medium">
                      {systemHealth.database.connections}/{systemHealth.database.maxConnections}
                    </span>
                  </div>
                  <Progress value={(systemHealth.database.connections / systemHealth.database.maxConnections) * 100} className="h-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Query Time:</span>
                    <div className="font-medium">{systemHealth.database.queryTime}ms</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Storage:</span>
                    <div className="font-medium">{systemHealth.database.storage}%</div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm">Server</CardTitle>
                  </div>
                  <Badge className={getStatusColor(systemHealth.server.status)}>
                    {systemHealth.server.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span className="font-medium">{systemHealth.server.cpu}%</span>
                  </div>
                  <Progress value={systemHealth.server.cpu} className="h-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Memory:</span>
                    <div className="font-medium">{systemHealth.server.memory}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Disk:</span>
                    <div className="font-medium">{systemHealth.server.disk}%</div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-sm">Cache</CardTitle>
                  </div>
                  <Badge className={getStatusColor(systemHealth.cache.status)}>
                    {systemHealth.cache.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate</span>
                    <span className="font-medium">{systemHealth.cache.hitRate}%</span>
                  </div>
                  <Progress value={systemHealth.cache.hitRate} className="h-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Keys:</span>
                    <div className="font-medium">{systemHealth.cache.keys.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <div className="font-medium">{systemHealth.cache.size}MB</div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="interactive">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-sm">Security</CardTitle>
                  </div>
                  <Badge className={getStatusColor(systemHealth.security.status)}>
                    {systemHealth.security.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto ${systemHealth.security.authEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="text-xs mt-1">Auth</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto ${systemHealth.security.sslEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="text-xs mt-1">SSL</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto ${systemHealth.security.firewallActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="text-xs mt-1">Firewall</div>
                  </div>
                </div>
                <div className="text-xs text-center">
                  <span className="text-muted-foreground">Last scan:</span>
                  <div className="font-medium">{systemHealth.security.lastScan}</div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>

          {/* System Statistics */}
          <div className="grid gap-6 md:grid-cols-2">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                  <ActionButton variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </ActionButton>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Requests Today</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{systemHealth.server.requests.toLocaleString()}</div>
                      <div className="text-xs text-green-600">+12.5%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Error Rate</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{systemHealth.server.errors}</div>
                      <div className="text-xs text-red-600">0.02%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Uptime</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{systemHealth.server.uptime}</div>
                      <div className="text-xs text-green-600">99.9%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5 text-purple-600" />
                    <span>Storage & Backups</span>
                  </CardTitle>
                  <ActionButton variant="outline" size="sm" onClick={handleClearCache}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </ActionButton>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Database Storage</span>
                      <span className="font-medium">{systemHealth.database.storage}%</span>
                    </div>
                    <Progress value={systemHealth.database.storage} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Archive className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Backups Available</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{systemHealth.database.backups}</div>
                      <div className="text-xs text-muted-foreground">Last: {systemHealth.database.lastBackup}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>

          {/* Quick Actions */}
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Common system administration tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ActionButton 
                  variant="outline" 
                  className="flex-col h-20 space-y-2"
                  onClick={() => handleRestartService('Application')}
                >
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Restart App</span>
                </ActionButton>
                <ActionButton 
                  variant="outline" 
                  className="flex-col h-20 space-y-2"
                  onClick={handleClearCache}
                >
                  <Trash2 className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">Clear Cache</span>
                </ActionButton>
                <ActionButton 
                  variant="outline" 
                  className="flex-col h-20 space-y-2"
                  onClick={() => setActiveTab('logs')}
                >
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm">View Logs</span>
                </ActionButton>
                <ActionButton 
                  variant="outline" 
                  className="flex-col h-20 space-y-2"
                  onClick={() => setActiveTab('security')}
                >
                  <Shield className="h-5 w-5 text-red-600" />
                  <span className="text-sm">Security</span>
                </ActionButton>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Database Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="db-host">Database Host</Label>
                    <Input
                      id="db-host"
                      value={systemConfig.database.host}
                      onChange={(e) => handleConfigChange('database', 'host', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="db-port">Port</Label>
                    <Input
                      id="db-port"
                      type="number"
                      value={systemConfig.database.port}
                      onChange={(e) => handleConfigChange('database', 'port', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="db-name">Database Name</Label>
                    <Input
                      id="db-name"
                      value={systemConfig.database.name}
                      onChange={(e) => handleConfigChange('database', 'name', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max-connections">Max Connections</Label>
                    <Input
                      id="max-connections"
                      type="number"
                      value={systemConfig.database.maxConnections}
                      onChange={(e) => handleConfigChange('database', 'maxConnections', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Archive className="h-5 w-5 text-green-600" />
                  <span>Backup Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Enable automatic database backups</p>
                  </div>
                  <Switch
                    checked={systemConfig.database.backupEnabled}
                    onCheckedChange={(checked) => handleConfigChange('database', 'backupEnabled', checked)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Backup Frequency</Label>
                  <Select
                    value={systemConfig.database.backupFrequency}
                    onValueChange={(value) => handleConfigChange('database', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-2">
                    <ActionButton variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Create Backup
                    </ActionButton>
                    <ActionButton variant="outline" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Restore
                    </ActionButton>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>

          <ProfessionalCard variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span>Database Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Connections</span>
                    <span className="font-medium">{systemHealth.database.connections}</span>
                  </div>
                  <Progress value={(systemHealth.database.connections / systemHealth.database.maxConnections) * 100} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {systemHealth.database.connections} of {systemHealth.database.maxConnections} used
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Query Performance</span>
                    <span className="font-medium">{systemHealth.database.queryTime}ms</span>
                  </div>
                  <Progress value={Math.min((systemHealth.database.queryTime / 100) * 100, 100)} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Average response time
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage Usage</span>
                    <span className="font-medium">{systemHealth.database.storage}%</span>
                  </div>
                  <Progress value={systemHealth.database.storage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Database storage utilization
                  </div>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-6">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-green-600" />
                  <span>System Services</span>
                </CardTitle>
                <CardDescription>
                  Manage and monitor critical system services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Web Server', status: 'running', port: '3000', cpu: '15%', memory: '245MB' },
                    { name: 'Database', status: 'running', port: '5432', cpu: '8%', memory: '1.2GB' },
                    { name: 'Cache Server', status: 'running', port: '6379', cpu: '3%', memory: '128MB' },
                    { name: 'Email Service', status: 'running', port: '587', cpu: '1%', memory: '45MB' },
                    { name: 'Background Jobs', status: 'running', port: '-', cpu: '12%', memory: '180MB' }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {service.status === 'running' ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          ) : (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Port: {service.port}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground">
                          CPU: {service.cpu} | RAM: {service.memory}
                        </div>
                        <div className="flex space-x-1">
                          <ActionButton variant="ghost" size="sm">
                            <Play className="h-3 w-3" />
                          </ActionButton>
                          <ActionButton variant="ghost" size="sm">
                            <Pause className="h-3 w-3" />
                          </ActionButton>
                          <ActionButton variant="ghost" size="sm">
                            <RefreshCw className="h-3 w-3" />
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </ProfessionalCard>

            <div className="grid gap-6 md:grid-cols-2">
              <ProfessionalCard variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Email Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email-host">SMTP Host</Label>
                      <Input
                        id="email-host"
                        value={systemConfig.email.host}
                        onChange={(e) => handleConfigChange('email', 'host', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email-port">Port</Label>
                      <Input
                        id="email-port"
                        type="number"
                        value={systemConfig.email.port}
                        onChange={(e) => handleConfigChange('email', 'port', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email-username">Username</Label>
                      <Input
                        id="email-username"
                        value={systemConfig.email.username}
                        onChange={(e) => handleConfigChange('email', 'username', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>SSL/TLS Enabled</Label>
                        <p className="text-sm text-muted-foreground">Use secure connection</p>
                      </div>
                      <Switch
                        checked={systemConfig.email.secure}
                        onCheckedChange={(checked) => handleConfigChange('email', 'secure', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </ProfessionalCard>

              <ProfessionalCard variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    <span>Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send system alerts via email</p>
                      </div>
                      <Switch
                        checked={systemConfig.notifications.emailEnabled}
                        onCheckedChange={(checked) => handleConfigChange('notifications', 'emailEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Admin Alerts</Label>
                        <p className="text-sm text-muted-foreground">Critical system notifications</p>
                      </div>
                      <Switch
                        checked={systemConfig.notifications.adminAlerts}
                        onCheckedChange={(checked) => handleConfigChange('notifications', 'adminAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>User Notifications</Label>
                        <p className="text-sm text-muted-foreground">Employee-facing notifications</p>
                      </div>
                      <Switch
                        checked={systemConfig.notifications.userNotifications}
                        onCheckedChange={(checked) => handleConfigChange('notifications', 'userNotifications', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </ProfessionalCard>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={systemConfig.security.sessionTimeout}
                      onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="password-length">Minimum Password Length</Label>
                    <Input
                      id="password-length"
                      type="number"
                      value={systemConfig.security.passwordMinLength}
                      onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="login-attempts">Max Login Attempts</Label>
                    <Input
                      id="login-attempts"
                      type="number"
                      value={systemConfig.security.loginAttempts}
                      onChange={(e) => handleConfigChange('security', 'loginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                    </div>
                    <Switch
                      checked={systemConfig.security.requireTwoFactor}
                      onCheckedChange={(checked) => handleConfigChange('security', 'requireTwoFactor', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  <span>Security Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Authentication Enabled</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">SSL Certificate</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Firewall Protection</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Protected</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Security Scan</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <ActionButton variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Run Security Scan
                  </ActionButton>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>System Logs</span>
                  </CardTitle>
                  <CardDescription>
                    Monitor system activity and troubleshoot issues
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <ActionButton variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </ActionButton>
                  <ActionButton variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </ActionButton>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Log Filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search logs..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={logFilter} onValueChange={setLogFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Logs List */}
                <ScrollArea className="h-[500px] border rounded-lg">
                  <div className="p-4">
                    {filteredLogs.length === 0 ? (
                      <EmptyState
                        icon={FileText}
                        title="No logs found"
                        description="No system logs match your current filters."
                        action={{
                          label: "Clear Filters",
                          onClick: () => {
                            setSearchQuery('')
                            setLogFilter('all')
                          }
                        }}
                      />
                    ) : (
                      <div className="space-y-3">
                        {filteredLogs.map((log) => (
                          <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-shrink-0 mt-0.5">
                              {getLevelIcon(log.level)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className={`text-xs ${
                                    log.level === 'error' || log.level === 'critical' ? 'text-red-600 border-red-200' :
                                    log.level === 'warning' ? 'text-yellow-600 border-yellow-200' :
                                    'text-blue-600 border-blue-200'
                                  }`}>
                                    {log.level}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {log.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                                  <ActionButton 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => copyToClipboard(log.message, 'Log message')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </ActionButton>
                                </div>
                              </div>
                              <p className="text-sm font-medium mt-1">{log.message}</p>
                              {log.details && (
                                <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                              )}
                              {(log.userId || log.ip) && (
                                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                  {log.userId && (
                                    <span>User: {log.userId}</span>
                                  )}
                                  {log.ip && (
                                    <span>IP: {log.ip}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span>General Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input
                      id="site-name"
                      value={systemConfig.general.siteName}
                      onChange={(e) => handleConfigChange('general', 'siteName', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="site-description">Description</Label>
                    <Textarea
                      id="site-description"
                      value={systemConfig.general.siteDescription}
                      onChange={(e) => handleConfigChange('general', 'siteDescription', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Timezone</Label>
                    <Select
                      value={systemConfig.general.timezone}
                      onValueChange={(value) => handleConfigChange('general', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                        <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                        <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Language</Label>
                    <Select
                      value={systemConfig.general.language}
                      onValueChange={(value) => handleConfigChange('general', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Disable access for maintenance</p>
                    </div>
                    <Switch
                      checked={systemConfig.general.maintenanceMode}
                      onCheckedChange={(checked) => handleConfigChange('general', 'maintenanceMode', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            <ProfessionalCard variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  <span>Performance Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Caching</Label>
                      <p className="text-sm text-muted-foreground">Improve performance with caching</p>
                    </div>
                    <Switch
                      checked={systemConfig.performance.cacheEnabled}
                      onCheckedChange={(checked) => handleConfigChange('performance', 'cacheEnabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Compression</Label>
                      <p className="text-sm text-muted-foreground">Enable gzip compression</p>
                    </div>
                    <Switch
                      checked={systemConfig.performance.compressionEnabled}
                      onCheckedChange={(checked) => handleConfigChange('performance', 'compressionEnabled', checked)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="upload-size">Max Upload Size (MB)</Label>
                    <Input
                      id="upload-size"
                      type="number"
                      value={systemConfig.performance.maxUploadSize}
                      onChange={(e) => handleConfigChange('performance', 'maxUploadSize', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="request-timeout">Request Timeout (seconds)</Label>
                    <Input
                      id="request-timeout"
                      type="number"
                      value={systemConfig.performance.requestTimeout}
                      onChange={(e) => handleConfigChange('performance', 'requestTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>

          <ProfessionalCard variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-green-600" />
                <span>Configuration Management</span>
              </CardTitle>
              <CardDescription>
                Backup, restore, and manage system configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <ActionButton variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </ActionButton>
                <ActionButton variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Config
                </ActionButton>
                <ActionButton variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </ActionButton>
                <ActionButton variant="primary" onClick={handleSaveConfig}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save All Changes
                </ActionButton>
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}