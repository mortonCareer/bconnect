/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9882
 * @figma-state 작업물 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9637
 */
'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  useGetProfile,
  useGetCoworkers,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  useCreateCoworkerRequest,
  useCreateDirectChat,
} from '@bconnect/api-client'
import { Button, Tab, TopBar, toast, isApiErrorShape } from '@bconnect/ui'
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
  const { data: receivedRecommendations } = useGetReceivedRecommendations(
    { profileId: profile?.id ?? 0 },
    { query: { enabled: !!profile?.id } }
  )
  const { data: sentRecommendations } = useGetSentRecommendations(
    { profileId: profile?.id ?? 0 },
    { query: { enabled: !!profile?.id } }
  )
  const recommendationCount = receivedRecommendations?.length ?? 0

  const {
    mutate: createCoworkerRequest,
    isPending: isRequesting,
    isSuccess: isRequested,
  } = useCreateCoworkerRequest({
    mutation: {
      onSuccess: () => toast({ description: '동료 요청을 보냈어요', variant: 'success' }),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '동료 요청에 실패했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })
  const handleAddCoworker = () => {
    if (!profile?.id) return
    createCoworkerRequest({ data: { toId: profile.id } })
  }

  const { mutate: createDirectChat, isPending: isStartingChat } = useCreateDirectChat({
    mutation: {
      onSuccess: (chat) => router.push(`/messages/${chat.id}`),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '대화를 시작하지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })
  const handleSendMessage = () => {
    if (!isNaN(memberId)) createDirectChat({ data: { participantId: memberId } })
  }

  const isLoading = isProfileLoading

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="프로필" showAction={false} onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="프로필" showAction={false} onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">프로필을 불러올 수 없습니다</p>
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

      <div className="flex gap-2 px-4 py-3">
        <Button
          variant="outline"
          size="full"
          className="flex-1"
          onClick={handleAddCoworker}
          disabled={isRequesting || isRequested}
        >
          {isRequested ? '요청됨' : isRequesting ? '요청 중...' : '동료 추가'}
        </Button>
        <Button
          variant="outline"
          size="full"
          className="flex-1"
          onClick={handleSendMessage}
          disabled={isStartingChat}
        >
          메시지 보내기
        </Button>
      </div>

      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'intro' && profile && (
        <IntroSection
          profile={profile}
          isOwner={false}
          receivedRecommendations={receivedRecommendations ?? []}
          sentRecommendations={sentRecommendations ?? []}
        />
      )}
      {activeTab === 'intro' && !profile && (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">프로필 정보가 없습니다</p>
        </div>
      )}
      {activeTab === 'works' && profile?.id && <WorksSection authorId={profile.id} />}
      {activeTab === 'works' && !profile?.id && (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">작업물을 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  )
}
