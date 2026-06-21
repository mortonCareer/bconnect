/**
 * @figma-pending 푸시 알림 권한 soft-ask 카드(데스크톱) — 시안 미정.
 */
'use client'

import { Button, NotificationIcon } from '@bconnect/ui'
import { useNotificationSoftAsk } from './use-notification-soft-ask'

/**
 * 푸시 알림 권한 soft-ask — 데스크톱(plan) 우상단 코너 카드.
 *
 * 바텀시트(NotificationPrompt)는 모바일 관용구라 데스크톱엔 어색 → 비모달 코너 카드.
 * 노출/억제 로직은 useNotificationSoftAsk 를 career 시트와 공유(동일 게이트), 표현만 다름.
 */
export function NotificationPromptCard() {
  const { open, accept, dismiss } = useNotificationSoftAsk()

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="알림 권한 요청"
      className="animate-in fade-in slide-in-from-right-4 fixed top-4 right-4 z-50 w-80 rounded-xl border border-gray-100 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
          <NotificationIcon size={20} className="text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sb-16 text-gray-900">알림을 켜시겠어요?</p>
          <p className="mt-1 text-r-14 text-gray-500">
            새 메시지와 매칭 소식을 놓치지 않게 알려드려요.
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="text" size="small" onClick={dismiss}>
          나중에
        </Button>
        <Button variant="primary" size="small" onClick={accept}>
          알림 받기
        </Button>
      </div>
    </div>
  )
}
