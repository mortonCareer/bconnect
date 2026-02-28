'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCurrentMember, useGetMyProfile } from '@morton/api-client'
import { Tab, TopBar } from '@morton/ui'
import { ProfileHeader } from './_components/ProfileHeader'
import { IntroSection } from './_components/IntroSection'
import { WorksSection } from './_components/WorksSection'

const TAB_ITEMS = [
  { key: 'intro', label: '소개' },
  { key: 'works', label: '작업물' },
]

export default function MyProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('intro')

  const { data: member, isLoading: isMemberLoading } = useGetCurrentMember()
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile()

  const isLoading = isMemberLoading || isProfileLoading

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="내 프로필" actionLabel="수정" showAction={false} />
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
        title="내 프로필"
        actionLabel="수정"
        onAction={() => router.push('/profile/edit')}
        onBack={() => router.back()}
      />

      {/* 프로필 헤더 */}
      <ProfileHeader
        name={member?.name}
        picture={member?.picture}
        role={member?.role}
        primaryTrade={profile?.primaryTrade}
        city={profile?.address?.city}
      />

      {/* 탭 */}
      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {/* 탭 콘텐츠 */}
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
