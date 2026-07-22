'use client'

import { revokeDeviceToken } from '@bconnect/push'
import { useAuthStore } from '@/stores/auth-store'

interface SessionExitOptions {
  /** 서버 호출이 실패해도 로컬 인증을 정리한다. 로그아웃처럼 사용자가 이탈 의사를 밝힌 경우. */
  clearAuthOnFailure?: boolean
}

/**
 * 세션 종료 절차 — 기기 해제는 서버가 인증을 요구하므로 accessToken 이 살아있는 동안 선행한다.
 * 세션을 끝내는 경로(로그아웃·탈퇴)는 이 함수를 통과해야 순서와 해제 누락이 함께 보장된다.
 */
export function useSessionExit() {
  const clearAuth = useAuthStore((s) => s.logout)

  return async (
    serverCall: () => Promise<unknown>,
    { clearAuthOnFailure = false }: SessionExitOptions = {}
  ): Promise<void> => {
    await revokeDeviceToken()
    try {
      await serverCall()
    } catch (error) {
      if (clearAuthOnFailure) clearAuth()
      throw error
    }
    clearAuth()
  }
}
