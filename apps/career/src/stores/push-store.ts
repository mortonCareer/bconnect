import { create } from 'zustand'

export type PushPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported'

interface PushStore {
  /** 네이티브 알림 권한 상태 */
  permissionStatus: PushPermissionStatus
  /** 현재 브라우저가 푸시 알림을 지원하는지 (iOS <16.4 PWA 미설치 등은 false) */
  isSupported: boolean
  /** FCM 디바이스 토큰 (서버 등록·dev 발송용) */
  token: string | null
}

/**
 * 푸시 알림 상태의 SSOT.
 *
 * 부수효과(use-push-notification-listener)는 앱 전역 1회만 마운트되어 여기에 write 하고,
 * soft-ask UI·DevPushPanel 등 소비자는 훅을 재인스턴스화하지 않고 여기서 read 한다.
 * (과거 usePushNotifications 를 두 곳에서 호출해 onMessage 리스너가 중복되던 버그 해소)
 */
export const usePushStore = create<PushStore>(() => ({
  permissionStatus: 'prompt',
  isSupported: false,
  token: null,
}))
