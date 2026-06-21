/**
 * @figma-pending 푸시 알림 권한 soft-ask 바(데스크톱) — 시안 미정.
 */
'use client'

import { Button, NotificationIcon, XIcon } from '@bconnect/ui'
import { useNotificationSoftAsk } from './use-notification-soft-ask'

/**
 * 푸시 알림 권한 soft-ask — 데스크톱(plan) 하단 non-blocking 바 (Slack 패턴).
 *
 * 바텀시트(NotificationPrompt)는 모바일 관용구·모달이라 데스크톱엔 어색 →
 * 콘텐츠 하단에 한 줄로 붙는 비차단 바. 위 화면은 그대로 사용 가능.
 * 노출/억제 로직은 useNotificationSoftAsk 를 career 시트와 공유(동일 게이트), 표현만 다름.
 *
 * 좌측 사이드바(w-270) 폭만큼 비켜 콘텐츠 영역에 정렬.
 */
export function NotificationPromptBar() {
  const { open, accept, dismiss } = useNotificationSoftAsk()

  if (!open) return null

  return (
    <div
      role="region"
      aria-label="알림 권한 요청"
      className="animate-in fade-in slide-in-from-bottom-2 fixed right-0 bottom-0 left-[270px] z-50 flex items-center gap-3 border-t border-gray-200 bg-white px-5 py-3 shadow-lg"
    >
      <NotificationIcon size={20} className="shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-r-14 text-gray-700">
        새 메시지와 매칭 소식을 놓치지 않게 알림을 켜보세요.
      </p>
      <Button variant="primary" size="small" onClick={accept}>
        알림 켜기
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="닫기"
        className="shrink-0 cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <XIcon size={18} />
      </button>
    </div>
  )
}
