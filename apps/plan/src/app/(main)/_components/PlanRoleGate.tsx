'use client'

import type { ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { RequireRole } from '@bconnect/features'
import { isPublicPath } from '@/lib/routes'

/** useSearchParams 를 쓰므로 호출부에서 반드시 Suspense 로 감싼다 (#480 사전 렌더 실패). */
export function PlanRoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <RequireRole
      allowed={['PLAN']}
      fallback="/signup/corp"
      exempt={isPublicPath(pathname, searchParams)}
    >
      {children}
    </RequireRole>
  )
}
