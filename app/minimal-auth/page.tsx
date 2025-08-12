"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MinimalAuth() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("test123456")
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearLogs = () => setLogs([])

  const testSignUp = async () => {
    setIsLoading(true)
    addLog("🔄 Starting sign up...")
    
    try {
      addLog("📝 Calling supabase.auth.signUp...")
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        addLog(`❌ Sign up error: ${error.message}`)
      } else {
        addLog(`✅ Sign up successful!`)
        addLog(`📧 User email: ${data.user?.email}`)
        addLog(`🆔 User ID: ${data.user?.id}`)
        addLog(`📨 Session: ${data.session ? 'Created' : 'Not created (check email confirmation)'}`)
      }
    } catch (err: any) {
      addLog(`💥 Sign up exception: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testSignIn = async () => {
    setIsLoading(true)
    addLog("🔄 Starting sign in...")
    
    try {
      addLog("🔑 Calling supabase.auth.signInWithPassword...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        addLog(`❌ Sign in error: ${error.message}`)
      } else {
        addLog(`✅ Sign in successful!`)
        addLog(`📧 User email: ${data.user?.email}`)
        addLog(`🆔 User ID: ${data.user?.id}`)
        addLog(`📨 Session token: ${data.session?.access_token ? 'Present' : 'Missing'}`)
        
        // Now test database access
        await testDatabaseAccess()
      }
    } catch (err: any) {
      addLog(`💥 Sign in exception: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testDatabaseAccess = async () => {
    addLog("🗄️ Testing database access...")
    
    try {
      addLog("📊 Querying app_configuration table...")
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .limit(1)
      
      if (error) {
        addLog(`❌ Database error: ${error.message}`)
        addLog(`🔍 Error details: ${JSON.stringify(error, null, 2)}`)
      } else {
        addLog(`✅ Database access successful!`)
        addLog(`📊 Records found: ${data?.length || 0}`)
      }
    } catch (err: any) {
      addLog(`💥 Database exception: ${err.message}`)
    }
  }

  const checkSession = async () => {
    addLog("🔍 Checking current session...")
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        addLog(`❌ Session check error: ${error.message}`)
      } else if (session) {
        addLog(`✅ Active session found`)
        addLog(`📧 Session user: ${session.user?.email}`)
        addLog(`⏰ Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
      } else {
        addLog(`❌ No active session`)
      }
    } catch (err: any) {
      addLog(`💥 Session check exception: ${err.message}`)
    }
  }

  const testSignOut = async () => {
    addLog("🚪 Signing out...")
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        addLog(`❌ Sign out error: ${error.message}`)
      } else {
        addLog(`✅ Sign out successful`)
      }
    } catch (err: any) {
      addLog(`💥 Sign out exception: ${err.message}`)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Minimal Authentication Test</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="test123456"
              />
            </div>
            
            <div className="space-y-2">
              <Button onClick={testSignUp} disabled={isLoading} className="w-full">
                Test Sign Up
              </Button>
              <Button onClick={testSignIn} disabled={isLoading} className="w-full">
                Test Sign In
              </Button>
              <Button onClick={checkSession} disabled={isLoading} variant="outline" className="w-full">
                Check Session
              </Button>
              <Button onClick={testDatabaseAccess} disabled={isLoading} variant="outline" className="w-full">
                Test Database Access
              </Button>
              <Button onClick={testSignOut} disabled={isLoading} variant="destructive" className="w-full">
                Sign Out
              </Button>
              <Button onClick={clearLogs} variant="ghost" className="w-full">
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs yet. Try an action to see detailed execution steps.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono break-words">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800">Instructions</h3>
        <ol className="list-decimal list-inside mt-2 text-sm text-blue-700">
          <li>First try "Test Sign Up" to create a new account</li>
          <li>Then try "Test Sign In" with the same credentials</li>
          <li>Watch the logs for detailed error messages</li>
          <li>If you get the "database error querying schema", we'll see exactly where it happens</li>
        </ol>
      </div>
    </div>
  )
}