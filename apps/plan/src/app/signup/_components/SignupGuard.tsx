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

  const redirectTo = (() => {
    if (isAuthenticated && pathname === '/signup/corp') return null
    if (!formData.signupToken) return '/login'
    if (pathname === '/signup/corp' && (!formData.username || !formData.name)) {
      return '/signup/member'
    }
    return null
  })()

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  if (redirectTo) return null

  return children
}
