"use client"

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import { TaxConfig } from '@/components/admin/tax-config'
import { ProtectedRoute } from '@/components/rbac/protected-route'
import { Loader2 } from 'lucide-react'

function AdminModuleLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading tax configuration...</span>
      </div>
    </div>
  )
}

export default function TaxConfigPage() {
  const router = useRouter()

  const handleBackToAdmin = () => {
    router.push('/admin')
  }

  return (
    // <ProtectedRoute permission="admin.tax.read">
      <div className="container mx-auto py-6 space-y-6">
        <AdminBreadcrumb 
          items={[
            { label: 'Tax Configuration', current: true }
          ]}
          backAction={handleBackToAdmin}
        />
        
        <Suspense fallback={<AdminModuleLoader />}>
          <TaxConfig />
        </Suspense>
      </div>
    // </ProtectedRoute>
  )
}