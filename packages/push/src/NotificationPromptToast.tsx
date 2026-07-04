'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button, NotificationIcon } from '@bconnect/ui'
import { useNotificationSoftAsk } from './use-notification-soft-ask'

/**
 * 푸시 알림 권한 soft-ask — 데스크톱(plan) sonner 커스텀 토스트.
 *
 * 바텀시트(NotificationPrompt)는 모바일 관용구라 데스크톱엔 어색 → sonner 토스트로 렌더하되,
 * 레이아웃(아이콘 pill + 타이틀/설명 + Button 2개)·문구는 모바일 시트와 통일한다.
 * sonner 기본 스타일 대신 toast.custom 으로 디자인시스템 프리미티브(Button·NotificationIcon)를 재사용.
 * 노출/억제 로직은 useNotificationSoftAsk 를 career 시트와 공유(동일 게이트), 표현만 다름.
 *
 * 토스트는 PushToaster(전역)에 렌더되므로 이 컴포넌트는 화면을 그리지 않는다.
 * firedRef + 세션 게이트로 1회만 발화. custom 렌더는 자동 닫힘이 없어 accept/dismiss 시 toast.dismiss 로 명시 닫음.
 */
export function NotificationPromptToast() {
  const { open, accept, dismiss } = useNotificationSoftAsk()
  const firedRef = useRef(false)

  useEffect(() => {
    if (!open || firedRef.current) return
    firedRef.current = true

    toast.custom(
      (id) => (
        <div className="flex w-89 items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <NotificationIcon size={20} className="text-primary" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-sb-16 text-gray-900">알림을 켜시겠어요?</p>
            <p className="mt-1 text-r-14 text-gray-600">
              새 채팅 메시지와 매칭 소식을 놓치지 않게 알려드려요.
            </p>
            <div className="mt-4 flex justify-end gap-2">
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
