'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetMyMember, useGetMyProfile } from '@morton/api-client'
import { Button, Tab, TopBar } from '@morton/ui'
import { useFeedItems } from '@/hooks/useFeedItems'
import { ProfileHeader } from './_components/ProfileHeader'
import { StatsRow } from './_components/StatsRow'
import { IntroSection } from './_components/IntroSection'
import { WorksSection } from './_components/WorksSection'

const TAB_ITEMS = [
  { key: 'intro', label: '소개' },
  { key: 'works', label: '작업물' },
]

export default function MyProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('intro')

  const { data: member, isLoading: isMemberLoading } = useGetMyMember()
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile()
  const { postCount } = useFeedItems({ authorId: profile?.id })

  const isLoading = isMemberLoading || isProfileLoading

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="내 프로필" showAction={false} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title={member?.username ?? '내 프로필'}
        showAction={false}
        onBack={() => router.back()}
      />

      <ProfileHeader
        name={member?.name}
        picture={member?.picture}
        city={profile?.address?.city}
        headline={profile?.headline}
      />

      <StatsRow
        postCount={postCount}
        trades={profile?.trades}
        primaryTrade={profile?.primaryTrade}
        experience={profile?.experience}
        role={member?.role}
      />

      <div className="px-4 py-3">
        <Button variant="outline" size="full" onClick={() => router.push('/profile/edit')}>
          프로필 수정
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
