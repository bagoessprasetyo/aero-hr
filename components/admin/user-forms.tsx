"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { UserManagementService } from '@/lib/services/user-management'
import { MasterDataService } from '@/lib/services/master-data'
import type { 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserProfile, 
  UserRole, 
  Department 
} from '@/lib/types/master-data'
import {
  User,
  Mail,
  Lock,
  Shield,
  Building,
  Phone,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'

const userManagementService = new UserManagementService()
const masterDataService = new MasterDataService()

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    full_name: '',
    role_id: '',
    employee_id: '',
    phone: '',
    department_id: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      loadFormData()
    }
  }, [open])

  const loadFormData = async () => {
    try {
      const [rolesResponse, departmentsResponse] = await Promise.all([
        userManagementService.getUserRoles(),
        masterDataService.getDepartments()
      ])
      
      setRoles(rolesResponse.data.filter(role => role.is_active))
      setDepartments(departmentsResponse.data.filter(dept => dept.is_active))
    } catch (error) {
      console.error('Error loading form data:', error)
      toast({ type: 'error', title: 'Failed to load form data' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      await userManagementService.createUser(formData)
      
      toast({ 
        type: 'success', 
        title: 'User created successfully',
        description: 'The new user account has been created and is ready to use.'
      })
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role_id: '',
        employee_id: '',
        phone: '',
        department_id: '',
        is_active: true
      })
      setErrors({})
      
      onUserCreated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast({ 
        type: 'error', 
        title: 'Failed to create user',
        description: error.message || 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account with role and department assignment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`pl-10 ${errors.full_name ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-red-500">{errors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+62 812 3456 7890"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Security & Access */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Security & Access
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`pl-10 pr-20 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generatePassword}
                      className="h-8 px-2 text-xs"
                    >
                      Generate
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="h-8 w-8 p-0"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role_id">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                  <SelectTrigger className={errors.role_id ? 'border-red-500' : ''}>
                    <Shield className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <span>{role.role_name}</span>
                          {role.is_system_role && (
                            <span className="text-xs text-muted-foreground">(System)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role_id && (
                  <p className="text-sm text-red-500">{errors.role_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select value={formData.department_id || undefined} onValueChange={(value) => setFormData({ ...formData, department_id: value || undefined })}>
                  <SelectTrigger>
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Account Status
            </h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">
                Account is active (user can log in)
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditUserDialogProps {
  user: UserProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  
  const [formData, setFormData] = useState<UpdateUserRequest>({
    id: '',
    full_name: '',
    role_id: '',
    employee_id: '',
    phone: '',
    department_id: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && user) {
      setFormData({
        id: user.id,
        full_name: user.full_name,
        role_id: user.role_id,
        employee_id: user.employee_id || '',
        phone: user.phone || '',
        department_id: user.department_id || '',
        is_active: user.is_active
      })
      loadFormData()
    }
  }, [open, user])

  const loadFormData = async () => {
    try {
      const [rolesResponse, departmentsResponse] = await Promise.all([
        userManagementService.getUserRoles(),
        masterDataService.getDepartments()
      ])
      
      setRoles(rolesResponse.data.filter(role => role.is_active))
      setDepartments(departmentsResponse.data.filter(dept => dept.is_active))
    } catch (error) {
      console.error('Error loading form data:', error)
      toast({ type: 'error', title: 'Failed to load form data' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      await userManagementService.updateUser(formData)
      
      toast({ 
        type: 'success', 
        title: 'User updated successfully',
        description: 'The user account has been updated.'
      })
      
      onUserUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({ 
        type: 'error', 
        title: 'Failed to update user',
        description: error.message || 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information, role, and department assignment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit_full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`pl-10 ${errors.full_name ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-red-500">{errors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit_email"
                    type="email"
                    value={user.email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit_phone"
                    placeholder="+62 812 3456 7890"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Access & Assignment */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Access & Assignment
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="edit_role_id">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                  <SelectTrigger className={errors.role_id ? 'border-red-500' : ''}>
                    <Shield className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <span>{role.role_name}</span>
                          {role.is_system_role && (
                            <span className="text-xs text-muted-foreground">(System)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role_id && (
                  <p className="text-sm text-red-500">{errors.role_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_department_id">Department</Label>
                <Select value={formData.department_id || undefined} onValueChange={(value) => setFormData({ ...formData, department_id: value || undefined })}>
                  <SelectTrigger>
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Account Status
            </h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="edit_is_active" className="text-sm font-medium">
                Account is active (user can log in)
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}