'use client'

import { useEffect, useRef } from 'react'
import { onMessage } from 'firebase/messaging'
import {
  getGetDirectChatsQueryKey,
  getGetGroupChatsQueryKey,
  getGetNotificationsQueryKey,
  getGetNotificationsUnreadCountQueryKey,
  hasAuthHint,
  useQueryClient,
} from '@bconnect/api-client'
import { getFcmMessaging } from './firebase'
import { useNotificationStore } from './notification-store'
import { usePushStore } from './push-store'
import type { PushData } from './push-data'
import { resolveReferenceHref, type ReferencePathMap } from './reference-paths'
import { mapPermission, syncDeviceToken } from './request-push-permission'

/**
 * FCM Web Push 부수효과 설치 — 앱 전역에서 단 1회(providers)만 마운트한다.
 *
 * 흐름:
 * 1. Service Worker 는 Firebase SDK 가 getToken 호출 시 자동 등록 (/firebase-messaging-sw.js)
 * 2. 지원 여부·권한 상태를 push-store 에 기록 (soft-ask UI 가 구독)
 * 3. 이미 허용된 경우 토큰 발급 + 서버 등록
 * 4. 포그라운드 수신 리스너 → 인앱 알림 스토어로 전달
 *
 * 권한 요청 UI 는 분리됨: request-push-permission.ts + use-notification-soft-ask.ts.
 * 이 훅은 상태를 반환하지 않는다 — 소비자는 push-store 를 구독한다.
 *
 * `referencePaths` 는 알림 딥링크 목적지 표 — SW·알림 목록과 같은 표를 공유한다.
 */
export function usePushNotificationListener(referencePaths: ReferencePathMap): void {
  const initialized = useRef(false)
  const showNotification = useNotificationStore((s) => s.show)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined' || initialized.current) return
    initialized.current = true

    let unsubscribe: (() => void) | undefined

    async function setup() {
      const messaging = await getFcmMessaging()

      if (!messaging || !('Notification' in window)) {
        usePushStore.setState({ permissionStatus: 'unsupported', isSupported: false })
        return
      }

      usePushStore.setState({
        isSupported: true,
        permissionStatus: mapPermission(Notification.permission),
      })

      // 이미 허용된 상태면 토큰 발급 + 서버 등록 (앱 진입마다 UPSERT 로 last_active_at 갱신).
      // 로그인 게이트 필수(#800) — 기기 등록 API 는 인증 필요라 로그아웃 상태면 401.
      // 이 effect 는 마운트 때 1회만 실행된다 — 로그아웃으로 진입했다가 새로고침 없이
      // 로그인하는 경우는 여기서 못 잡으므로 auth-store login() 이 직접 호출한다.
      if (Notification.permission === 'granted' && hasAuthHint()) await syncDeviceToken()

      // 포그라운드 수신 리스너
      // data-only 페이로드(title/body 가 data 안)도 대응
      unsubscribe = onMessage(messaging, (payload) => {
        // Firebase 의 data 는 인덱스 시그니처 — 키 오타를 못 잡으므로 계약 타입으로 좁힌다.
        const data = payload.data as Partial<PushData> | undefined
        const title = payload.notification?.title ?? payload.data?.title ?? '새 알림'
        const body = payload.notification?.body ?? payload.data?.body ?? ''
        const href = resolveReferenceHref(referencePaths, data?.reference_type, data?.reference_id)
        showNotification({ title, body, href })
        for (const queryKey of [
          getGetNotificationsUnreadCountQueryKey(),
          getGetNotificationsQueryKey(),
          getGetDirectChatsQueryKey(),
          getGetGroupChatsQueryKey(),
        ]) {
          queryClient.invalidateQueries({ queryKey })
        }
      })
    }

    setup()
    return () => unsubscribe?.()
  }, [showNotification, queryClient, referencePaths])
}
