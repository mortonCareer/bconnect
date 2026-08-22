/**
 * @figma-pending 푸시 알림 권한 soft-ask 토스트 — 시안 미정.
 * 확정 시안이 없어 plan 의 다른 모달 기준인 ConfirmDialog(@bconnect/ui) 토큰을 준용한다:
 * rounded-2xl / p-5 / 타이틀 text-sb-16 gray-900 / 설명 mt-2 text-r-14 gray-600 / 액션 mt-5 gap-1.
 */
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
 * 바텀시트(NotificationPrompt)는 모바일 관용구라 데스크톱엔 어색 → sonner 토스트로 렌더한다.
 * sonner 기본 스타일 대신 toast.custom 으로 디자인시스템 프리미티브를 재사용.
 * 노출/억제 로직은 useNotificationSoftAsk 를 career 시트와 공유(동일 게이트), 표현만 다름.
 *
 * 카드가 오버레이 없이 페이지 표면 위에 뜨므로 border+shadow(elevation)는 ConfirmDialog 기준의
 * 의도된 예외다. 테두리는 gray-100 — 이 클래스가 생성되지 않으면 Tailwind 기본값인 currentColor 로
 * 떨어져 검은 테두리가 된다(#1009). globals.css 의 @source 에 packages/push 가 있어야 한다.
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
        <div
          role="dialog"
          aria-labelledby={TITLE_ID}
          aria-describedby={DESC_ID}
          // w-full max-w-89: 고정폭이면 좁은 뷰포트에서 토스트가 화면 밖으로 밀린다
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
