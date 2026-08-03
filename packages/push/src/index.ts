// @bconnect/push - FCM Web Push 공유 인프라 (career + plan)

// 부수효과 / 권한
export { usePushNotificationListener } from './use-push-notification-listener'
export { useNotificationSoftAsk } from './use-notification-soft-ask'
export {
  requestPushPermission,
  syncDeviceToken,
  revokeDeviceToken,
} from './request-push-permission'
export { registerDeviceToken, unregisterDeviceToken } from './register-device-token'

// 상태
export { usePushStore, type PushPermissionStatus } from './push-store'
export { useNotificationStore, type InAppNotificationItem } from './notification-store'

// 알림 딥링크 목적지 표 — 앱이 소유하고 SW·인앱 토스트·알림 목록이 공유
export { resolveReferenceHref, type ReferencePathMap } from './reference-paths'

// UI — soft-ask 시트(career·모바일) / sonner 토스트(plan·데스크톱), 게이트 로직 공유
export { NotificationPrompt } from './NotificationPrompt'
export { NotificationPromptToast } from './NotificationPromptToast'
export { PushToaster } from './PushToaster'
export { InAppNotification } from './InAppNotification'

// Service Worker 빌더는 node:fs 를 쓰는 서버 전용 → '@bconnect/push/server' 서브패스 (./server.ts)
