'use client'

import { useParams, useRouter } from 'next/navigation'
import { useGetMember } from '@morton/api-client'
import { TopBar } from '@morton/ui'
import { ProfileHeader } from '../_components/ProfileHeader'

export default function MemberProfilePage() {
  const router = useRouter()
  const params = useParams<{ memberId: string }>()
  const memberId = Number(params.memberId)

  const {
    data: member,
    isLoading,
    error,
  } = useGetMember(memberId, {
    query: { enabled: !isNaN(memberId) },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="프로필" showAction={false} onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="프로필" showAction={false} onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">프로필을 불러올 수 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title={member.name ?? '프로필'}
        showAction={false}
        onBack={() => router.back()}
      />

      {/* 프로필 헤더 (Member 정보만 표시) */}
      <ProfileHeader name={member.name} picture={member.picture} role={member.role} />

      {/* 상세 프로필 미지원 안내 */}
      <div className="flex items-center justify-center px-4 py-10">
        <p className="text-m-14 text-morton-gray-500">상세 프로필 조회는 준비 중입니다</p>
      </div>
    </div>
  )
}
