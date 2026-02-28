'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGetMember, useGetProfile } from '@morton/api-client'
import { Button, Tab, TopBar } from '@morton/ui'
import { useFeedItems } from '@/hooks/useFeedItems'
import { ProfileHeader } from '../_components/ProfileHeader'
import { StatsRow } from '../_components/StatsRow'
import { IntroSection } from '../_components/IntroSection'
import { WorksSection } from '../_components/WorksSection'

const TAB_ITEMS = [
  { key: 'intro', label: '소개' },
  { key: 'works', label: '작업물' },
]

export default function MemberProfilePage() {
  const router = useRouter()
  const params = useParams<{ memberId: string }>()
  const memberId = Number(params.memberId)
  const [activeTab, setActiveTab] = useState('intro')

  const {
    data: member,
    isLoading: isMemberLoading,
    error: memberError,
  } = useGetMember(memberId, {
    query: { enabled: !isNaN(memberId) },
  })

  // profileId = memberId (1:1 매핑)
  const { data: profile, isLoading: isProfileLoading } = useGetProfile(memberId, {
    query: { enabled: !isNaN(memberId) },
  })

  const { postCount } = useFeedItems({ authorId: profile?.id })

  const isLoading = isMemberLoading || isProfileLoading

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

  if (memberError || !member) {
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
        title={member.username ?? member.name ?? '프로필'}
        showAction={false}
        onBack={() => router.back()}
      />

      <ProfileHeader
        name={member.name}
        picture={member.picture}
        city={profile?.address?.city}
        headline={profile?.headline}
      />

      <StatsRow
        postCount={postCount}
        trades={profile?.trades}
        primaryTrade={profile?.primaryTrade}
        experience={profile?.experience}
        role={member.role}
      />

      <div className="px-4 py-3">
        <Button variant="outline" size="full" onClick={() => router.push('/messages')}>
          메시지
        </Button>
      </div>

      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'intro' && profile && <IntroSection profile={profile} />}
      {activeTab === 'intro' && !profile && (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">프로필 정보가 없습니다</p>
        </div>
      )}
      {activeTab === 'works' && profile?.id && <WorksSection authorId={profile.id} />}
      {activeTab === 'works' && !profile?.id && (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">작업물을 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  )
}
