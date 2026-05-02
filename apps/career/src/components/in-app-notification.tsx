'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotificationStore } from '@/stores/notification-store'

const AUTO_DISMISS_MS = 4000

/**
 * 포그라운드 인앱 알림 배너
 * 앱이 활성 상태일 때 OS 푸시 대신 상단에 토스트로 표시
 * - 탭/터치 → 딥링크 이동 후 닫힘
 * - 4초 후 자동 사라짐
 */
export function InAppNotification() {
  const router = useRouter()
  const current = useNotificationStore((s) => s.current)
  const dismiss = useNotificationStore((s) => s.dismiss)

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [current, dismiss])

  if (!current) return null

  return (
    <div
      role="alert"
      className="fixed top-0 right-0 left-0 z-50"
      onClick={() => {
        if (current.href) router.push(current.href)
        dismiss()
      }}
    >
      <div className="mx-4 mt-[env(safe-area-inset-top,12px)] rounded-[12px] border border-morton-gray-100 bg-white p-3 shadow-lg">
        <p className="text-morton-sb-14 text-morton-gray-900 truncate">{current.title}</p>
        <p className="mt-0.5 text-morton-r-12 text-morton-gray-500 truncate">{current.body}</p>
      </div>
    </div>
  )
}
