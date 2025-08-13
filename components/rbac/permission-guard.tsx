"use client"

import React from 'react'
import { usePermissions, useAuth, useUserRole } from '@/lib/contexts/rbac-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock } from 'lucide-react'

interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  module?: string
  action?: string
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
  showFallback?: boolean
}

export function PermissionGuard({
  permission,
  permissions,
  module,
  action,
  requireAll = false,
  fallback,
  children,
  showFallback = true
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, canAccess } = usePermissions()
  const { isLoggedIn, loading } = useAuth()

  // Show loading state
  if (loading) {
    return null
  }

  // Not logged in
  if (!isLoggedIn) {
    return showFallback ? (
      fallback || (
        <Alert className="border-red-200">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Please log in to access this feature.
          </AlertDescription>
        </Alert>
      )
    ) : null
  }

  let hasAccess = false

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission)
  }
  // Check multiple permissions
  else if (permissions) {
    hasAccess = requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions)
  }
  // Check module.action format
  else if (module && action) {
    hasAccess = canAccess(module, action)
  }
  // Default to no access if no permission specified
  else {
    hasAccess = false
  }

  if (hasAccess) {
    return <>{children}</>
  }

  // No permission - show fallback or nothing
  return showFallback ? (
    fallback || (
      <Alert className="border-amber-200">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          You don't have permission to access this feature.
        </AlertDescription>
      </Alert>
    )
  ) : null
}

// Specific permission components for common use cases

interface CanProps {
  do: string
  on?: string
  fallback?: React.ReactNode
  children: React.ReactNode
  showFallback?: boolean
}

export function Can({ do: action, on: module = 'system', fallback, children, showFallback = true }: CanProps) {
  return (
    <PermissionGuard
      module={module}
      action={action}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </PermissionGuard>
  )
}

interface CanAnyProps {
  of: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
  showFallback?: boolean
}

export function CanAny({ of: permissions, fallback, children, showFallback = true }: CanAnyProps) {
  return (
    <PermissionGuard
      permissions={permissions}
      requireAll={false}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </PermissionGuard>
  )
}

interface CanAllProps {
  of: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
  showFallback?: boolean
}

export function CanAll({ of: permissions, fallback, children, showFallback = true }: CanAllProps) {
  return (
    <PermissionGuard
      permissions={permissions}
      requireAll={true}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </PermissionGuard>
  )
}

// Role-based components
interface RoleGuardProps {
  roles: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
  showFallback?: boolean
}

export function RoleGuard({ 
  roles, 
  requireAll = false, 
  fallback, 
  children, 
  showFallback = true 
}: RoleGuardProps) {
  const { userRole } = useUserRole()
  const { loading } = useAuth()

  if (loading) {
    return null
  }

  const hasRole = userRole && roles.includes(userRole.role_name)
  const hasAccess = requireAll ? roles.every(role => userRole?.role_name === role) : hasRole

  if (hasAccess) {
    return <>{children}</>
  }

  return showFallback ? (
    fallback || (
      <Alert className="border-amber-200">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Your role doesn't have access to this feature.
        </AlertDescription>
      </Alert>
    )
  ) : null
}