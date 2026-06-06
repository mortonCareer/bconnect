/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1238-5348
 * @figma-state 작업물 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1238-6027
 */
'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useGetMyMember,
  useGetMyProfile,
  useGetCoworkers,
  useGetCredentials,
  useGetMyReceivedRecommendations,
  useGetMySentRecommendations,
} from '@bconnect/api-client'
import { Button, Tab, TopBar } from '@bconnect/ui'
import { useQueryState } from 'nuqs'
import { useFeedItems } from '@/hooks/useFeedItems'
import { ProfileHeader } from './_components/ProfileHeader'
import { IntroSection } from './_components/IntroSection'
import { WorksSection } from './_components/WorksSection'

const TAB_ITEMS = [
  { key: 'intro', label: '소개' },
  { key: 'works', label: '작업물' },
]

export default function MyProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'intro' })

  const { data: memberData, isLoading: isMemberLoading } = useGetMyMember()
  const { data: profileData, isLoading: isProfileLoading } = useGetMyProfile()

  const { postCount } = useFeedItems({ authorId: profileData?.id })
  const { data: coworkers } = useGetCoworkers(
    { profileId: profileData?.id ?? 0 },
    { query: { enabled: !!profileData?.id } }
  )
  const { data: credentialsData } = useGetCredentials(
    { profileId: profileData?.id ?? 0 },
    { query: { enabled: !!profileData?.id } }
  )
  const credentialsList = credentialsData ?? []
  const { data: receivedRecommendations } = useGetMyReceivedRecommendations()
  const { data: sentRecommendations } = useGetMySentRecommendations()
  const recommendationCount = receivedRecommendations?.length ?? 0

  const [copied, setCopied] = useState(false)
  const handleShare = useCallback(async () => {
    const shareData = { title: document.title, url: window.location.href }
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [])

  const isLoading = isMemberLoading || isProfileLoading

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="내 프로필" showAction={false} showBack={false} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!memberData || !profileData) {
    return (
      <div className="flex flex-col">
        <TopBar
          variant="default"
          title="내 프로필"
          showAction={false}
          onBack={() => router.back()}
        />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">프로필을 불러올 수 없습니다</p>
        </div>
      </div>
    )
  }

  const member = memberData
  const profile = profileData

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title={member.username ?? '내 프로필'}
        showAction={false}
        showBack={false}
      />

      <ProfileHeader
        name={member.name}
        picture={member.picture ?? undefined}
        city={profile.address?.city}
        headline={profile.headline}
        primaryTrade={profile.primaryTrade}
        experience={profile.experience}
        postCount={postCount}
        coworkerCount={coworkers?.length ?? 0}
        recommendationCount={recommendationCount}
      />

      <div className="flex gap-2 px-4 py-3">
        <Button
          variant="outline"
          size="full"
          className="flex-1"
          onClick={() => router.push('/profile/edit')}
        >
          프로필 수정
        </Button>
        <Button variant="outline" size="full" className="flex-1" onClick={handleShare}>
          {copied ? '복사됨' : '공유하기'}
        </Button>
      </div>

      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'intro' && (
        <IntroSection
          profile={profile}
          credentials={credentialsList}
          isOwner
          receivedRecommendations={receivedRecommendations ?? []}
          sentRecommendations={sentRecommendations ?? []}
        />
      )}
      {activeTab === 'works' && profile.id && <WorksSection authorId={profile.id} />}
      {activeTab === 'works' && !profile.id && (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">작업물을 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  )
}
