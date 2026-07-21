'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import {
  useGetMyProfile,
  useGetMyReceivedRecommendations,
  useGetMySentRecommendations,
  useGetProfile,
  useGetCredentials,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  useCreateCoworkerRequest,
  useCreateDirectChat,
  useGetCoworkers,
  useGetSentCoworkerRequests,
} from '@bconnect/api-client'
import {
  ProfileView,
  type ProfileViewData,
  useUnreadNotificationCount,
  useUnreadChatCount,
} from '@bconnect/features'
import { Button, PlusIcon, SettingsIcon, toast, isApiErrorShape } from '@bconnect/ui'
import { careerShell } from '@/app/(main)/_adapters/careerShell'
import { CoworkerActionButton } from '@/app/(main)/_components/CoworkerActionButton'
import { useShareCurrentUrl } from '@/hooks/useShareCurrentUrl'
import { useProfileImageUpload } from './useProfileImageUpload'
import { useRecommendationActions } from './useRecommendationActions'
import { useWorkActions } from './useWorkActions'

/** 최상위 프로필 라우트(본인·타인) 상단 알림·채팅 아이콘 — 홈 피드와 동등 */
function useTopBarUtility() {
  const chatCount = useUnreadChatCount()
  const notifyCount = useUnreadNotificationCount()
  return {
    chatHref: '/messages',
    chatCount,
    notifyHref: '/notifications',
    notifyCount,
  }
}

/** 본인 프로필 (/profile) — My* 훅 + 수정/공유 어포던스 */
export function OwnerProfileView() {
  const { onHideRecommendation, onDeleteRecommendation } = useRecommendationActions()

  // GET /profiles/me 로 내 프로필 조회 (Profile 이 member·counts 내장)
  const profile = useGetMyProfile()
  // credentials·profileId 용 memberId 는 프로필에 내장된 member 에서 파생
  // TODO: BE required 처리 후 type narrowing 필요. Profile.member.id가 optional emit이라 0 sentinel로 쿼리를 막는 중.
  const myId = profile.data?.member?.id ?? 0
  const enabled = myId > 0
  const { onDeleteWork } = useWorkActions()

  const getShareUrl = useCallback(
    () => (myId > 0 ? `${window.location.origin}/profile/${myId}` : window.location.href),
    [myId]
  )
  const share = useShareCurrentUrl({ getUrl: getShareUrl })

  const credentials = useGetCredentials({ memberId: myId }, { query: { enabled } })
  const received = useGetMyReceivedRecommendations()
  const sent = useGetMySentRecommendations()
  const imageUpload = useProfileImageUpload(myId)

  // TODO: BE required 처리 후 type narrowing 필요. Profile.member/counts가 optional emit이라 ProfileView에서 표시 fallback에 의존 중.
  const data: ProfileViewData = {
    member: profile.data?.member,
    profile: profile.data,
    postCount: profile.data?.postCount,
    coworkerCount: profile.data?.coworkerCount,
    recommendationCount: profile.data?.recommendationCount,
    credentials: credentials.data,
    receivedRecommendations: received.data,
    sentRecommendations: sent.data,
    isLoading: profile.isLoading,
    isError: profile.isError,
  }

  return (
    <ProfileView
      profileId={myId}
      data={data}
      renderShell={careerShell(undefined, {
        left: {
          icon: <PlusIcon size={20} className="text-[#a5a5a5]" />,
          href: '/profile/works/new',
          label: '작업물 생성',
        },
        right: {
          icon: <SettingsIcon className="text-[#a5a5a5]" />,
          href: '/settings',
          label: '설정',
        },
      })}
      fallbackTitle="내 프로필"
      onEditImage={imageUpload.pickAndUpload}
      imageUploading={imageUpload.isUploading}
      statHrefs={{
        works: '?tab=works',
        coworkers: '/profile/coworkers',
        recommendations: '/profile/recommendations',
      }}
      editHrefs={{
        certifications: '/profile/certifications',
        about: '/profile/edit/about',
        recommendations: '/profile/recommendations',
      }}
      workEditHref={(postId) => `/profile/work/${postId}/edit`}
      onDeleteWork={onDeleteWork}
      onHideRecommendation={onHideRecommendation}
      onDeleteRecommendation={onDeleteRecommendation}
      actionSlot={
        <div className="flex items-center gap-2 px-4 py-3">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/profile/edit">프로필 수정</Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={share}>
            공유하기
          </Button>
        </div>
      }
    />
  )
}

/** 타인 프로필 (/profile/[memberId]) — by-id 훅 + 동료추가/메시지 mutation */
export function ViewerProfileView({ memberId }: { memberId: number }) {
  const router = useRouter()
  const utility = useTopBarUtility()
  const enabled = Number.isFinite(memberId) && memberId > 0

  const profile = useGetProfile(memberId, { query: { enabled } })
  const credentials = useGetCredentials({ memberId }, { query: { enabled } })
  const received = useGetReceivedRecommendations({ memberId }, { query: { enabled } })
  const sent = useGetSentRecommendations({ memberId }, { query: { enabled } })

  // ProfileResponse 에 관계 필드가 없어, 내 동료 목록에 타겟이 있는지로 성립된 동료 여부 파생
  const myProfile = useGetMyProfile()
  const myId = myProfile.data?.member?.id ?? 0
  const myCoworkers = useGetCoworkers({ memberId: myId }, { query: { enabled: myId > 0 } })
  const isCoworker = myCoworkers.data?.some((coworker) => coworker.member?.id === memberId) ?? false

  const coworker = useCreateCoworkerRequest({
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
  // 보낸 요청 목록으로 "요청됨" 상태를 새로고침 후에도 유지 (#843).
  // createCoworkerRequest 성공 시 orval 이 이 조회를 무효화 → 재조회로 자동 반영.
  const sentRequests = useGetSentCoworkerRequests()
  const alreadyRequested =
    sentRequests.data?.some((request) => request.member?.id === memberId) ?? false
  const requested = coworker.isSuccess || alreadyRequested
  const chat = useCreateDirectChat({
    mutation: {
      onSuccess: (createdChatId) => router.push(`/messages/${createdChatId}`),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '대화를 시작하지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  // TODO: BE required 처리 후 type narrowing 필요. Profile.member/counts가 optional emit이라 ProfileView에서 표시 fallback에 의존 중.
  const data: ProfileViewData = {
    member: profile.data?.member,
    profile: profile.data,
    postCount: profile.data?.postCount,
    coworkerCount: profile.data?.coworkerCount,
    recommendationCount: profile.data?.recommendationCount,
    credentials: credentials.data,
    receivedRecommendations: received.data,
    sentRecommendations: sent.data,
    isLoading: profile.isLoading,
    isError: profile.isError,
  }

  return (
    <ProfileView
      profileId={memberId}
      data={data}
      renderShell={careerShell(undefined, { utility })}
      statHrefs={{
        works: '?tab=works',
        coworkers: `/profile/${memberId}/coworkers`,
        recommendations: `/profile/${memberId}/recommendations`,
      }}
      actionSlot={
        <div className="flex gap-2 px-4 py-3">
          <CoworkerActionButton
            memberId={memberId}
            isCoworker={isCoworker}
            requested={requested}
            addPending={coworker.isPending}
            onAdd={() => enabled && coworker.mutate({ data: { toId: memberId } })}
          />
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={chat.isPending}
            onClick={() => enabled && chat.mutate({ data: { memberId } })}
          >
            메시지 보내기
          </Button>
        </div>
      }
    />
  )
}
