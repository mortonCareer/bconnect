'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { onMessage, getToken } from 'firebase/messaging'
import { getFcmMessaging } from '@/lib/firebase'
import { useNotificationStore } from '@/stores/notification-store'
import { registerDeviceToken } from '@/lib/register-device-token'

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported'

interface PushNotificationState {
  permissionStatus: PermissionStatus
  /** FCM 디바이스 토큰 (서버 등록용) */
  token: string | null
  /** 알림 권한 요청 + 토큰 발급 */
  requestPermission: () => Promise<void>
  /** 현재 브라우저가 푸시 알림을 지원하는지 */
  isSupported: boolean
}

/**
 * FCM Web Push 관리 훅
 *
 * 흐름:
 * 1. Service Worker 등록 + Firebase config 전달
 * 2. 기존 권한 상태 확인
 * 3. 이미 허용된 경우 토큰 자동 발급
 * 4. 포그라운드 수신 리스너 등록 → 인앱 알림 스토어로 전달
 */
export function usePushNotifications(): PushNotificationState {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt')
  const [token, setToken] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const initialized = useRef(false)
  const showNotification = useNotificationStore((s) => s.show)

  useEffect(() => {
    if (typeof window === 'undefined' || initialized.current) return
    initialized.current = true

    let unsubscribe: (() => void) | undefined

    async function setup() {
      const messaging = await getFcmMessaging()

      if (!messaging || !('Notification' in window)) {
        setPermissionStatus('unsupported')
        setIsSupported(false)
        return
      }

      setIsSupported(true)
      setPermissionStatus(mapPermission(Notification.permission))

      // Service Worker는 Firebase JS SDK 가 getToken 호출 시 자동 등록함
      // (/firebase-messaging-sw.js 를 기본 경로로 탐색, 우리는 Route Handler로 동적 서빙)

      // 권한이 이미 허용된 상태면 토큰 발급 + 서버 등록.
      // 앱 진입마다 호출되어 서버 UPSERT 로 last_active_at 을 갱신 (Firebase 공식 권장 패턴)
      if (Notification.permission === 'granted') {
        const fcmToken = await getFcmToken()
        if (fcmToken) {
          setToken(fcmToken)
          await registerDeviceToken(fcmToken)
        }
      }

      // 포그라운드 수신 리스너
      // data-only 페이로드는 notification 없이 data 안에 title/body 를 넣는 케이스도 대응.
      // 딥링크 경로는 BE 가 `data.url` 에 직접 넣음 (SW/훅 공통 규격 — firebase-messaging.sw.template.js 참조)
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? payload.data?.title ?? '새 알림'
        const body = payload.notification?.body ?? payload.data?.body ?? ''
        showNotification({
          title,
          body,
          href: payload.data?.url,
        })
      })
    }

    setup()
    return () => unsubscribe?.()
  }, [showNotification])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return

    const result = await Notification.requestPermission()
    setPermissionStatus(mapPermission(result))

    if (result === 'granted') {
      const fcmToken = await getFcmToken()
      if (fcmToken) {
        setToken(fcmToken)
        await registerDeviceToken(fcmToken)
      }
    }
  }, [isSupported])

  return { permissionStatus, token, requestPermission, isSupported }
}

async function getFcmToken(): Promise<string | null> {
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

function mapPermission(p: NotificationPermission): PermissionStatus {
  switch (p) {
    case 'granted':
      return 'granted'
    case 'denied':
      return 'denied'
    default:
      return 'prompt'
  }
}
