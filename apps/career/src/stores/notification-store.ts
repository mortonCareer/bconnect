import { create } from 'zustand'

export interface InAppNotification {
  id: string
  title: string
  body: string
  /** 딥링크 경로 (예: /messages/123) */
  href?: string
  timestamp: number
}

interface NotificationStore {
  /** 현재 표시 중인 인앱 알림 (포그라운드 수신 시) */
  current: InAppNotification | null
  show: (notification: Omit<InAppNotification, 'id' | 'timestamp'>) => void
  dismiss: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  current: null,
  show: (notification) =>
    set({
      current: {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      },
    }),
  dismiss: () => set({ current: null }),
}))
