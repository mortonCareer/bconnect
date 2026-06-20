'use client'

import { getToken } from 'firebase/messaging'
import { getFcmMessaging } from '@/lib/firebase'
import { registerDeviceToken } from '@/lib/register-device-token'
import { usePushStore, type PushPermissionStatus } from '@/stores/push-store'

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
 * 권한이 이미 granted 인 앱 진입 시점과 soft-ask 수락 직후 양쪽에서 공유.
 * (서버 UPSERT 로 last_active_at 갱신 — Firebase 공식 권장 패턴)
 */
export async function syncDeviceToken(): Promise<void> {
  const token = await fetchFcmToken()
  if (!token) return
  usePushStore.setState({ token })
  await registerDeviceToken(token)
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
