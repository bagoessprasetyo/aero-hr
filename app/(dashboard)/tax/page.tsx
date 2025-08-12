import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calculator, Settings } from "lucide-react"

export default function TaxPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tax Management & Reports</h1>
        <p className="text-muted-foreground">
          PPh 21 calculations, tax reporting, and Indonesian compliance management
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>PPh 21 Calculator</span>
            </CardTitle>
            <CardDescription>
              Indonesian income tax calculation engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Tax Year:</span>
                <span className="font-medium">2024</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active PTKP Rates:</span>
                <Badge variant="outline">5 Types</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Occupational Cost:</span>
                <span className="font-medium">5% (max 500k/mo)</span>
              </div>
              <Button className="w-full" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure Tax Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Monthly Reports</span>
            </CardTitle>
            <CardDescription>
              Generate tax and BPJS compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                PPh 21 Summary (e-SPT)
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                BPJS Contribution Report
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Bank Transfer File
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Compliance Status</CardTitle>
            <CardDescription>
              Current compliance with Indonesian regulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">PPh 21 Accuracy</span>
                <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PTKP Updates</span>
                <Badge className="bg-green-100 text-green-800">✓ Current</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">BPJS Rates</span>
                <Badge className="bg-green-100 text-green-800">✓ Updated</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Form 1721-A1</span>
                <Badge variant="outline">Ready for Year-end</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tax Calculations</CardTitle>
            <CardDescription>
              Latest PPh 21 and BPJS calculations by payroll period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">November 2024</p>
                  <p className="text-sm text-muted-foreground">45 employees • Total PPh 21: Rp 45,250,000</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">Finalized</Badge>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">October 2024</p>
                  <p className="text-sm text-muted-foreground">43 employees • Total PPh 21: Rp 42,180,000</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">Finalized</Badge>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}