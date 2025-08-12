import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (error) {
    // If there's an error (like oversized headers), clear auth and redirect to login
    console.error('Middleware error:', error)
    
    const response = NextResponse.redirect(new URL('/login', request.url))
    
    // Clear all auth cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.set('sb-access-token', '', { maxAge: 0 })
    response.cookies.set('sb-refresh-token', '', { maxAge: 0 })
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login, register, test pages (to avoid redirect loops)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|test-login|minimal-auth|auth-debug|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}