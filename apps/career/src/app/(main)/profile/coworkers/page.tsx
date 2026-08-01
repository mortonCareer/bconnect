/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-11905
 * @figma-state 받은요청 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-12127
 */
'use client'

import { useRouter } from 'next/navigation'
import {
  useGetCoworkers,
  useGetMyMember,
  useGetReceivedCoworkerRequests,
  useGetSentCoworkerRequests,
} from '@bconnect/api-client'
import { CoworkerList, CoworkerManageDrawer, CoworkerRequestList } from '@bconnect/features'
import { MoreVerticalIcon, TopBar } from '@bconnect/ui'
import { useCoworkerManageDrawer } from '../_adapters/useCoworkerManageDrawer'
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

  const { openFor, drawerProps } = useCoworkerManageDrawer()

  const isLoading = isMemberLoading || (!!myId && isCoworkersLoading)

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      {/* 상단: 보낸/받은 동료요청 (취소·수락·거절) */}
      <CoworkerRequestList
        received={received}
        sent={sent}
        onAccept={onAccept}
        onDeny={onDeny}
        onCancel={onCancel}
        pendingId={pendingId}
        profileHref={(memberId) => `/profile/${memberId}`}
      />

      {/* 하단: 동료 목록 — 행 ⋮ 메뉴로 동료 관리 */}
      <p className="px-4 pb-1 pt-3 text-r-14 text-gray-500">동료 목록</p>
      <CoworkerList
        coworkers={coworkers ?? []}
        isLoading={isLoading}
        isError={isError}
        coworkerHref={(profileId) => `/profile/${profileId}`}
        renderRowMenu={(coworker) => (
          <button
            type="button"
            aria-label="동료 관리"
            onClick={() => openFor(coworker)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 outline-none transition-colors hover:bg-gray-100 focus-visible:ring-1 focus-visible:ring-primary active:scale-95"
          >
            <MoreVerticalIcon size={16} />
          </button>
        )}
      />

      <CoworkerManageDrawer {...drawerProps} />
    </div>
  )
}
