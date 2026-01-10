import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_EXACT = ['/']
const PUBLIC_PREFIX = ['/login', '/signup', '/component', '/instagram']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths는 인증 체크 안함
  if (PUBLIC_EXACT.includes(pathname) || PUBLIC_PREFIX.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 클라이언트 사이드에서 Zustand로 인증 상태 관리하므로
  // 미들웨어에서는 refreshToken 쿠키 존재 여부로만 체크
  const refreshToken = request.cookies.get('refreshToken')

  if (!refreshToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

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
