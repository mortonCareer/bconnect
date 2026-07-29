'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

export function SignupGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { formData } = useSignupStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const isEntryRoute = pathname === '/signup/auth'
  const isCompleteRoute = pathname === '/signup/complete'
  const requiresMemberInfo = pathname === '/signup/profile'

  const redirectTo = (() => {
    if (isEntryRoute || isCompleteRoute) return null
    if (isAuthenticated && pathname === '/signup/profile') return null
    if (!formData.signupToken) return '/signup/auth'
    if (requiresMemberInfo && (!formData.username || !formData.name)) return '/signup/username'
    return null
  })()

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  if (redirectTo) return null

  return children
}
