'use client'

import { createDevice, deleteDevice, DevicePlatform } from '@bconnect/api-client'

/**
 * FCM 디바이스 토큰을 서버에 등록.
 *
 * Firebase 공식 권장 패턴: 앱 진입마다 호출해 서버에 UPSERT.
 */
export async function registerDeviceToken(token: string): Promise<void> {
  try {
    await createDevice({ token, platform: DevicePlatform.web })
  } catch (error) {
    // 토큰 등록 실패는 앱 동작 막지 않음 (알림만 안 올 뿐)
    console.warn('[FCM] 디바이스 토큰 등록 에러:', error)
  }
}

/**
 * 로그아웃 시 토큰 삭제.
 * 다른 유저가 같은 브라우저에 로그인했을 때 이전 유저 알림이 안 가도록.
 */
export async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    await deleteDevice({ token })
  } catch (error) {
    console.warn('[FCM] 디바이스 토큰 삭제 에러:', error)
  }
}
