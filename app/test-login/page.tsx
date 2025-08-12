"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestLogin() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("test123456")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState("")
  
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult("🔄 Starting login process...")

    try {
      setResult(prev => prev + "\n📧 Attempting login with: " + email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult(prev => prev + "\n❌ Login failed: " + error.message)
      } else {
        setResult(prev => prev + "\n✅ Login successful!")
        setResult(prev => prev + "\n👤 User ID: " + data.user?.id)
        setResult(prev => prev + "\n📧 Email: " + data.user?.email)
        
        // Test immediate database access after login
        setResult(prev => prev + "\n🗄️ Testing database access...")
        
        const { data: configData, error: dbError } = await supabase
          .from('app_configuration')
          .select('*')
          .limit(1)
        
        if (dbError) {
          setResult(prev => prev + "\n❌ Database error: " + dbError.message)
          setResult(prev => prev + "\n🔍 Error code: " + dbError.code)
          setResult(prev => prev + "\n📝 Error hint: " + dbError.hint)
        } else {
          setResult(prev => prev + "\n✅ Database access successful!")
          setResult(prev => prev + "\n📊 Config records: " + (configData?.length || 0))
        }
      }
    } catch (error: any) {
      setResult(prev => prev + "\n💥 Exception: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Simple Login Test</CardTitle>
              <CardDescription>
                Test login without any protected route logic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Testing..." : "Test Login"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg h-80 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {result || "Click 'Test Login' to see detailed results..."}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            This page bypasses all protected route logic and tests authentication directly.
          </p>
        </div>
      </div>
    </div>
  )
}