"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BulkOperations } from "@/components/salary/bulk-operations"
import { SalaryExport } from "@/components/reports/salary-export"
import { 
  Users, 
  FileSpreadsheet, 
  Calculator, 
  Download 
} from "lucide-react"

export default function BulkOperationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
        <p className="text-muted-foreground">
          Manage mass salary adjustments and export compliance reports
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="bulk-adjustments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bulk-adjustments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Bulk Salary Adjustments</span>
          </TabsTrigger>
          <TabsTrigger value="exports-reports" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export & Compliance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-adjustments" className="space-y-6">
          <BulkOperations />
        </TabsContent>

        <TabsContent value="exports-reports" className="space-y-6">
          <SalaryExport />
        </TabsContent>
      </Tabs>
    </div>
  )
}