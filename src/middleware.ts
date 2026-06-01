import { NextResponse, type NextRequest } from 'next/server'
import { createBrowserClient } from '@/lib/supabase'

// Edge-compatible native JWT parser
function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const session = req.cookies.get('session')?.value

  // Verify Firebase session token payload & expiration
  const payload = session ? parseJwt(session) : null;
  const isAuthenticated = payload && payload.exp * 1000 > Date.now();

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/login'],
}
