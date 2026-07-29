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

  const needsProfile = isAuthenticated && member && !member.roles.includes(Role.CAREER)

  useEffect(() => {
    if (needsProfile) router.replace('/signup/profile')
  }, [needsProfile, router])

  if (isAuthenticated && (isLoading || needsProfile)) return null

  return children
}
