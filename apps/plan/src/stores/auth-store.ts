import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAccessToken, setAuthHint, clearAuthHint } from '@bconnect/api-client'
import { syncDeviceToken } from '@bconnect/push'

// member 정보의 진실원은 server (useGetMyMember). store 는 인증/OTP flow 의 client state 만.
type AuthStep = 'phone' | 'code' | 'authenticated'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean

  // OTP flow
  authStep: AuthStep
  phoneNumber: string | null
  codeExpiresAt: Date | null

  setPhoneNumber: (phone: string) => void
  setCodeSent: (expiresAt: string) => void
  /** 로그인 처리 — accessToken 만 저장. member 정보는 useGetMyMember 로 별도 조회. */
  login: (accessToken: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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

      login: (accessToken) => {
        setAccessToken(accessToken)
        setAuthHint()
        // 앱 진입 시점 등록은 로그인 게이트에 막히므로, 세션 중 로그인은 여기서 등록(#800).
        // 권한 granted 아니면 내부 가드로 no-op.
        void syncDeviceToken()
        set({
          isAuthenticated: true,
          authStep: 'authenticated',
          phoneNumber: null,
          codeExpiresAt: null,
        })
      },

      logout: () => {
        setAccessToken(null)
        clearAuthHint()
        set({
          isAuthenticated: false,
          authStep: 'phone',
          phoneNumber: null,
          codeExpiresAt: null,
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      reset: () => {
        setAccessToken(null)
        clearAuthHint()
        set({
          isAuthenticated: false,
          isLoading: false,
          authStep: 'phone',
          phoneNumber: null,
          codeExpiresAt: null,
        })
      },
    }),
    {
      name: 'plan-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
