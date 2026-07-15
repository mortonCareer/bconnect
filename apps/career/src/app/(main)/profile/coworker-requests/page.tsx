/**
 * @figma-pending 디자인 부재 — 기획 와이어프레임(#843) 기반 기능 구현, 세부 디자인은 별도 이슈로 추적
 * 받은 요청 https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB?node-id=1940-7575
 * 보낸 요청 https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB?node-id=1940-8026
 */
'use client'

import { useRouter } from 'next/navigation'
import { useGetReceivedCoworkerRequests, useGetSentCoworkerRequests } from '@bconnect/api-client'
import { CoworkerRequestList } from '@bconnect/features'
import { TopBar } from '@bconnect/ui'
import { useCoworkerRequestActions } from '../_adapters/useCoworkerRequestActions'

export default function CoworkerRequestsPage() {
  const router = useRouter()
  const { data: received } = useGetReceivedCoworkerRequests()
  const { data: sent } = useGetSentCoworkerRequests()
  const { onAccept, onDeny, onCancel, pendingId } = useCoworkerRequestActions()

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료 요청" showAction={false} onBack={() => router.back()} />
      <CoworkerRequestList
        received={received}
        sent={sent}
        onAccept={onAccept}
        onDeny={onDeny}
        onCancel={onCancel}
        pendingId={pendingId}
        profileHref={(memberId) => `/profile/${memberId}`}
      />
    </div>
  )
}
