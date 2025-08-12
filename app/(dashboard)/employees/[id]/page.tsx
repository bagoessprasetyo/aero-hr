import { Suspense } from "react"
import { EmployeeDetailView } from "@/components/employees/employee-detail-view"
import { Card, CardContent } from "@/components/ui/card"

interface EmployeeDetailPageProps {
  params: {
    id: string
  }
}

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading employee details...</p>
          </CardContent>
        </Card>
      }>
        <EmployeeDetailView employeeId={params.id} />
      </Suspense>
    </div>
  )
}