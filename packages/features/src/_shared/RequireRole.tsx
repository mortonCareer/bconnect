'use client'

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { useGetMyMember, type Role } from '@bconnect/api-client'
import { isApiMockingEnabled } from '@bconnect/config/env'

interface RequireRoleProps {
  /** 이 중 하나라도 가지고 있으면 통과. */
  allowed: Role[]
  /** 역할이 없을 때 보낼 경로 (생성 페이지). */
  fallback: string
  /** 공개 경로 여부. 앱이 자기 규칙으로 계산해 넘긴다. */
  exempt?: boolean
  children: ReactNode
}

/**
 * 역할 기반 진입 차단 (ADR-0027). UX 게이트이지 보안 경계가 아니다 — 실제 차단은 BE 가 한다.
 *
 * - 공개 경로·mock 은 조회 자체를 걸어 게스트 401 을 만들지 않는다 (#802)
 * - 조회 실패는 통과. 네트워크 장애를 "권한 없음" 으로 오판하면 안 된다
 * - 이동은 effect 가 아니라 렌더 도중 — 보호 화면이 한 프레임도 그려지지 않는다
 */
export function RequireRole({ allowed, fallback, exempt = false, children }: RequireRoleProps) {
  const enabled = !exempt && !isApiMockingEnabled()
  const { data, isPending, isError } = useGetMyMember({ query: { enabled } })

  if (!enabled) return <>{children}</>
  if (isPending) return null
  if (isError) return <>{children}</>
  if (!data.roles.some((role) => allowed.includes(role))) redirect(fallback)

  return <>{children}</>
}
