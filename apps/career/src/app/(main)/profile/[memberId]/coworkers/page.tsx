/**
 * @figma-pending 타인 프로필 동료 목록 — 본인 /profile/coworkers 와 동일 CoworkerList 재사용
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useGetCoworkers } from '@bconnect/api-client'
import { CoworkerList, CoworkerManageDrawer } from '@bconnect/features'
import { MoreVerticalIcon, TopBar } from '@bconnect/ui'
import { useCoworkerManageDrawer } from '@/app/(main)/profile/_adapters/useCoworkerManageDrawer'

export default function MemberCoworkersPage() {
  const params = useParams<{ memberId: string }>()
  const memberId = Number(params.memberId)
  const router = useRouter()

  // 동료 조회는 memberId 로 직접 (useGetCoworkers 인자 = memberId).
  const {
    data: coworkers,
    isLoading,
    isError,
  } = useGetCoworkers(
    { memberId },
    { query: { enabled: Number.isFinite(memberId) && memberId > 0 } }
  )

  const { openFor, drawerProps } = useCoworkerManageDrawer()

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      {/* 타인의 동료 목록이라 각 행의 status(= 나와 그 사람의 관계)가 NONE/SENT/RECEIVED/COWORKER
          로 섞인다. 드로어가 status 별로 액션을 파생한다 (#870) */}
      <CoworkerList
        coworkers={coworkers}
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
