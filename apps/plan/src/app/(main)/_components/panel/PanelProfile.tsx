'use client'

import {
  useGetProfile,
  useGetCredentials,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  TRADE_LABELS,
} from '@bconnect/api-client'
import { ProfileView, PanelAside, type ProfileViewData } from '@bconnect/features'
import { useSearchParams } from 'next/navigation'
import { usePanelNav } from '@/hooks/usePanelNav'
import { useSelectedTask } from '@/hooks/useSelectedTask'
import { OfferProposeButton } from '../offer/OfferProposeButton'
import type { OfferQueueItem } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'

export function PanelProfile({ profileId }: { profileId: number }) {
  const { panelHref, closeHref, close } = usePanelNav()
  const searchParams = useSearchParams()
  const { taskId } = useSelectedTask()

  const enabled = Number.isFinite(profileId) && profileId > 0
  // profileId 세그먼트는 실제 memberId (flip 후 프로필 조회는 memberId 기준). Profile 이 member·counts 내장.
  const { data: profile, isLoading, isError } = useGetProfile(profileId, { query: { enabled } })
  const { data: credentials } = useGetCredentials({ memberId: profileId }, { query: { enabled } })
  const { data: received } = useGetReceivedRecommendations(
    { memberId: profileId },
    { query: { enabled } }
  )
  const { data: sent } = useGetSentRecommendations({ memberId: profileId }, { query: { enabled } })

  const worksParams = new URLSearchParams(searchParams.toString())
  worksParams.set('tab', 'works')

  const member = profile?.member

  // TODO: BE required 처리 후 type narrowing 필요. Profile.member/counts가 optional emit.
  const data: ProfileViewData = {
    member,
    profile,
    postCount: profile?.postCount,
    coworkerCount: profile?.coworkerCount,
    recommendationCount: profile?.recommendationCount,
    credentials,
    receivedRecommendations: received,
    sentRecommendations: sent,
    isLoading,
    isError,
  }

  // 섭외 제안 추가용 candidate — 프로필 로드 후에만. (취소는 큐 멤버십만으로 동작하므로 불필요)
  const offerCandidate: OfferQueueItem | undefined =
    member && profile
      ? {
          profileId,
          name: member.name,
          region: profile.address?.state ?? '',
          level: '',
          specialty: profile.primaryTrade ? (TRADE_LABELS[profile.primaryTrade] ?? '') : '',
          picture: member.picture ?? undefined,
          status: 'waiting',
        }
      : undefined

  return (
    <PanelAside label="기술자 프로필">
      <ProfileView
        profileId={profileId}
        data={data}
        closeHref={closeHref}
        onClose={close}
        actionSlot={
          // 작업 컨텍스트(?task=)가 있으면 항상 노출 — features 는 presentation-only 유지(ADR-0020)
          taskId ? (
            <div className="px-4 pb-2">
              <OfferProposeButton
                taskId={taskId}
                profileId={profileId}
                candidate={offerCandidate}
              />
            </div>
          ) : undefined
        }
        statHrefs={{
          works: `?${worksParams.toString()}`,
          coworkers: panelHref(`profile/${profileId}/coworkers`),
          recommendations: panelHref(`profile/${profileId}/recommendations`),
        }}
      />
    </PanelAside>
  )
}
