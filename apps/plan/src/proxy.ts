import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_EXACT = ['/']
const PUBLIC_PREFIX = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_EXACT.includes(pathname) || PUBLIC_PREFIX.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // TODO: 인증 보호 임시 해제 — 로그인 플로우 완성 후 복구
  // const refreshToken = request.cookies.get('refreshToken')
  // if (!refreshToken) {
  //   const loginUrl = new URL('/login', request.url)
  //   loginUrl.searchParams.set('redirect', pathname)
  //   return NextResponse.redirect(loginUrl)
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}
