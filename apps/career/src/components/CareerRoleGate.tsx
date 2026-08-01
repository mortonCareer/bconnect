'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { RequireRole } from '@bconnect/features'
import { isPublicPath } from '@/lib/routes'

export function CareerRoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <RequireRole allowed={['CAREER']} fallback="/signup/profile" exempt={isPublicPath(pathname)}>
      {children}
    </RequireRole>
  )
}
