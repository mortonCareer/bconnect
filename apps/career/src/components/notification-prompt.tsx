'use client'

import { Button } from '@morton/ui'
import { usePushNotifications } from '@/hooks/use-push-notifications'

/**
 * 푸시 알림 권한 요청 배너
 * 네이티브 앱에서만 표시, 권한 미요청(prompt) 상태일 때만 렌더링
 */
export function NotificationPrompt() {
  const { permissionStatus, requestPermission, isNative } = usePushNotifications()

  // 웹이거나, 이미 결정(granted/denied)된 경우 표시하지 않음
  if (!isNative || permissionStatus !== 'prompt') return null

  return (
    <div className="mx-4 my-3 rounded-[12px] border border-morton-gray-100 bg-white p-4">
      <p className="text-morton-sb-14 text-morton-gray-900">알림을 켜시겠어요?</p>
      <p className="mt-1 text-morton-r-12 text-morton-gray-500">
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
