"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/rbac/protected-route"
import { ModernEmployeeDashboard } from "@/components/employees/modern-employee-dashboard"
import { EnhancedEmployeeTable } from "@/components/employees/enhanced-employee-table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ModernEmployeeFormWizard } from "@/components/employees/modern-employee-form-wizard"
import { 
  Grid3X3, 
  List
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmployeesPage() {
  return (
    <ProtectedRoute permission="employees.read">
      <EmployeesPageContent />
    </ProtectedRoute>
  )
}

function EmployeesPageContent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard')

  const handleEmployeeAdded = () => {
    setIsAddDialogOpen(false)
    // Data will be refreshed automatically by the individual components
  }

  const handleFilterChange = (filters: any) => {
    // Filter changes are handled by individual components
    console.log('Filter change:', filters)
  }

  if (viewMode === 'dashboard') {
    return (
      <div className="container mx-auto p-3 md:p-6">
        <ModernEmployeeDashboard
          onAddEmployee={() => setIsAddDialogOpen(true)}
          onViewAllEmployees={() => setViewMode('table')}
          onFilterChange={handleFilterChange}
        />

        {/* Mobile View Toggle */}
        <div className="fixed bottom-4 right-4 z-50 lg:hidden">
          <div className="bg-white rounded-lg border shadow-lg p-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-2 text-xs"
            >
              <List className="h-3 w-3" />
              Table
            </Button>
          </div>
        </div>

        {/* Add Employee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-7xl max-h-[95vh] overflow-y-auto p-2 md:p-6">
            <ModernEmployeeFormWizard 
              onSuccess={handleEmployeeAdded}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-3 md:p-6">
      {/* Header Section with View Toggle */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Employee Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage employee profiles, salary components, and employment data
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 rounded-lg p-1 flex-1 sm:flex-initial">
            <Button
              variant={'default'}
              size="sm"
              onClick={() => setViewMode('dashboard')}
              className="gap-2 flex-1 sm:flex-initial text-xs md:text-sm"
            >
              <Grid3X3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-2 flex-1 sm:flex-initial text-xs md:text-sm"
            >
              <List className="h-3 w-3 md:h-4 md:w-4" />
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Employee Table */}
      <EnhancedEmployeeTable onAddEmployee={() => setIsAddDialogOpen(true)} />

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-7xl max-h-[95vh] overflow-y-auto p-2 md:p-6">
          <ModernEmployeeFormWizard 
            onSuccess={handleEmployeeAdded}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}