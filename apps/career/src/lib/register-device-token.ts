'use client'

/**
 * FCM 디바이스 토큰을 서버에 등록.
 *
 * Firebase 공식 권장 패턴: 앱 진입마다 호출해 서버에 UPSERT.
 * 같은 토큰이면 `last_active_at` 만 갱신, 바뀌었으면 교체.
 *
 * dev 환경에선 MSW 가 `apps/career/src/mocks/handlers/devices.ts` 로 응답.
 * prod 환경에선 BE 가 #233 으로 구현 예정. 그 때까지 prod 에선 404.
 * BE 완료 후 orval 생성 훅 `useRegisterDevice` 로 전환 예정.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function registerDeviceToken(token: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/v1/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'WEB' }),
    })

    if (!response.ok) {
      console.warn('[FCM] 디바이스 토큰 등록 실패:', response.status)
    }
  } catch (error) {
    // 토큰 등록 실패는 앱 동작 막지 않음 (알림만 안 올 뿐)
    console.warn('[FCM] 디바이스 토큰 등록 에러:', error)
  }
}

/**
 * 로그아웃 시 토큰 삭제.
 * 다른 유저가 같은 브라우저에 로그인했을 때 이전 유저 알림이 안 가도록.
 * BE 구현 후 orval 훅 `useUnregisterDevice` 로 전환 예정.
 */
export async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/v1/devices`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch (error) {
    console.warn('[FCM] 디바이스 토큰 삭제 에러:', error)
  }
}
