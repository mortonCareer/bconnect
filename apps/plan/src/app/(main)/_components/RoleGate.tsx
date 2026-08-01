'use client'

import { useAuthStore } from '@/stores/auth-store'
import { Role, useGetMyMember } from '@bconnect/api-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * 역할 가드 — PLAN 없이 plan 앱에 들어오면 업체 생성으로 돌려보낸다.
 *
 * 가입 직후 역할은 GUEST 하나뿐이고, 업체를 만들어야 PLAN 을 얻는다. register 는
 * 성공했는데 업체 생성 전에 이탈한 사용자가 이 상태로 남으므로, 앱 진입 시점에 다시
 * 그 단계로 잇는다. 비로그인은 대상이 아니다 — 게스트 화면(기술자 탐색)은 그대로 보여준다.
 */
export function RoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  // 비로그인이면 호출 자체를 막는다 (401 유발 방지).
  const { data: member, isLoading } = useGetMyMember({
    query: { enabled: isAuthenticated },
  })

  // member 로드 전에는 판정하지 않는다 — undefined 를 "역할 없음"으로 오인하면
  // 정상 사용자도 매 진입마다 가입 화면으로 튕긴다.
  const needsCompany = isAuthenticated && member && !member.roles.includes(Role.PLAN)

  useEffect(() => {
    if (needsCompany) router.replace('/signup/corp')
  }, [needsCompany, router])

  // 판정 중이거나 이동이 확정된 동안은 본문을 그리지 않는다 — 곧 사라질 화면이
  // 한 프레임 보이거나, 권한 없는 데이터 요청이 먼저 나가는 것을 막는다.
  if (isAuthenticated && (isLoading || needsCompany)) return null

  return children
}
