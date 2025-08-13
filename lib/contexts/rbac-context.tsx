"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserManagementService } from '@/lib/services/user-management'
import type { UserProfile, UserPermission, UserRole } from '@/lib/types/master-data'

interface RBACContextType {
  // User data
  user: UserProfile | null
  userRole: UserRole | null
  permissions: UserPermission[]
  
  // Loading states
  loading: boolean
  
  // Permission checking functions
  hasPermission: (permissionName: string) => boolean
  hasAnyPermission: (permissionNames: string[]) => boolean
  hasRole: (roleName: string) => boolean
  canAccess: (module: string, action: string) => boolean
  
  // User management
  refreshUserData: () => Promise<void>
  isLoggedIn: boolean
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

interface RBACProviderProps {
  children: React.ReactNode
}

export function RBACProvider({ children }: RBACProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const supabase = createClient()
  const userManagementService = new UserManagementService()

  // Load user data and permissions
  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        console.log('RBAC: No authenticated user found')
        setUser(null)
        setUserRole(null)
        setPermissions([])
        setIsLoggedIn(false)
        return
      }

      console.log('RBAC: Authenticated user found:', authUser.id)
      setIsLoggedIn(true)

      // Get user profile with role
      try {
        const userProfile = await userManagementService.getUserById(authUser.id)
        console.log('RBAC: User profile loaded:', userProfile.data)
        setUser(userProfile.data)

        if (userProfile.data?.role_id) {
          // Get user role
          const role = await userManagementService.getUserRoleById(userProfile.data.role_id)
          console.log('RBAC: User role loaded:', role.data)
          setUserRole(role.data)

          // Get user permissions
          const userPermissions = await userManagementService.getUserPermissionsByUserId(authUser.id)
          console.log('RBAC: User permissions loaded:', userPermissions.length)
          setPermissions(userPermissions)
        } else {
          console.log('RBAC: User has no role assigned')
          setUserRole(null)
          setPermissions([])
        }
      } catch (userError) {
        console.error('RBAC: Error loading user data:', userError)
        
        // Check if error is because user profile doesn't exist
        if (userError.message?.includes('User profile not found')) {
          console.log('RBAC: Creating temporary user profile for development')
          // Create a minimal user object for development
          const tempUser = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.email?.split('@')[0] || 'User',
            role_id: '',
            is_active: true,
            password_changed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserProfile
          
          setUser(tempUser)
          setUserRole(null)
          setPermissions([])
          
          console.log('RBAC: Development mode - allowing access with no permissions')
        } else {
          // Other errors - set user but no permissions
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            full_name: 'User',
            role_id: '',
            is_active: true,
            password_changed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserProfile)
          setUserRole(null)
          setPermissions([])
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error)
      setUser(null)
      setUserRole(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  // Initialize and listen for auth changes
  useEffect(() => {
    loadUserData()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          await loadUserData()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Permission checking functions
  const hasPermission = (permissionName: string): boolean => {
    // If no user is logged in, deny access
    if (!isLoggedIn) return false
    
    // If user is logged in but no permissions loaded (e.g., tables don't exist yet), allow all access for development
    if (!permissions || permissions.length === 0) {
      console.warn('No permissions loaded - allowing all access for development')
      return true
    }
    
    return permissions.some(p => p.permission_name === permissionName && p.is_active)
  }

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    // If no user is logged in, deny access
    if (!isLoggedIn) return false
    
    // If user is logged in but no permissions loaded, allow all access for development
    if (!permissions || permissions.length === 0) {
      console.warn('No permissions loaded - allowing all access for development')
      return true
    }
    
    return permissionNames.some(name => hasPermission(name))
  }

  const hasRole = (roleName: string): boolean => {
    // If no user is logged in, deny access
    if (!isLoggedIn) return false
    
    // If user is logged in but no role loaded, allow for development
    if (!userRole) {
      console.warn('No role loaded - allowing access for development')
      return true
    }
    
    return userRole?.role_name === roleName
  }

  const canAccess = (module: string, action: string): boolean => {
    const permissionName = `${module}.${action}`
    return hasPermission(permissionName)
  }

  const refreshUserData = async () => {
    await loadUserData()
  }

  const value: RBACContextType = {
    user,
    userRole,
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasRole,
    canAccess,
    refreshUserData,
    isLoggedIn
  }

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  )
}

// Hook to use RBAC context
export function useRBAC() {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider')
  }
  return context
}

// Convenience hooks for common use cases
export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, canAccess } = useRBAC()
  return { permissions, hasPermission, hasAnyPermission, canAccess }
}

export function useUserRole() {
  const { user, userRole, hasRole } = useRBAC()
  return { user, userRole, hasRole }
}

export function useAuth() {
  const { user, isLoggedIn, loading, refreshUserData } = useRBAC()
  return { user, isLoggedIn, loading, refreshUserData }
}