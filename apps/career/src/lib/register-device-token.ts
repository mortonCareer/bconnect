'use client'

/**
 * FCM 디바이스 토큰을 서버에 등록.
 *
 * Firebase 공식 권장 패턴: 앱 진입마다 호출해 서버에 UPSERT.
 * 같은 토큰이면 `last_active_at` 만 갱신, 바뀌었으면 교체.
 *
 * TODO: BE에 POST /api/v1/devices 구현되면 orval 생성 훅(`registerDevice`)으로 전환.
 * 현재는 Mock Route Handler 경유를 위해 상대 경로 fetch 를 유지.
 * OpenAPI 스펙은 `packages/api-client/src/openapi.yaml` 에 이미 정의됨.
 */
export async function registerDeviceToken(token: string): Promise<void> {
  try {
    const response = await fetch('/api/v1/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'web' }),
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
 * TODO: BE 구현 시 orval 훅 `unregisterDevice` 로 전환.
 */
export async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    await fetch('/api/v1/devices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch (error) {
    console.warn('[FCM] 디바이스 토큰 삭제 에러:', error)
  }
}
