'use client'

import { hasAuthHint } from '@bconnect/api-client'
import { useSignupStore } from '@/stores/signup-store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

/**
 * 가입 단계 가드 — 앞 단계를 건너뛴 진입을 그 단계로 되돌린다.
 *
 * 주소를 직접 치거나 새로고침해도 빈 가입 토큰으로 제출되는 일이 없어야 한다.
 * 페이지마다 흩어 두지 않고 signup layout 한 곳에서만 판정한다.
 */
export function SignupGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { formData } = useSignupStore()
  const isLoggedIn = hasAuthHint()

  // 인증 화면은 가입 토큰을 받는 곳이라 검사 대상이 아니고, 완료 화면은 이미 토큰을
  // 비운 뒤 도착하는 곳이라 검사하면 자기 자신을 튕겨낸다.
  const isEntryRoute = pathname === '/signup/auth'
  const isCompleteRoute = pathname === '/signup/complete'
  const requiresMemberInfo = pathname === '/signup/profile'

  const redirectTo = (() => {
    if (isEntryRoute || isCompleteRoute) return null
    // 로그인했는데 CAREER 가 없어 RequireRole 이 보낸 경우 — 가입 토큰 없이 들어오는 게 정상이다.
    // 판정 소스를 그 게이트와 맞춘다 (표시 쿠키). 갈리면 게이트가 보낸 사람을 여기서 되돌린다.
    if (isLoggedIn && pathname === '/signup/profile') return null
    // 가입 토큰이 없으면 어느 단계든 성립하지 않는다 — 인증부터.
    if (!formData.signupToken) return '/signup/auth'
    // 프로필 제출은 이름·사용자명을 함께 보내므로 그 값이 비면 앞 단계로.
    if (requiresMemberInfo && (!formData.username || !formData.name)) return '/signup/username'
    return null
  })()

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  // 이동이 확정된 렌더에서는 본문을 그리지 않는다 — 잘못된 단계 화면이 한 프레임 보이는 것 방지.
  if (redirectTo) return null

  return children
}
