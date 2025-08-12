"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calculator, FileText, Users, TrendingUp, DollarSign } from "lucide-react"
import { CreatePayrollForm } from "@/components/payroll/create-payroll-form"
import { PayrollPeriodList } from "@/components/payroll/payroll-period-list"
import { PayrollService } from "@/lib/services/payroll"
import { formatCurrency } from "@/lib/utils/validation"
import type { Payroll } from "@/lib/types/database"
import { useRouter } from "next/navigation"

const payrollService = new PayrollService()

export default function PayrollPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    calculated: 0,
    finalized: 0,
    yearlyTotal: 0
  })
  const router = useRouter()

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      const payrollStats = await payrollService.getPayrollStats()
      setStats(payrollStats)
    } catch (error) {
      console.error('Error loading stats:', error)
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Processing</h1>
          <p className="text-muted-foreground">
            Create and manage monthly payroll calculations with BPJS and PPh 21 compliance
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Payroll
            </Button>
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calculated</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.calculated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalized</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.finalized}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Yearly Total</span>
            </CardTitle>
            <CardDescription>
              Total finalized payroll costs this year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.yearlyTotal)}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payroll Workflow</CardTitle>
            <CardDescription>
              Standard process for monthly payroll execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <span className="text-sm">Create payroll period for the month</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <span className="text-sm">Input variable components (bonus, overtime)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <span className="text-sm">Calculate BPJS and PPh 21 automatically</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                <span className="text-sm">Review calculations and validate</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">5</div>
                <span className="text-sm">Finalize payroll and generate reports</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Periods List */}
      <PayrollPeriodList 
        onViewPayroll={handleViewPayroll}
        onEditPayroll={handleEditPayroll}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}