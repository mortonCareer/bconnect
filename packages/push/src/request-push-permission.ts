'use client'

import { getToken } from 'firebase/messaging'
import { getFcmMessaging } from './firebase'
import { registerDeviceToken, unregisterDeviceToken } from './register-device-token'
import { usePushStore, type PushPermissionStatus } from './push-store'

export function mapPermission(p: NotificationPermission): PushPermissionStatus {
  switch (p) {
    case 'granted':
      return 'granted'
    case 'denied':
      return 'denied'
    default:
      return 'prompt'
  }
}

async function fetchFcmToken(): Promise<string | null> {
  const messaging = await getFcmMessaging()
  if (!messaging) return null

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.warn('[FCM] VAPID key 미설정 - 토큰 발급 불가')
    return null
  }

  try {
    const token = await getToken(messaging, { vapidKey })
    if (token && process.env.NODE_ENV === 'development') {
      console.log('[FCM] 디바이스 토큰:', token)
    }
    return token
  } catch (error) {
    console.error('[FCM] 토큰 발급 실패:', error)
    return null
  }
}

/**
 * 토큰 발급 + 서버 등록 + store 반영.
 * 권한이 이미 granted 인 앱 진입 시점, soft-ask 수락 직후, 로그인 성공 직후(#800)에서 공유.
 * (서버 UPSERT 로 last_active_at 갱신 — Firebase 공식 권장 패턴)
 *
 * granted 가드 필수 — getToken 은 권한 미결정(default) 상태에서 호출되면 네이티브 권한
 * 팝업을 직접 띄워 soft-ask 게이트를 우회한다. granted 가 아니면 조용히 no-op.
 */
export async function syncDeviceToken(): Promise<void> {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return
  }
  const token = await fetchFcmToken()
  if (!token) return
  usePushStore.setState({ token })
  await registerDeviceToken(token)
}

/**
 * 서버에서 이 기기 등록 해제 + store 반영. 로그아웃·탈퇴에서 호출.
 * 서버가 인증을 요구하므로 accessToken 을 지우기 전에 await 해야 한다.
 */
export async function revokeDeviceToken(): Promise<void> {
  const token = usePushStore.getState().token
  if (!token) return
  await unregisterDeviceToken(token)
  usePushStore.setState({ token: null })
}

/**
 * 네이티브 권한 요청 + (허용 시) 토큰 동기화 + store 갱신.
 *
 * 사용자가 soft-ask 에서 명시적으로 수락했을 때만 호출한다 — 네이티브 권한 요청은
 * 1회성이라, 컨텍스트 없이 무분별하게 호출해 denied 를 받으면 브라우저가 재요청을
 * 영구 차단한다.
 */
export async function requestPushPermission(): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  const result = await Notification.requestPermission()
  usePushStore.setState({ permissionStatus: mapPermission(result) })

  if (result === 'granted') await syncDeviceToken()
}
