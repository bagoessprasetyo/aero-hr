"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ClearAuth() {
  const [status, setStatus] = useState("Ready to clear")
  const [isClearing, setIsClearing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const clearEverything = async () => {
    setIsClearing(true)
    setStatus("🧹 Clearing all authentication data...")

    try {
      // 1. Sign out from Supabase
      setStatus(prev => prev + "\n📤 Signing out from Supabase...")
      await supabase.auth.signOut()

      // 2. Clear localStorage
      setStatus(prev => prev + "\n💾 Clearing localStorage...")
      localStorage.clear()

      // 3. Clear sessionStorage
      setStatus(prev => prev + "\n📋 Clearing sessionStorage...")
      sessionStorage.clear()

      // 4. Clear cookies (client-side)
      setStatus(prev => prev + "\n🍪 Clearing cookies...")
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })

      // 5. Clear specific Supabase cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token', 
        'supabase.auth.token',
        'supabase-auth-token'
      ]
      
      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost`
      })

      setStatus(prev => prev + "\n✅ All authentication data cleared!")
      setStatus(prev => prev + "\n🔄 Redirecting to login in 3 seconds...")

      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error: any) {
      setStatus(prev => prev + "\n❌ Error: " + error.message)
    } finally {
      setIsClearing(false)
    }
  }

  const manualSteps = () => {
    setStatus(`Manual steps to clear authentication:

1. Open Developer Tools (F12)
2. Go to Application tab
3. Storage section → Clear storage → Clear site data
4. Or manually:
   - Cookies → Delete all cookies for localhost:3001
   - Local Storage → Clear
   - Session Storage → Clear
5. Refresh the page
6. Try logging in again`)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Clear Authentication Data</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fix HTTP 431 Error</CardTitle>
            <CardDescription>
              Clear oversized authentication cookies and tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-800">What's happening?</h3>
              <p className="text-sm text-yellow-700 mt-1">
                HTTP 431 "Request Header Fields Too Large" occurs when authentication 
                cookies become too large. This clears all auth data to reset the state.
              </p>
            </div>
            
            <Button 
              onClick={clearEverything} 
              disabled={isClearing}
              className="w-full"
            >
              {isClearing ? "Clearing..." : "🧹 Clear All Auth Data"}
            </Button>
            
            <Button 
              onClick={manualSteps} 
              variant="outline"
              className="w-full"
            >
              📋 Show Manual Steps
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg h-80 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {status}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800">After Clearing</h3>
        <ol className="list-decimal list-inside mt-2 text-sm text-blue-700">
          <li>Authentication data will be completely reset</li>
          <li>You'll be redirected to the login page</li>
          <li>Create a new account or login with existing credentials</li>
          <li>The HTTP 431 error should be resolved</li>
        </ol>
      </div>
    </div>
  )
}