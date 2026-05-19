import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_FILE = /\.(.*)$/

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public files and api/auth and _next/static assets
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // allow static assets
  if (PUBLIC_FILE.test(pathname)) return NextResponse.next()

  const cookie = req.cookies.get('session')
  if (!cookie) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
