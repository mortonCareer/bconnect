'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useNotificationSoftAsk } from './use-notification-soft-ask'

/**
 * 푸시 알림 권한 soft-ask — 데스크톱(plan) sonner 액션 토스트.
 *
 * 바텀시트(NotificationPrompt)는 모바일 관용구라 데스크톱엔 어색 → shadcn 표준 토스트(sonner).
 * 노출/억제 로직은 useNotificationSoftAsk 를 career 시트와 공유(동일 게이트), 표현만 다름.
 *
 * 토스트는 PushToaster(전역)에 렌더되므로 이 컴포넌트는 화면을 그리지 않는다.
 * firedRef + 세션 게이트로 1회만 발화. accept/cancel 클릭 시 sonner 가 자동 닫음.
 */
export function NotificationPromptToast() {
  const { open, accept, dismiss } = useNotificationSoftAsk()
  const firedRef = useRef(false)

  useEffect(() => {
    if (!open || firedRef.current) return
    firedRef.current = true

    toast('알림을 켜시겠어요?', {
      description: '새 메시지와 매칭 소식을 놓치지 않게 알려드려요.',
      duration: Infinity,
      action: { label: '알림 켜기', onClick: () => accept() },
      cancel: { label: '나중에', onClick: () => dismiss() },
    })
  }, [open, accept, dismiss])

  return null
}
