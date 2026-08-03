'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

/**
 * 가입 단계 가드 — 앞 단계를 건너뛴 진입을 그 단계로 되돌린다.
 *
 * 주소를 직접 치거나 새로고침해도 빈 가입 토큰으로 제출되는 일이 없어야 한다.
 * 페이지마다 흩어 두지 않고 signup layout 한 곳에서만 판정한다.
 * career 와 달리 OTP 진입점이 `/login` 이라 되돌아가는 곳도 그쪽이다.
 */
export function SignupGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { formData } = useSignupStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const redirectTo = (() => {
    // 로그인했는데 PLAN 이 없어 RoleGate 가 보낸 경우 — 가입 토큰 없이 들어오는 게 정상이다.
    if (isAuthenticated && pathname === '/signup/corp') return null
    // 가입 토큰이 없으면 어느 단계든 성립하지 않는다 — 인증부터.
    if (!formData.signupToken) return '/login'
    // 업체 생성은 이름·사용자명을 함께 보내므로 그 값이 비면 앞 단계로.
    if (pathname === '/signup/corp' && (!formData.username || !formData.name)) {
      return '/signup/member'
    }
    return null
  })()

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  // 이동이 확정된 렌더에서는 본문을 그리지 않는다 — 잘못된 단계 화면이 한 프레임 보이는 것 방지.
  if (redirectTo) return null

  return children
}
