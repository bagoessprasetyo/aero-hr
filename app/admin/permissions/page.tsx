"use client"

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import { PermissionManager } from '@/components/rbac/permission-manager'
import { ProtectedRoute } from '@/components/rbac/protected-route'
import { Loader2 } from 'lucide-react'

function AdminModuleLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading permission manager...</span>
      </div>
    </div>
  )
}

export default function PermissionsPage() {
  const router = useRouter()

  const handleBackToAdmin = () => {
    router.push('/admin')
  }

  return (
    // <ProtectedRoute permission="admin.permissions.read">
      <div className="container mx-auto py-6 space-y-6">
        <AdminBreadcrumb 
          items={[
            { label: 'Permission Management', current: true }
          ]}
          backAction={handleBackToAdmin}
        />
        
        <Suspense fallback={<AdminModuleLoader />}>
          <PermissionManager />
        </Suspense>
      </div>
    // </ProtectedRoute>
  )
}