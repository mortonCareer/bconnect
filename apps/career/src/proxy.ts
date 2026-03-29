import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_EXACT = ['/']
const PUBLIC_PREFIX = ['/login', '/signup', '/component', '/instagram', '/showcase', '/one-click']

/** /profile/123 같은 타인 프로필은 public, /profile (내 프로필)과 /profile/edit는 보호 */
const PUBLIC_PROFILE_PATTERN = /^\/profile\/\d+$/

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths는 인증 체크 안함
  if (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIX.some((path) => pathname.startsWith(path)) ||
    PUBLIC_PROFILE_PATTERN.test(pathname)
  ) {
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
