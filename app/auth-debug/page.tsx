"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthDebug() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [authState, setAuthState] = useState("checking...")
  const [dbTest, setDbTest] = useState("not tested")
  const [error, setError] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(`Session error: ${error.message}`)
          setAuthState("error")
          return
        }

        if (session) {
          setSession(session)
          setUser(session.user)
          setAuthState("authenticated")
          
          // Test database access with authenticated user
          testDatabaseAccess()
        } else {
          setAuthState("not authenticated")
        }
      } catch (err: any) {
        setError(`Auth check failed: ${err.message}`)
        setAuthState("error")
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session)
      if (session) {
        setSession(session)
        setUser(session.user)
        setAuthState("authenticated")
        testDatabaseAccess()
      } else {
        setSession(null)
        setUser(null)
        setAuthState("not authenticated")
        setDbTest("not tested")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const testDatabaseAccess = async () => {
    try {
      setDbTest("testing...")
      
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .limit(1)
      
      if (error) {
        setDbTest(`❌ DB Error: ${error.message}`)
      } else {
        setDbTest(`✅ DB Access OK (${data?.length || 0} records)`)
      }
    } catch (err: any) {
      setDbTest(`❌ DB Exception: ${err.message}`)
    }
  }

  const testSignUp = async () => {
    try {
      setError("")
      const testEmail = `test-${Date.now()}@example.com`
      const testPassword = "test123456"
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      })
      
      if (error) {
        setError(`Sign up error: ${error.message}`)
      } else {
        setError(`✅ Sign up successful for ${testEmail}`)
      }
    } catch (err: any) {
      setError(`Sign up exception: ${err.message}`)
    }
  }

  const testSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(`Sign out error: ${error.message}`)
      }
    } catch (err: any) {
      setError(`Sign out exception: ${err.message}`)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Auth State:</strong> 
              <span className={`ml-2 ${authState === 'authenticated' ? 'text-green-600' : 'text-red-600'}`}>
                {authState}
              </span>
            </div>
            
            <div>
              <strong>Database Access:</strong> 
              <span className={`ml-2 ${dbTest.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {dbTest}
              </span>
            </div>
            
            {user && (
              <div className="p-3 bg-green-50 rounded">
                <strong>User Info:</strong>
                <p className="text-sm">ID: {user.id}</p>
                <p className="text-sm">Email: {user.email}</p>
                <p className="text-sm">Created: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            )}
            
            {session && (
              <div className="p-3 bg-blue-50 rounded">
                <strong>Session Info:</strong>
                <p className="text-sm">Expires: {new Date(session.expires_at * 1000).toLocaleString()}</p>
                <p className="text-sm">Provider: {session.user?.app_metadata?.provider || 'email'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Test authentication functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testSignUp} className="w-full">
              Test Registration (Creates Random User)
            </Button>
            
            <Button onClick={testDatabaseAccess} variant="outline" className="w-full">
              Test Database Access
            </Button>
            
            {authState === "authenticated" && (
              <Button onClick={testSignOut} variant="destructive" className="w-full">
                Sign Out
              </Button>
            )}
            
            {authState === "not authenticated" && (
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-sm text-yellow-700">
                  You are not signed in. Try:
                </p>
                <ul className="text-sm text-yellow-600 mt-1 list-disc list-inside">
                  <li>Go to <code>/register</code> to create account</li>
                  <li>Go to <code>/login</code> to sign in</li>
                  <li>Use the test registration button above</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-medium text-red-800">Error Details</h3>
          <p className="text-red-700 text-sm mt-2">{error}</p>
        </div>
      )}
    </div>
  )
}