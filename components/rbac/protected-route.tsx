"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, usePermissions } from '@/lib/contexts/rbac-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Lock, AlertTriangle, ArrowLeft } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  module?: string
  action?: string
  roles?: string[]
  requireAll?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  module,
  action,
  roles,
  requireAll = false,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isLoggedIn, loading, user } = useAuth()
  const { hasPermission, hasAnyPermission, canAccess } = usePermissions()

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push(redirectTo)
    }
  }, [isLoggedIn, loading, router, redirectTo])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!isLoggedIn) {
    return null // Will redirect via useEffect
  }

  // Check permissions
  let hasAccess = true

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions)
  } else if (module && action) {
    hasAccess = canAccess(module, action)
  } else if (roles) {
    const userRole = user?.role?.role_name
    hasAccess = userRole ? roles.includes(userRole) : false
  }

  if (!hasAccess) {
    return fallback || <AccessDenied />
  }

  return <>{children}</>
}

// Default access denied component
function AccessDenied() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrapper component for pages that need authentication but no specific permissions
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}

// Higher-order component for page-level protection
export function withPermission(
  WrappedComponent: React.ComponentType<any>,
  permissionConfig: {
    permission?: string
    permissions?: string[]
    module?: string
    action?: string
    roles?: string[]
    requireAll?: boolean
  }
) {
  return function PermissionWrappedComponent(props: any) {
    return (
      <ProtectedRoute {...permissionConfig}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking permissions in components
export function useRequirePermission(
  permissionConfig: {
    permission?: string
    permissions?: string[]
    module?: string
    action?: string
    roles?: string[]
    requireAll?: boolean
  }
) {
  const router = useRouter()
  const { isLoggedIn, loading } = useAuth()
  const { hasPermission, hasAnyPermission, canAccess } = usePermissions()

  useEffect(() => {
    if (loading) return

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    let hasAccess = true
    const { permission, permissions, module, action, roles, requireAll = false } = permissionConfig

    if (permission) {
      hasAccess = hasPermission(permission)
    } else if (permissions) {
      hasAccess = requireAll 
        ? permissions.every(p => hasPermission(p))
        : hasAnyPermission(permissions)
    } else if (module && action) {
      hasAccess = canAccess(module, action)
    }

    if (!hasAccess) {
      router.push('/access-denied')
    }
  }, [isLoggedIn, loading, router, hasPermission, hasAnyPermission, canAccess])

  return { loading }
}