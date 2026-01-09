import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@morton/api-client'
import { setAccessToken } from '@morton/api-client'

/**
 * 인증 단계
 * - phone: 전화번호 입력 단계
 * - code: OTP 코드 입력 단계
 * - authenticated: 인증 완료
 */
type AuthStep = 'phone' | 'code' | 'authenticated'

/**
 * 인증 상태 관리 스토어
 *
 * @description
 * Zustand를 사용한 전역 인증 상태 관리. LocalStorage에 자동 persist됨.
 *
 * ## 인증 정보 접근 방법
 *
 * ### 1. React 컴포넌트 내부 (권장)
 * ```tsx
 * import { useAuthStore } from '@/stores/auth-store'
 *
 * function MyComponent() {
 *   // 필요한 상태만 선택적으로 구독 (리렌더링 최적화)
 *   const user = useAuthStore((state) => state.user)
 *   const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
 *
 *   // 또는 여러 상태를 한번에
 *   const { user, isAuthenticated, logout } = useAuthStore()
 *
 *   if (!isAuthenticated) return <div>로그인 필요</div>
 *   return <div>안녕하세요, {user?.name}님</div>
 * }
 * ```
 *
 * ### 2. 컴포넌트 외부 (유틸, API 인터셉터 등)
 * ```ts
 * import { useAuthStore } from '@/stores/auth-store'
 *
 * // getState()로 현재 스냅샷 조회
 * const { user, isAuthenticated } = useAuthStore.getState()
 *
 * // 액션 호출
 * useAuthStore.getState().logout()
 * ```
 *
 * ### 3. 상태 변경 구독 (디버깅, 로깅)
 * ```ts
 * const unsubscribe = useAuthStore.subscribe((state, prevState) => {
 *   if (state.isAuthenticated !== prevState.isAuthenticated) {
 *     console.log('인증 상태 변경:', state.isAuthenticated)
 *   }
 * })
 * ```
 *
 * ### 4. 브라우저 콘솔에서 디버깅
 * ```js
 * // LocalStorage에서 직접 확인
 * JSON.parse(localStorage.getItem('auth-storage'))
 * ```
 *
 * ## persist 설정
 * - 저장 키: 'auth-storage'
 * - 저장 항목: user, isAuthenticated (민감 정보 제외)
 * - accessToken은 메모리에만 유지 (setAccessToken)
 */
interface AuthState {
  /** 현재 로그인한 사용자 정보 */
  user: User | null
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
  /** 로그인 처리 (user + accessToken 저장) */
  login: (user: User, accessToken: string) => void
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
