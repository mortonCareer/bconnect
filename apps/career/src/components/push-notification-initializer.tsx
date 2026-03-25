'use client'

import { usePushNotifications } from '@/hooks/use-push-notifications'

/**
 * 앱 시작 시 푸시 알림 리스너를 등록하는 컴포넌트
 * Providers 안에서 마운트되어 앱 전체 생명주기 동안 유지
 */
export function PushNotificationInitializer() {
  // 훅 호출만으로 리스너 등록 + 토큰 관리가 시작됨
  usePushNotifications()
  return null
}
