'use client'

import { Button } from '@bconnect/ui'
import { usePushNotifications } from '@/hooks/use-push-notifications'

/**
 * 푸시 알림 권한 요청 배너
 * - prompt 상태(미결정)일 때만 노출
 * - denied/granted 이후에는 표시하지 않음
 * - 지원하지 않는 브라우저(iOS <16.4)에서는 숨김
 */
export function NotificationPrompt() {
  const { permissionStatus, requestPermission, isSupported } = usePushNotifications()

  if (!isSupported || permissionStatus !== 'prompt') return null

  return (
    <div className="mx-4 my-3 rounded-[12px] border border-gray-100 bg-white p-4">
      <p className="text-sb-14 text-gray-900">알림을 켜시겠어요?</p>
      <p className="mt-1 text-r-12 text-gray-500">
        새로운 채팅 메시지와 매칭 알림을 받을 수 있어요.
      </p>
      <div className="mt-3 flex gap-2">
        <Button variant="primary" size="sm" onClick={requestPermission}>
          알림 허용
        </Button>
      </div>
    </div>
  )
}
