/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-11906
 * @figma-state 보낸요청 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-12127
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CoworkerStatus,
  useGetCoworkers,
  useGetMyMember,
  useGetReceivedCoworkerRequests,
  useGetSentCoworkerRequests,
} from '@bconnect/api-client'
import type { Coworker } from '@bconnect/api-client'
import { CoworkerList, CoworkerManageDrawer, CoworkerRequestList } from '@bconnect/features'
import { MoreVerticalIcon, TopBar } from '@bconnect/ui'
import { useCoworkerActions } from '../_adapters/useCoworkerActions'
import { useCoworkerRequestActions } from '../_adapters/useCoworkerRequestActions'
import { useMessageMember } from '../_adapters/useMessageMember'

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

  const { onDeleteCoworker, isDeletingCoworker } = useCoworkerActions()
  const { onMessage, isMessaging } = useMessageMember()

  // 동료 관리 드로어 — 대상(target)과 가시성(drawerOpen)을 분리해, 삭제 탭으로 드로어가 닫혀도
  // 확인 다이얼로그가 대상 이름/id 를 잃지 않게 한다.
  const [target, setTarget] = useState<Coworker | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const targetId = target?.member?.id

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

      {/* 하단: 동료 목록 — 행 ⋮ 메뉴로 동료 관리(메시지·삭제) */}
      <CoworkerList
        coworkers={coworkers ?? []}
        isLoading={isLoading}
        isError={isError}
        coworkerHref={(profileId) => `/profile/${profileId}`}
        renderRowMenu={(coworker) => (
          <button
            type="button"
            aria-label="동료 관리"
            onClick={() => {
              setTarget(coworker)
              setDrawerOpen(true)
            }}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 outline-none transition-colors hover:bg-gray-100 focus-visible:ring-1 focus-visible:ring-primary active:scale-95"
          >
            <MoreVerticalIcon size={16} />
          </button>
        )}
      />

      {/* 목록은 전부 성립된 동료(COWORKER) → 메시지·삭제만 노출 */}
      <CoworkerManageDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        status={CoworkerStatus.COWORKER}
        memberName={target?.member?.name ?? undefined}
        pending={isDeletingCoworker || isMessaging}
        onMessage={() => targetId != null && onMessage(targetId)}
        onDelete={() => targetId != null && onDeleteCoworker(targetId)}
      />
    </div>
  )
}
