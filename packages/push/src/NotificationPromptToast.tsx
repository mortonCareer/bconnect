/** @figma-pending 확정 시안 전까지 ConfirmDialog 토큰을 준용한다. */
'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button, NotificationIcon } from '@bconnect/ui'
import { useNotificationSoftAsk } from './use-notification-soft-ask'

const TITLE_ID = 'notif-softask-toast-title'
const DESC_ID = 'notif-softask-toast-desc'

/**
 * 푸시 알림 권한 soft-ask — 데스크톱(plan) sonner 커스텀 토스트.
 *
 * 노출 로직은 career 시트와 공유하고, 데스크톱에서는 디자인시스템 기반 토스트로 표현한다.
 * 전역 PushToaster에서 세션당 한 번 표시하며 사용자 응답 시 명시적으로 닫는다.
 */
export function NotificationPromptToast() {
  const { open, accept, dismiss } = useNotificationSoftAsk()
  const firedRef = useRef(false)

  useEffect(() => {
    if (!open || firedRef.current) return
    firedRef.current = true

    toast.custom(
      (id) => (
        <div
          role="dialog"
          aria-labelledby={TITLE_ID}
          aria-describedby={DESC_ID}
          // 좁은 화면에서는 뷰포트 너비에 맞춘다.
          className="flex w-full max-w-89 items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-lg"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <NotificationIcon size={20} className="text-primary" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <p id={TITLE_ID} className="text-sb-16 text-gray-900">
              알림을 켜시겠어요?
            </p>
            <p id={DESC_ID} className="mt-2 text-r-14 text-gray-600">
              새 채팅 메시지와 매칭 소식을 놓치지 않게 알려드려요.
            </p>
            <div className="mt-5 flex justify-end gap-1">
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  toast.dismiss(id)
                  dismiss()
                }}
              >
                나중에
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => {
                  toast.dismiss(id)
                  accept()
                }}
              >
                알림 받기
              </Button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity }
    )
  }, [open, accept, dismiss])

  return null
}
