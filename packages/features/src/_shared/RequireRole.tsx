'use client'

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { hasAuthHint, useGetMyMember, type Role } from '@bconnect/api-client'

interface RequireRoleProps {
  /** 이 중 하나라도 가지고 있으면 통과. */
  allowed: Role[]
  /** 역할이 없을 때 보낼 경로 (생성 페이지). */
  fallback: string
  children: ReactNode
}

/**
 * 역할 기반 진입 차단 (ADR-0027). UX 게이트이지 보안 경계가 아니다 — 실제 차단은 BE 가 한다.
 *
 * 앱 단위로 적용한다. `(main)` 안에서는 경로 예외가 없고, 생성 페이지·약관 같은 목적지는
 * 애초에 `(main)` 밖이라 게이트를 거치지 않는다.
 *
 * 역할이 없다고 **확실히 아는 경우에만** 이동시킨다. 비로그인·조회 중·조회 실패는 모두 통과다.
 * - 비로그인: 조회 자체를 걸어 게스트 401 을 만들지 않는다 (#802)
 * - 조회 중: 통과. 여기서 막으면 서버 렌더와 결과가 갈려 hydration 이 깨진다
 *   (`hasAuthHint` 는 쿠키를 읽어 서버에서 항상 false)
 * - 조회 실패: 통과. 네트워크 장애를 "권한 없음" 으로 오판하면 안 된다
 *
 * 판정 전 화면이 잠깐 보일 수 있으나 데이터는 BE 가 막는다.
 */
export function RequireRole({ allowed, fallback, children }: RequireRoleProps) {
  const { data } = useGetMyMember({ query: { enabled: hasAuthHint() } })

  if (data && !data.roles.some((role) => allowed.includes(role))) redirect(fallback)

  return <>{children}</>
}
