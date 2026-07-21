'use client'

import { createDevice, DevicePlatform } from '@bconnect/api-client'

/**
 * FCM 디바이스 토큰을 서버에 등록.
 *
 * Firebase 공식 권장 패턴: 앱 진입마다 호출해 서버에 UPSERT.
 * 같은 토큰이면 `last_active_at` 만 갱신, 바뀌었으면 교체.
 */
export async function registerDeviceToken(token: string): Promise<void> {
  try {
    await createDevice({ token, platform: DevicePlatform.web })
  } catch (error) {
    // 토큰 등록 실패는 앱 동작 막지 않음 (알림만 안 올 뿐)
    console.warn('[FCM] 디바이스 토큰 등록 에러:', error)
  }
}
