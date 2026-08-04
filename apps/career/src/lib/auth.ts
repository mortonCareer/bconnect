import { setAccessToken, setAuthHint, clearAuthHint } from '@bconnect/api-client'
import { syncDeviceToken } from '@bconnect/push'

/** 로그인 처리 — accessToken 만 저장. member 정보는 useGetMyMember 로 별도 조회. */
export function login(accessToken: string) {
  setAccessToken(accessToken)
  setAuthHint()
  // 앱 진입 시점 등록은 로그인 게이트에 막히므로, 세션 중 로그인은 여기서 등록(#800).
  // 권한 granted 아니면 내부 가드로 no-op.
  void syncDeviceToken()
}

export function logout() {
  setAccessToken(null)
  clearAuthHint()
}
