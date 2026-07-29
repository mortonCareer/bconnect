'use client'

import { useAuthStore } from '@/stores/auth-store'
import { Role, useGetMyMember } from '@bconnect/api-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function RoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: member, isLoading } = useGetMyMember({
    query: { enabled: isAuthenticated },
  })

  const needsCompany = isAuthenticated && member && !member.roles.includes(Role.PLAN)

  useEffect(() => {
    if (needsCompany) router.replace('/signup/corp')
  }, [needsCompany, router])

  if (isAuthenticated && (isLoading || needsCompany)) return null

  return children
}
