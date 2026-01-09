import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@morton/api-client'
import { setAccessToken } from '@morton/api-client'

type AuthStep = 'phone' | 'code' | 'authenticated'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // 로그인 플로우 상태
  authStep: AuthStep
  phoneNumber: string | null
  codeExpiresAt: Date | null

  // Actions
  setPhoneNumber: (phone: string) => void
  setCodeSent: (expiresAt: string) => void
  login: (user: User, accessToken: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      authStep: 'phone',
      phoneNumber: null,
      codeExpiresAt: null,

      setPhoneNumber: (phone) =>
        set({
          phoneNumber: phone,
          authStep: 'phone',
        }),

      setCodeSent: (expiresAt) =>
        set({
          authStep: 'code',
          codeExpiresAt: new Date(expiresAt),
        }),

      login: (user, accessToken) => {
        setAccessToken(accessToken)
        set({
          user,
          isAuthenticated: true,
          authStep: 'authenticated',
          phoneNumber: null,
          codeExpiresAt: null,
        })
      },

      logout: () => {
        setAccessToken(null)
        set({
          user: null,
          isAuthenticated: false,
          authStep: 'phone',
          phoneNumber: null,
          codeExpiresAt: null,
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      reset: () => {
        setAccessToken(null)
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          authStep: 'phone',
          phoneNumber: null,
          codeExpiresAt: null,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
