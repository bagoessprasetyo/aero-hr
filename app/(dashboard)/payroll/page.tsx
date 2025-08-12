import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calculator, FileText } from "lucide-react"

export default function PayrollPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Processing</h1>
          <p className="text-muted-foreground">
            Create and manage monthly payroll calculations with BPJS and PPh 21 compliance
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Payroll
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Payroll Periods
              <Badge variant="secondary">3 Active</Badge>
            </CardTitle>
            <CardDescription>
              Manage ongoing and recent payroll calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">December 2024</p>
                  <p className="text-sm text-muted-foreground">45 employees</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Draft</Badge>
                  <Button size="sm" variant="ghost">
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">November 2024</p>
                  <p className="text-sm text-muted-foreground">45 employees</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">Finalized</Badge>
                  <Button size="sm" variant="ghost">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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
                <span className="text-sm">Verify employee data and NPWP status</span>
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
                <span className="text-sm">Review calculations and finalize</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">5</div>
                <span className="text-sm">Generate reports and payslips</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}