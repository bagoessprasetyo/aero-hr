"use client"

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import { BankManagement } from '@/components/admin/bank-management'
import { ProtectedRoute } from '@/components/rbac/protected-route'
import { Loader2 } from 'lucide-react'

function AdminModuleLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading bank management...</span>
      </div>
    </div>
  )
}

export default function BanksPage() {
  const router = useRouter()

  const handleBackToAdmin = () => {
    router.push('/admin')
  }

  return (
    // <ProtectedRoute permission="admin.banks.read">
      <div className="container mx-auto py-6 space-y-6">
        <AdminBreadcrumb 
          items={[
            { label: 'Bank Management', current: true }
          ]}
          backAction={handleBackToAdmin}
        />
        
        <Suspense fallback={<AdminModuleLoader />}>
          <BankManagement />
        </Suspense>
      </div>
    // </ProtectedRoute>
  )
}