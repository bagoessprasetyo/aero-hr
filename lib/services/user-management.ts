import { createClient } from '@/lib/supabase/client'
import type {
  UserRole,
  UserPermission,
  UserProfile,
  UserActivityLog,
  CreateUserRequest,
  UpdateUserRequest,
  CreateUserRoleRequest,
  UpdateUserRoleRequest,
  UserFilters,
  UserActivityFilters,
  MasterDataResponse,
  MasterDataSingleResponse,
  UserStats
} from '@/lib/types/master-data'

export class UserManagementService {
  private supabase = createClient()

  // =============================================================================
  // USER PROFILE METHODS
  // =============================================================================

  async getUsers(filters: UserFilters = {}): Promise<MasterDataResponse<UserProfile>> {
    let query = this.supabase
      .from('user_profiles')
      .select(`
        *,
        role:user_roles(id, role_name, role_description)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    if (filters.role_id) {
      query = query.eq('role_id', filters.role_id)
    }
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      has_more: filters.limit ? (data?.length || 0) === filters.limit : false
    }
  }

  async getUserById(id: string): Promise<MasterDataSingleResponse<UserProfile>> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        role:user_roles(id, role_name, role_description, is_system_role)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('User profile not found')

    return {
      data,
      success: true
    }
  }

  async getCurrentUser(): Promise<MasterDataSingleResponse<UserProfile>> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    return this.getUserById(user.id)
  }

  async createUser(userRequest: CreateUserRequest): Promise<MasterDataSingleResponse<UserProfile>> {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: userRequest.email,
        password: userRequest.password,
        email_confirm: true
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create auth user')

      // Create user profile
      const { data: profileData, error: profileError } = await this.supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: userRequest.full_name,
          email: userRequest.email,
          role_id: userRequest.role_id,
          employee_id: userRequest.employee_id,
          phone: userRequest.phone,
          department_id: userRequest.department_id,
          is_active: userRequest.is_active ?? true,
          created_by: (await this.supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (profileError) {
        // Rollback auth user creation if profile creation fails
        await this.supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      return {
        data: profileData!,
        success: true,
        message: 'User created successfully'
      }
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`)
    }
  }

  async updateUser(userRequest: UpdateUserRequest): Promise<MasterDataSingleResponse<UserProfile>> {
    const { id, ...updateData } = userRequest
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      data: data!,
      success: true,
      message: 'User updated successfully'
    }
  }

  async deactivateUser(id: string): Promise<{ success: boolean; message: string }> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'User deactivated successfully'
    }
  }

  async reactivateUser(id: string): Promise<{ success: boolean; message: string }> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update({ is_active: true })
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'User reactivated successfully'
    }
  }

  async resetUserPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const { error } = await this.supabase.auth.admin.updateUserById(id, {
      password: newPassword
    })

    if (error) throw error

    // Update password changed timestamp
    await this.supabase
      .from('user_profiles')
      .update({ password_changed_at: new Date().toISOString() })
      .eq('id', id)

    return {
      success: true,
      message: 'Password reset successfully'
    }
  }

  async getUserStats(): Promise<UserStats> {
    const { data: users, error } = await this.supabase
      .from('user_profiles')
      .select(`
        id, is_active, last_login_at,
        role:user_roles(role_name)
      `)

    if (error) throw error

    const total_users = users?.length || 0
    const active_users = users?.filter(u => u.is_active).length || 0

    // Calculate recent logins (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const recent_logins = users?.filter(u => 
      u.last_login_at && u.last_login_at > thirtyDaysAgo
    ).length || 0

    const inactive_users = users?.filter(u => !u.is_active).length || 0

    // Calculate users by role
    const users_by_role: Record<string, number> = {}
    users?.forEach(u => {
      const roleName = (u.role as any)?.role_name || 'Unknown'
      users_by_role[roleName] = (users_by_role[roleName] || 0) + 1
    })

    return {
      total_users,
      active_users,
      users_by_role,
      recent_logins,
      inactive_users
    }
  }

  // =============================================================================
  // USER ROLE METHODS
  // =============================================================================

  async getUserRoles(): Promise<MasterDataResponse<UserRole>> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select(`
        *,
        permissions:role_permissions(
          permission:user_permissions(*)
        )
      `)
      .order('is_system_role', { ascending: false })
      .order('role_name', { ascending: true })

    if (error) throw error

    return {
      data: data || [],
      total: data?.length || 0
    }
  }

  async getUserRoleById(id: string): Promise<MasterDataSingleResponse<UserRole>> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select(`
        *,
        permissions:role_permissions(
          permission:user_permissions(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Role not found')

    return {
      data,
      success: true
    }
  }

  async createUserRole(roleRequest: CreateUserRoleRequest): Promise<MasterDataSingleResponse<UserRole>> {
    const { permission_ids, ...roleData } = roleRequest

    // Create the role
    const { data: role, error: roleError } = await this.supabase
      .from('user_roles')
      .insert(roleData)
      .select()
      .single()

    if (roleError) throw roleError

    // Assign permissions if provided
    if (permission_ids && permission_ids.length > 0) {
      const rolePermissions = permission_ids.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId
      }))

      const { error: permError } = await this.supabase
        .from('role_permissions')
        .insert(rolePermissions)

      if (permError) {
        // Rollback role creation
        await this.supabase.from('user_roles').delete().eq('id', role.id)
        throw permError
      }
    }

    return {
      data: role,
      success: true,
      message: 'Role created successfully'
    }
  }

  async updateUserRole(roleRequest: UpdateUserRoleRequest): Promise<MasterDataSingleResponse<UserRole>> {
    const { id, permission_ids, ...updateData } = roleRequest

    // Update the role
    const { data: role, error: roleError } = await this.supabase
      .from('user_roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (roleError) throw roleError

    // Update permissions if provided
    if (permission_ids) {
      // Remove existing permissions
      await this.supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id)

      // Add new permissions
      if (permission_ids.length > 0) {
        const rolePermissions = permission_ids.map(permissionId => ({
          role_id: id,
          permission_id: permissionId
        }))

        const { error: permError } = await this.supabase
          .from('role_permissions')
          .insert(rolePermissions)

        if (permError) throw permError
      }
    }

    return {
      data: role,
      success: true,
      message: 'Role updated successfully'
    }
  }

  async deleteUserRole(id: string): Promise<{ success: boolean; message: string }> {
    // Check if role is in use
    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id')
      .eq('role_id', id)
      .limit(1)

    if (users?.length) {
      return {
        success: false,
        message: 'Cannot delete role that is assigned to users'
      }
    }

    // Check if it's a system role
    const { data: role } = await this.supabase
      .from('user_roles')
      .select('is_system_role')
      .eq('id', id)
      .single()

    if (role?.is_system_role) {
      return {
        success: false,
        message: 'Cannot delete system roles'
      }
    }

    const { error } = await this.supabase
      .from('user_roles')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Role deleted successfully'
    }
  }

  // =============================================================================
  // PERMISSION METHODS
  // =============================================================================

  async getUserPermissions(): Promise<MasterDataResponse<UserPermission>> {
    const { data, error } = await this.supabase
      .from('user_permissions')
      .select('*')
      .order('module_name', { ascending: true })
      .order('action_type', { ascending: true })

    if (error) throw error

    return {
      data: data || [],
      total: data?.length || 0
    }
  }

  async getUserPermissionsByRole(roleId: string): Promise<UserPermission[]> {
    const { data, error } = await this.supabase
      .from('role_permissions')
      .select(`
        permission:user_permissions(*)
      `)
      .eq('role_id', roleId)

    if (error) throw error

    return data?.map(rp => (rp as any).permission).filter(Boolean) || []
  }

  async getUserPermissionsByUserId(userId: string): Promise<UserPermission[]> {
    const { data: userProfile } = await this.supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', userId)
      .single()

    if (!userProfile) return []

    return this.getUserPermissionsByRole(userProfile.role_id)
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissionsByUserId(userId)
    return permissions.some(p => p.permission_name === permissionName)
  }

  async hasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissionsByUserId(userId)
    const userPermissionNames = permissions.map(p => p.permission_name)
    return permissionNames.some(name => userPermissionNames.includes(name))
  }

  // =============================================================================
  // ACTIVITY LOG METHODS
  // =============================================================================

  async logUserActivity(
    userId: string,
    activityType: string,
    activityDescription: string,
    moduleName?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Get user's IP and user agent (would be passed from request in real implementation)
    const { error } = await this.supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_description: activityDescription,
        module_name: moduleName,
        metadata
      })

    if (error) console.error('Failed to log user activity:', error)
  }

  async getUserActivityLog(filters: UserActivityFilters = {}): Promise<MasterDataResponse<UserActivityLog>> {
    let query = this.supabase
      .from('user_activity_logs')
      .select(`
        *,
        user:user_profiles(id, full_name, email)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters.activity_type) {
      query = query.eq('activity_type', filters.activity_type)
    }
    if (filters.module_name) {
      query = query.eq('module_name', filters.module_name)
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      has_more: filters.limit ? (data?.length || 0) === filters.limit : false
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async getActiveRoles(): Promise<UserRole[]> {
    const { data } = await this.getUserRoles()
    return data.filter(role => role.is_active)
  }

  async validateEmail(email: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length || 0) === 0
  }

  async validateRoleName(roleName: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('user_roles')
      .select('id')
      .eq('role_name', roleName)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length || 0) === 0
  }

  // Session management
  async getCurrentSession() {
    return await this.supabase.auth.getSession()
  }

  async signOut() {
    return await this.supabase.auth.signOut()
  }
}