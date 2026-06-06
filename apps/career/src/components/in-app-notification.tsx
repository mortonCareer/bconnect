'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotificationStore } from '@/stores/notification-store'

const AUTO_DISMISS_MS = 4000

/** 앱을 보고 있을 때 알림이 오면 화면 위쪽에 잠깐 떴다 사라지는 배너. 누르면 해당 화면으로 이동. */
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

  const handleClick = () => {
    if (current.href) router.push(current.href)
    dismiss()
  }

  return (
    <div role="alert" className="fixed top-0 right-0 left-0 z-50" onClick={handleClick}>
      <div className="mx-4 mt-[env(safe-area-inset-top,12px)] rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
        <p className="text-sb-14 text-gray-900 truncate">{current.title}</p>
        <p className="mt-0.5 text-r-12 text-gray-500 truncate">{current.body}</p>
      </div>
    </div>
  )
}
