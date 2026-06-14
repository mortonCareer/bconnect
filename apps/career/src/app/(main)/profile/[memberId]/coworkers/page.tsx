/**
 * @figma-pending 타인 프로필 동료 목록 — 본인 /profile/coworkers 와 동일 CoworkerList 재사용, 읽기 전용
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useGetCoworkers, useGetProfile } from '@bconnect/api-client'
import { CoworkerList } from '@bconnect/features'
import { TopBar } from '@bconnect/ui'

export default function MemberCoworkersPage() {
  const params = useParams<{ memberId: string }>()
  const memberId = Number(params.memberId)
  const router = useRouter()

  const { data: profileAndMember } = useGetProfile(memberId, {
    query: { enabled: Number.isFinite(memberId) && memberId > 0 },
  })
  const pid = profileAndMember?.profile?.id ?? 0

  const {
    data: coworkers,
    isLoading,
    isError,
  } = useGetCoworkers({ profileId: pid }, { query: { enabled: pid > 0 } })

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      <CoworkerList
        coworkers={coworkers}
        isLoading={isLoading}
        isError={isError}
        coworkerHref={(profileId) => `/profile/${profileId}`}
      />
    </div>
  )
}
