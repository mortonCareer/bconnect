import { AUTH_HINT_COOKIE } from '@bconnect/api-client/auth-hint'
import { isApiMockingEnabled } from '@bconnect/config/env'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isPublicPath } from '@/lib/routes'

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl

  if (isPublicPath(pathname, searchParams)) {
    return NextResponse.next()
  }

  if (!isApiMockingEnabled()) {
    const authHint = request.cookies.get(AUTH_HINT_COOKIE)
    if (!authHint) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname + search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

/**
 * matcher 의 negative lookahead 는 "middleware 함수 자체가 실행되지 않을 path" 를 정의.
 * 정적 자산/API 라우트 등은 middleware 호출 비용을 아예 면제한다.
 * 함수 안의 PUBLIC_EXACT / PUBLIC_PREFIX 와는 위계가 다름:
 *   - matcher 제외: middleware 실행 X (이 곳)
 *   - PUBLIC route: middleware 실행 O, 인증 가드만 우회
 *
 * 제외 대상:
 *   - _next/static, _next/image: Next.js 빌드 산출물 / 이미지 최적화
 *   - favicon.ico: 파비콘 직접 요청
 *   - .*\..*: 점이 들어간 path (확장자 있는 정적 파일 — 이미지/폰트/소스맵 등)
 *   - api: API 라우트 (자체 인증 처리, middleware 중복 가드 회피)
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'],
}
