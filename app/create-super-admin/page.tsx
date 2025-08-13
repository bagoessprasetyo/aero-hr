"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, UserPlus } from 'lucide-react'

export default function CreateSuperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  
  const supabase = createClient()

  const createSuperAdmin = async () => {
    setLoading(true)
    setResult('')
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to create a super admin profile')
      }

      // Get Super Admin role
      const { data: superAdminRole, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_name', 'Super Admin')
        .single()

      if (roleError) {
        throw new Error('Super Admin role not found. Please run RBAC setup first at /setup-rbac')
      }

      // Create or update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: fullName || user.email?.split('@')[0] || 'Super Admin',
          email: email || user.email || '',
          role_id: superAdminRole.id,
          is_active: true
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      setResult(`✅ Super Admin profile created successfully! 
      - User ID: ${user.id}
      - Name: ${fullName || user.email?.split('@')[0] || 'Super Admin'}
      - Email: ${email || user.email}
      - Role: Super Admin
      
      You can now access the Admin panel at /admin`)

    } catch (err: any) {
      setError(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setEmail(user.email || '')
      
      // Check if user profile already exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*, user_roles(role_name)')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setResult(`Current user profile found:
        - Name: ${profile.full_name}
        - Email: ${profile.email}
        - Role: ${(profile as any).user_roles?.role_name || 'No role assigned'}
        - Status: ${profile.is_active ? 'Active' : 'Inactive'}`)
      }
    }
  }

  useState(() => {
    checkCurrentUser()
  })

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Create Super Admin Profile</h1>
        <p className="text-muted-foreground">
          Create a user profile with Super Admin permissions for the current logged-in user
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Super Admin Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button 
            onClick={createSuperAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Super Admin...
              </div>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Super Admin Profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {(result || error) && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result && (
              <div className="text-sm font-mono p-4 bg-green-50 text-green-800 rounded whitespace-pre-line">
                {result}
              </div>
            )}
            {error && (
              <div className="text-sm font-mono p-4 bg-red-50 text-red-800 rounded">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Prerequisites:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>You must be logged in</li>
              <li>RBAC tables must be set up (visit <a href="/setup-rbac" className="text-blue-600 underline">/setup-rbac</a> first)</li>
              <li>Super Admin role must exist in the database</li>
            </ol>
            <p className="mt-4"><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Creates a user_profiles entry for your current auth user</li>
              <li>Assigns the Super Admin role to your profile</li>
              <li>Enables access to the Admin panel and all system features</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}