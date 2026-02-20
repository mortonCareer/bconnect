import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member } from '@morton/api-client'
import { setAccessToken } from '@morton/api-client'

/**
 * 인증 단계
 * - phone: 전화번호 입력 단계
 * - code: OTP 코드 입력 단계
 * - authenticated: 인증 완료
 */
type AuthStep = 'phone' | 'code' | 'authenticated'

interface AuthState {
  /** 현재 로그인한 사용자 정보 */
  member: Member | null
  /** 인증 여부 */
  isAuthenticated: boolean
  /** 로딩 상태 */
  isLoading: boolean

  // 로그인 플로우 상태
  /** 현재 인증 단계 */
  authStep: AuthStep
  /** OTP 발송된 전화번호 (E.164 형식) */
  phoneNumber: string | null
  /** OTP 코드 만료 시간 */
  codeExpiresAt: Date | null

  // Actions
  /** 전화번호 설정 */
  setPhoneNumber: (phone: string) => void
  /** OTP 발송 완료 처리 */
  setCodeSent: (expiresAt: string) => void
  /** 로그인 처리 (member + accessToken 저장) */
  login: (member: Member, accessToken: string) => void
  /** 로그아웃 (상태 초기화) */
  logout: () => void
  /** 로딩 상태 설정 */
  setLoading: (loading: boolean) => void
  /** 전체 상태 초기화 */
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
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

      login: (member, accessToken) => {
        setAccessToken(accessToken)
        set({
          member,
          isAuthenticated: true,
          authStep: 'authenticated',
          phoneNumber: null,
          codeExpiresAt: null,
        })
      },

      logout: () => {
        setAccessToken(null)
        set({
          member: null,
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
          member: null,
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
        member: state.member,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
