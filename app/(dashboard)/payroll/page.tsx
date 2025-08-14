"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/rbac/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calculator, FileText, Users, TrendingUp, DollarSign, Clock, CheckCircle, AlertTriangle, Calendar, Target, BarChart3 } from "lucide-react"
import { CreatePayrollForm } from "@/components/payroll/create-payroll-form"
import { PayrollPeriodList } from "@/components/payroll/payroll-period-list"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { Payroll } from "@/lib/types/database"
import { useRouter } from "next/navigation"
import { 
  ProfessionalCard, 
  DashboardWidget, 
  StatusBadge, 
  ActionButton, 
  EmptyState, 
  LoadingSkeleton,
  QuickActionGrid,
  InteractiveStatsCard
} from "@/components/ui/professional"

const payrollService = new PayrollService()

export default function PayrollPage() {
  return (
    <ProtectedRoute permission="payroll.read">
      <PayrollPageContent />
    </ProtectedRoute>
  )
}

function PayrollPageContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    calculated: 0,
    finalized: 0,
    yearlyTotal: 0
  })
  const [recentPayrolls, setRecentPayrolls] = useState<Payroll[]>([])
  const router = useRouter()

  useEffect(() => {
    loadStats()
    loadRecentPayrolls()
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      setLoading(true)
      const payrollStats = await payrollService.getPayrollStats()
      setStats(payrollStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentPayrolls = async () => {
    try {
      const payrolls = await payrollService.getPayrollPeriods({ limit: 5 })
      setRecentPayrolls(payrolls)
    } catch (error) {
      console.error('Error loading recent payrolls:', error)
    }
  }

  const handlePayrollCreated = (payroll: any) => {
    setIsCreateDialogOpen(false)
    setRefreshTrigger(prev => prev + 1)
    // Redirect to the payroll detail/edit page
    router.push(`/payroll/${payroll.id}`)
  }

  const handleViewPayroll = (payroll: Payroll) => {
    router.push(`/payroll/${payroll.id}`)
  }

  const handleEditPayroll = (payroll: Payroll) => {
    router.push(`/payroll/${payroll.id}/edit`)
  }

  // Calculate completion rate and trends
  const completionRate = stats.total > 0 ? (stats.finalized / stats.total) * 100 : 0
  const pendingItems = stats.draft + stats.calculated
  const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  
  // Quick action items
  const quickActions = [
    {
      icon: Plus,
      label: "New Payroll",
      description: "Create period",
      onClick: () => setIsCreateDialogOpen(true),
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      icon: Calculator,
      label: "Calculate",
      description: "Run calculations",
      onClick: () => router.push('/payroll?tab=calculate'),
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      icon: BarChart3,
      label: "Reports",
      description: "View analytics",
      onClick: () => router.push('/payroll?tab=reports'),
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      icon: FileText,
      label: "Export",
      description: "Download data",
      onClick: () => router.push('/payroll?tab=export'),
      color: "bg-orange-600 hover:bg-orange-700"
    }
  ]

  // Payroll status distribution for stats card
  const statusDistribution = [
    { label: "Draft", value: stats.draft, color: "#94a3b8" },
    { label: "Calculated", value: stats.calculated, color: "#3b82f6" },
    { label: "Finalized", value: stats.finalized, color: "#10b981" }
  ].filter(item => item.value > 0)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
            </div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Modern Header */}
      <ProfessionalCard  variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-gray-600" />
                <span>Payroll Processing</span>
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Manage monthly payroll calculations with Indonesian compliance (BPJS & PPh 21)
              </CardDescription>
              <div className="flex items-center space-x-4 mt-4">
                <StatusBadge status="success">
                  <Calendar className="h-3 w-3 mr-1" />
                  {currentMonth}
                </StatusBadge>
                {pendingItems > 0 && (
                  <StatusBadge status="warning">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {pendingItems} Pending
                  </StatusBadge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <ActionButton variant="primary" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Payroll
                  </ActionButton>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Payroll Period</DialogTitle>
                    <DialogDescription>
                      Create a new payroll period for monthly salary calculations
                    </DialogDescription>
                  </DialogHeader>
                  <CreatePayrollForm 
                    onSuccess={handlePayrollCreated}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Enhanced Stats Dashboard */}
      <div className="grid gap-6 md:grid-cols-4">
        <DashboardWidget
          title="Total Periods"
          value={stats.total}
          subtitle={`${stats.total} payroll periods created`}
          icon={FileText}
          trend={stats.total > 0 ? {
            value: completionRate,
            isPositive: completionRate > 75,
            label: `${completionRate.toFixed(0)}% completed`
          } : undefined}
        />
        
        <DashboardWidget
          title="Pending Actions"
          value={pendingItems}
          subtitle={`${stats.draft} draft, ${stats.calculated} calculated`}
          icon={Clock}
          trend={pendingItems > 0 ? {
            value: (pendingItems / stats.total) * 100,
            isPositive: false,
            label: "needs attention"
          } : undefined}
        />
        
        <DashboardWidget
          title="Completed"
          value={stats.finalized}
          subtitle={`Successfully finalized payrolls`}
          icon={CheckCircle}
          trend={stats.finalized > 0 ? {
            value: completionRate,
            isPositive: true,
            label: "completion rate"
          } : undefined}
        />
        
        <DashboardWidget
          title="Yearly Total"
          value={formatCurrency(stats.yearlyTotal)}
          subtitle={`Total payroll costs ${new Date().getFullYear()}`}
          icon={Target}
          trend={{
            value: 12.5,
            isPositive: true,
            label: "vs last year"
          }}
        />
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <ProfessionalCard >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common payroll operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActionGrid actions={quickActions} />
          </CardContent>
        </ProfessionalCard>

        {/* Status Distribution */}
        <ProfessionalCard >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Status Distribution</span>
            </CardTitle>
            <CardDescription>
              Payroll periods by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <InteractiveStatsCard
                title=""
                stats={statusDistribution}
                onItemClick={(item) => router.push(`/payroll?status=${item.label.toLowerCase()}`)}
              />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No payroll data"
                description="Create your first payroll to see status distribution"
                action={{
                  label: "Create Payroll",
                  onClick: () => setIsCreateDialogOpen(true)
                }}
              />
            )}
          </CardContent>
        </ProfessionalCard>

        {/* Recent Activity */}
        <ProfessionalCard >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Periods</span>
            </CardTitle>
            <CardDescription>
              Latest payroll activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayrolls.length > 0 ? (
              <div className="space-y-3">
                {recentPayrolls.slice(0, 5).map((payroll) => {
                  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                  const periodName = `${months[payroll.period_month - 1]} ${payroll.period_year}`
                  
                  return (
                    <div 
                      key={payroll.id} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/payroll/${payroll.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{periodName}</p>
                          <p className="text-sm text-gray-500">
                            {payroll.total_employees || 0} employees
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge 
                          status={payroll.status === 'finalized' ? 'success' : 
                                 payroll.status === 'calculated' ? 'warning' : 'inactive'}
                        >
                          {payroll.status === 'finalized' ? 'Complete' :
                           payroll.status === 'calculated' ? 'Ready' : 'Draft'}
                        </StatusBadge>
                        {payroll.total_net_salary > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            {formatCurrency(payroll.total_net_salary)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t">
                  <ActionButton 
                    variant="secondary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push('/payroll')}
                  >
                    View All Periods
                  </ActionButton>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No payroll periods"
                description="Create your first payroll period to get started"
                action={{
                  label: "Create First Payroll",
                  onClick: () => setIsCreateDialogOpen(true)
                }}
              />
            )}
          </CardContent>
        </ProfessionalCard>
      </div>

      {/* Enhanced Workflow Guide */}
      <ProfessionalCard  variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span>Payroll Workflow Process</span>
          </CardTitle>
          <CardDescription>
            Step-by-step guide to complete monthly payroll processing with Indonesian compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-5">
            {[
              { step: 1, title: "Create Period", desc: "Set up payroll month", icon: Plus, status: "completed" },
              { step: 2, title: "Variable Input", desc: "Add bonus & overtime", icon: Calculator, status: "current" },
              { step: 3, title: "Auto Calculate", desc: "BPJS & PPh 21", icon: TrendingUp, status: "pending" },
              { step: 4, title: "Review & Validate", desc: "Check calculations", icon: CheckCircle, status: "pending" },
              { step: 5, title: "Finalize & Export", desc: "Lock & generate", icon: FileText, status: "pending" }
            ].map((item) => (
              <div key={item.step} className="text-center space-y-3">
                <div className={`
                  mx-auto w-12 h-12 rounded-full flex items-center justify-center text-white font-medium
                  ${item.status === 'completed' ? 'bg-green-500' : 
                    item.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'}
                `}>
                  {item.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span>{item.step}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Indonesian Compliance</h4>
                <p className="text-sm text-blue-800">
                  All calculations automatically include BPJS Kesehatan, BPJS Ketenagakerjaan, and PPh 21 tax deductions 
                  based on current Indonesian regulations. Manual adjustments are supported for special cases.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Payroll Periods List */}
      <PayrollPeriodList 
        onViewPayroll={handleViewPayroll}
        onEditPayroll={handleEditPayroll}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}