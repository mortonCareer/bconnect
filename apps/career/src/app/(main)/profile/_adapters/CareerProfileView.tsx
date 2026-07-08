'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useGetMyMember,
  useGetMyReceivedRecommendations,
  useGetMySentRecommendations,
  useGetProfile,
  useGetCredentials,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  useGetMyChats,
  useCreateCoworkerRequest,
  useCreateDirectChat,
} from '@bconnect/api-client'
import { ProfileView, type ProfileViewData, useUnreadNotificationCount } from '@bconnect/features'
import { Button, SettingsIcon, toast, isApiErrorShape } from '@bconnect/ui'
import { careerShell } from '@/app/(main)/_adapters/careerShell'
import { useShareCurrentUrl } from '@/hooks/useShareCurrentUrl'
import { useRecommendationActions } from './useRecommendationActions'
import { useWorkActions } from './useWorkActions'

/** 최상위 프로필 라우트(본인·타인) 상단 알림·채팅 아이콘 — 홈 피드와 동등 */
function useTopBarUtility() {
  const { data: chats } = useGetMyChats()
  // TODO: BE required 처리 후 type narrowing 필요. DirectChat.unreadCount가 optional emit이라 누락 시 badge가 0으로 silent fallback 됨.
  const chatCount = chats?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0
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
  const share = useShareCurrentUrl()
  const utility = useTopBarUtility()
  const { onHideRecommendation, onDeleteRecommendation } = useRecommendationActions()

  // GET /profiles/me 부재 → 내 memberId 로 by-id 프로필 조회 (Profile 이 member·counts 내장)
  const member = useGetMyMember()
  // TODO: BE required 처리 후 type narrowing 필요. Member.id는 프로필 조회 키인데 optional emit이라 0 sentinel로 쿼리를 막는 중.
  const myId = member.data?.id ?? 0
  const enabled = myId > 0
  const { onDeleteWork } = useWorkActions()

  const profile = useGetProfile(myId, { query: { enabled } })
  const credentials = useGetCredentials({ memberId: myId }, { query: { enabled } })
  const received = useGetMyReceivedRecommendations()
  const sent = useGetMySentRecommendations()

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
    isLoading: member.isLoading || profile.isLoading,
    isError: member.isError || profile.isError,
  }

  return (
    <ProfileView
      profileId={myId}
      data={data}
      renderShell={careerShell(undefined, { utility })}
      fallbackTitle="내 프로필"
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
      workEditHref={(postId) => `/profile/edit/work/${postId}`}
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
          <Link
            href="/settings"
            aria-label="설정"
            className="flex size-10 shrink-0 items-center justify-center text-gray-600 transition-opacity hover:opacity-60"
          >
            <SettingsIcon />
          </Link>
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
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={coworker.isPending || coworker.isSuccess}
            onClick={() => enabled && coworker.mutate({ data: { toId: memberId } })}
          >
            {coworker.isSuccess ? '요청됨' : coworker.isPending ? '요청 중...' : '동료 추가'}
          </Button>
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
