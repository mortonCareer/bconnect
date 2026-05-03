/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1238-5348
 * @figma-state 작업물 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1238-6027
 */
'use client'

import { useRouter } from 'next/navigation'
import {
  useGetMyMember,
  useGetMyProfile,
  useGetCoworkers,
  useGetCredentials,
} from '@morton/api-client'
import { Button, Tab, TopBar } from '@morton/ui'
import type { Credential } from '@morton/api-client'
import { useQueryState } from 'nuqs'
import { useFeedItems } from '@/hooks/useFeedItems'
import { MOCK_CREDENTIALS } from './certifications/constants'
import { ProfileHeader } from './_components/ProfileHeader'
import { IntroSection } from './_components/IntroSection'
import { WorksSection } from './_components/WorksSection'

// TODO: API 연동 후 제거 — 발표용 mock 데이터
const MOCK_MEMBER = { name: '이송목', username: 'finepine_official', picture: undefined }
const MOCK_PROFILE = {
  id: 1,
  primaryTrade: 'TILING' as const,
  trades: ['TILING' as const],
  experience: 3,
  headline: '안녕하세요, 타일 준기공 이송목입니다. 믿고 맡겨주신다면 성실히 임하겠습니다.',
  about:
    '안녕하세요, 도배 준기공 이송목입니다. 수입타일을 전문으로 시공하고 있습니다.\n\n바닥, 벽면, 욕실 타일 모두 작업 가능하며, 줄눈 정밀도와 평탄 마감에 자신 있습니다.\n\n시공문의\n010-8335-8632\nlsm3645@g.skku.edu\n\n#타일 #수입타일 #욕실타일 #바닥타일',
  address: { city: '경기도' },
}

const TAB_ITEMS = [
  { key: 'intro', label: '소개' },
  { key: 'works', label: '작업물' },
]

export default function MyProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'intro' })

  const { data: memberData, isLoading: isMemberLoading } = useGetMyMember({
    query: { retry: false },
  })
  const { data: profileData, isLoading: isProfileLoading } = useGetMyProfile({
    query: { retry: false },
  })

  // API 실패 시 mock 폴백
  const member = memberData ?? MOCK_MEMBER
  const profile = profileData ?? MOCK_PROFILE

  const { postCount } = useFeedItems({ authorId: profileData?.id })
  const { data: coworkers } = useGetCoworkers(
    { profileId: profileData?.id ?? 0 },
    { query: { enabled: !!profileData?.id } }
  )
  const { data: credentialsData } = useGetCredentials(
    { profileId: profileData?.id ?? 0 },
    { query: { enabled: !!profileData?.id, retry: false } }
  )
  const credentialsList: Credential[] = credentialsData ?? (MOCK_CREDENTIALS as Credential[])
  // TODO: 추천서 API 연동
  const recommendationCount = 3

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
        title={member.username ?? '내 프로필'}
        showAction={false}
        onBack={() => router.back()}
      />

      <ProfileHeader
        name={member.name}
        picture={member.picture}
        city={profile.address?.city}
        headline={profile.headline}
        primaryTrade={profile.primaryTrade}
        experience={profile.experience}
        postCount={postCount}
        coworkerCount={coworkers?.length ?? 13}
        recommendationCount={recommendationCount}
      />

      <div className="px-4 py-3">
        <Button variant="outline" size="full" onClick={() => router.push('/profile/edit')}>
          프로필 수정
        </Button>
      </div>

      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'intro' && <IntroSection profile={profile} credentials={credentialsList} />}
      {activeTab === 'works' && profile.id && <WorksSection authorId={profile.id} />}
      {activeTab === 'works' && !profile.id && (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">작업물을 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  )
}
