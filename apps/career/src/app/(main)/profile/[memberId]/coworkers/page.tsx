/**
 * @figma-pending 타인 프로필 동료 목록 — 본인 /profile/coworkers 화면(CoworkerCard) 재사용, 읽기 전용
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useGetCoworkers, useGetProfile } from '@bconnect/api-client'
import { TopBar } from '@bconnect/ui'
import { CoworkerCard } from '@/app/(main)/profile/coworkers/_components/CoworkerCard'

export default function MemberCoworkersPage() {
  const params = useParams<{ memberId: string }>()
  const memberId = Number(params.memberId)
  const router = useRouter()

  const { data: profileAndMember } = useGetProfile(memberId, {
    query: { enabled: Number.isFinite(memberId) && memberId > 0 },
  })
  const pid = profileAndMember?.profile?.id ?? 0

  const { data: coworkers, isLoading } = useGetCoworkers(
    { profileId: pid },
    { query: { enabled: pid > 0 } }
  )

  const coworkerMemberIds = (coworkers ?? []).map((c) => c.member.id)

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="동료" showAction={false} onBack={() => router.back()} />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      ) : coworkerMemberIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">등록된 동료가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {coworkerMemberIds.map((id) => (
            <CoworkerCard key={id} profileId={id} />
          ))}
        </div>
      )}
    </div>
  )
}
