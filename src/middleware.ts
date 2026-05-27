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

  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isStaffRoute = req.nextUrl.pathname.startsWith('/staff')
  const isLoginRoute = req.nextUrl.pathname === '/login'

  // If trying to access admin/staff and not logged in, redirect to login
  if ((isAdminRoute || isStaffRoute) && !isAuthenticated) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access login, redirect to dashboard depending on role
  if (isLoginRoute && isAuthenticated && payload) {
    const supabase = createBrowserClient()
    const userId = payload.sub || payload.user_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    } else if (profile?.role === 'staff') {
      return NextResponse.redirect(new URL('/staff', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/login'],
}
