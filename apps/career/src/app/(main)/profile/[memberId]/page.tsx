/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9882
 * @figma-state 작업물 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9637
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useGetProfile, useGetCoworkers } from '@morton/api-client'
import { Button, Tab, TopBar } from '@morton/ui'
import { useQueryState } from 'nuqs'
import { useFeedItems } from '@/hooks/useFeedItems'
import { ProfileHeader } from '../_components/ProfileHeader'
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
  const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'intro' })

  // useGetProfile 응답 = ProfileAndMember = { member, profile } (member 도 함께 옴)
  const { data: profileAndMember, isLoading: isProfileLoading } = useGetProfile(memberId, {
    query: { enabled: !isNaN(memberId) },
  })
  const member = profileAndMember?.member
  const profile = profileAndMember?.profile

  const { postCount } = useFeedItems({ authorId: profile?.id })
  const { data: coworkers } = useGetCoworkers(
    { profileId: profile?.id ?? 0 },
    { query: { enabled: !!profile?.id } }
  )
  // TODO: 추천서 API 연동
  const recommendationCount = 0

  const isLoading = isProfileLoading

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

  if (!profile) {
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
        title={member?.username ?? member?.name ?? '프로필'}
        showAction={false}
        onBack={() => router.back()}
      />

      <ProfileHeader
        name={member?.name}
        picture={member?.picture ?? undefined}
        city={profile?.address?.city}
        headline={profile?.headline}
        primaryTrade={profile?.primaryTrade}
        experience={profile?.experience}
        postCount={postCount}
        coworkerCount={coworkers?.length}
        recommendationCount={recommendationCount}
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
