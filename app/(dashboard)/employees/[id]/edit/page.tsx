import { Suspense } from "react"
import { EditEmployeeForm } from "@/components/employees/edit-employee-form"
import { Card, CardContent } from "@/components/ui/card"

interface EditEmployeePageProps {
  params: {
    id: string
  }
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading employee data...</p>
          </CardContent>
        </Card>
      }>
         
        <EditEmployeeForm employeeId={params.id} />
      </Suspense>
    </div>
  )
}