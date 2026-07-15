/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-11906
 * @figma-state 보낸요청 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-12127
 */
'use client'

import { useRouter } from 'next/navigation'
import {
  useGetCoworkers,
  useGetMyMember,
  useGetReceivedCoworkerRequests,
  useGetSentCoworkerRequests,
} from '@bconnect/api-client'
import { CoworkerList, CoworkerRequestList } from '@bconnect/features'
import { TopBar } from '@bconnect/ui'
import { useCoworkerRequestActions } from '../_adapters/useCoworkerRequestActions'

export default function CoworkersPage() {
  const router = useRouter()

  const { data: member, isLoading: isMemberLoading } = useGetMyMember()
  const myId = member?.id

  const {
    data: coworkers,
    isLoading: isCoworkersLoading,
    isError,
  } = useGetCoworkers({ memberId: myId! }, { query: { enabled: myId != null } })

  const { data: received } = useGetReceivedCoworkerRequests()
  const { data: sent } = useGetSentCoworkerRequests()
  const { onAccept, onDeny, onCancel, pendingId } = useCoworkerRequestActions()

  const isLoading = isMemberLoading || (!!myId && isCoworkersLoading)

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      {/* 상단: 받은/보낸 동료요청 (수락·거절·취소) */}
      <CoworkerRequestList
        received={received}
        sent={sent}
        onAccept={onAccept}
        onDeny={onDeny}
        onCancel={onCancel}
        pendingId={pendingId}
        profileHref={(memberId) => `/profile/${memberId}`}
      />

      {/* 하단: 동료 목록 */}
      <CoworkerList
        coworkers={coworkers ?? []}
        isLoading={isLoading}
        isError={isError}
        coworkerHref={(profileId) => `/profile/${profileId}`}
      />
    </div>
  )
}
