'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useGetMyMember,
  useGetMyProfile,
  useGetMyReceivedRecommendations,
  useGetMySentRecommendations,
  useGetProfile,
  useGetCoworkers,
  useGetCredentials,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  useGetFeeds,
  useGetMyChats,
  useCreateCoworkerRequest,
  useCreateDirectChat,
} from '@bconnect/api-client'
import { ProfileView, type ProfileViewData, useUnreadNotificationCount } from '@bconnect/features'
import { Button, toast, isApiErrorShape } from '@bconnect/ui'
import { careerShell } from '@/app/(main)/_adapters/careerShell'
import { useRecommendationActions } from './useRecommendationActions'
import { useWorkActions } from './useWorkActions'

/** 최상위 프로필 라우트(본인·타인) 상단 알림·채팅 아이콘 — 홈 피드와 동등 */
function useTopBarUtility() {
  const { data: chats } = useGetMyChats()
  const chatCount = chats?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0
  const notifyCount = useUnreadNotificationCount()
  return {
    chatHref: '/messages',
    chatCount,
    notifyHref: '/notifications',
    notifyCount,
  }
}

/** 현재 URL 공유 — Web Share API → 클립보드 폴백. career 정책이라 패키지 밖(앱)에 둔다. */
function useShareCurrentUrl() {
  const share = useCallback(async () => {
    const shareData = { title: document.title, url: window.location.href }
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(window.location.href)
    toast({ description: '링크가 복사되었어요', variant: 'success' })
  }, [])
  return { share }
}

/** 본인 프로필 (/profile) — My* 훅 + 수정/공유 어포던스 */
export function OwnerProfileView() {
  const { share } = useShareCurrentUrl()
  const utility = useTopBarUtility()
  const { onHideRecommendation, onDeleteRecommendation } = useRecommendationActions()

  const member = useGetMyMember()
  const profile = useGetMyProfile()
  const pid = profile.data?.id ?? 0
  const enabled = pid > 0
  const { onDeleteWork } = useWorkActions(pid)

  const coworkers = useGetCoworkers({ profileId: pid }, { query: { enabled } })
  const credentials = useGetCredentials({ profileId: pid }, { query: { enabled } })
  const feeds = useGetFeeds({ profileId: pid }, { query: { enabled } })
  const received = useGetMyReceivedRecommendations()
  const sent = useGetMySentRecommendations()

  const data: ProfileViewData = {
    member: member.data,
    profile: profile.data,
    postCount: feeds.data?.content.length,
    coworkerCount: coworkers.data?.length,
    recommendationCount: received.data?.length,
    credentials: credentials.data,
    receivedRecommendations: received.data,
    sentRecommendations: sent.data,
    isLoading: member.isLoading || profile.isLoading,
    isError: member.isError || profile.isError,
  }

  return (
    <ProfileView
      profileId={pid}
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
        <div className="flex gap-2 px-4 py-3">
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

  const profileAndMember = useGetProfile(memberId, { query: { enabled } })
  const pid = profileAndMember.data?.profile?.id ?? 0
  const pidEnabled = pid > 0

  const coworkers = useGetCoworkers({ profileId: pid }, { query: { enabled: pidEnabled } })
  const credentials = useGetCredentials({ profileId: pid }, { query: { enabled: pidEnabled } })
  const feeds = useGetFeeds({ profileId: pid }, { query: { enabled: pidEnabled } })
  const received = useGetReceivedRecommendations(
    { profileId: pid },
    { query: { enabled: pidEnabled } }
  )
  const sent = useGetSentRecommendations({ profileId: pid }, { query: { enabled: pidEnabled } })

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
      onSuccess: (created) => router.push(`/messages/${created.id}`),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '대화를 시작하지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  const data: ProfileViewData = {
    member: profileAndMember.data?.member,
    profile: profileAndMember.data?.profile,
    postCount: feeds.data?.content.length,
    coworkerCount: coworkers.data?.length,
    recommendationCount: received.data?.length,
    credentials: credentials.data,
    receivedRecommendations: received.data,
    sentRecommendations: sent.data,
    isLoading: profileAndMember.isLoading,
    isError: profileAndMember.isError,
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
            onClick={() => pid > 0 && coworker.mutate({ data: { toId: pid } })}
          >
            {coworker.isSuccess ? '요청됨' : coworker.isPending ? '요청 중...' : '동료 추가'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={chat.isPending}
            onClick={() => enabled && chat.mutate({ data: { participantId: memberId } })}
          >
            메시지 보내기
          </Button>
        </div>
      }
    />
  )
}
