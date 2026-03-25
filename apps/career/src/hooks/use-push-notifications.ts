'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isNativePlatform } from '@/lib/capacitor'
import { useNotificationStore } from '@/stores/notification-store'

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unknown'

interface PushNotificationState {
  /** 현재 알림 권한 상태 */
  permissionStatus: PermissionStatus
  /** FCM/APNs 디바이스 토큰 (서버에 등록용) */
  token: string | null
  /** 알림 권한 요청 */
  requestPermission: () => Promise<void>
  /** 네이티브 플랫폼 여부 */
  isNative: boolean
}

/**
 * 푸시 알림 관리 훅
 *
 * - 네이티브(iOS/Android): Capacitor PushNotifications 플러그인 사용
 * - 웹: 아무 것도 하지 않음 (웹 푸시는 별도 구현)
 *
 * 동작 방식:
 * - 앱 비활성(백그라운드/종료) → OS 레벨 푸시 알림
 * - 앱 포그라운드 → pushNotificationReceived 이벤트로 인앱 알림 처리
 */
export function usePushNotifications(): PushNotificationState {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown')
  const [token, setToken] = useState<string | null>(null)
  const isNative = isNativePlatform()
  const listenersRegistered = useRef(false)
  const showNotification = useNotificationStore((s) => s.show)

  useEffect(() => {
    if (!isNative || listenersRegistered.current) return

    let cleanup: (() => void) | undefined

    async function setup() {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      // 현재 권한 상태 확인
      const status = await PushNotifications.checkPermissions()
      setPermissionStatus(mapPermissionStatus(status.receive))

      // 이미 권한이 있으면 등록
      if (status.receive === 'granted') {
        await PushNotifications.register()
      }

      // 리스너 등록
      const registrationListener = await PushNotifications.addListener(
        'registration',
        (registrationToken) => {
          setToken(registrationToken.value)
          // TODO: 서버에 디바이스 토큰 등록 API 호출
          // registerDeviceToken(registrationToken.value)
        }
      )

      const registrationErrorListener = await PushNotifications.addListener(
        'registrationError',
        (error) => {
          console.error('Push registration error:', error.error)
        }
      )

      // 포그라운드에서 푸시 수신 시 → 인앱 알림으로 표시
      const receivedListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          showNotification({
            title: notification.title ?? '새 알림',
            body: notification.body ?? '',
            href: notification.data?.chatId ? `/messages/${notification.data.chatId}` : undefined,
          })
        }
      )

      // 알림 탭(클릭) 시
      const actionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          // 알림 탭 → 해당 화면으로 딥링크
          const data = action.notification.data
          if (data?.chatId) {
            window.location.href = `/messages/${data.chatId}`
          }
        }
      )

      listenersRegistered.current = true

      cleanup = () => {
        registrationListener.remove()
        registrationErrorListener.remove()
        receivedListener.remove()
        actionListener.remove()
      }
    }

    setup()

    return () => {
      cleanup?.()
      listenersRegistered.current = false
    }
  }, [isNative, showNotification])

  const requestPermission = useCallback(async () => {
    if (!isNative) return

    const { PushNotifications } = await import('@capacitor/push-notifications')
    const result = await PushNotifications.requestPermissions()
    setPermissionStatus(mapPermissionStatus(result.receive))

    if (result.receive === 'granted') {
      await PushNotifications.register()
    }
  }, [isNative])

  return {
    permissionStatus,
    token,
    requestPermission,
    isNative,
  }
}

function mapPermissionStatus(status: string): PermissionStatus {
  switch (status) {
    case 'granted':
      return 'granted'
    case 'denied':
      return 'denied'
    case 'prompt':
    case 'prompt-with-rationale':
      return 'prompt'
    default:
      return 'unknown'
  }
}
