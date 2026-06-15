'use client'

import {
  useGetProfile,
  useGetCoworkers,
  useGetCredentials,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  useGetFeeds,
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
  const {
    data: profileAndMember,
    isLoading,
    isError,
  } = useGetProfile(profileId, { query: { enabled } })
  const { data: coworkers } = useGetCoworkers({ profileId }, { query: { enabled } })
  const { data: credentials } = useGetCredentials({ profileId }, { query: { enabled } })
  const { data: received } = useGetReceivedRecommendations({ profileId }, { query: { enabled } })
  const { data: sent } = useGetSentRecommendations({ profileId }, { query: { enabled } })
  const { data: feeds } = useGetFeeds({ profileId }, { query: { enabled } })

  const worksParams = new URLSearchParams(searchParams.toString())
  worksParams.set('tab', 'works')

  const member = profileAndMember?.member
  const profile = profileAndMember?.profile

  const data: ProfileViewData = {
    member,
    profile,
    postCount: feeds?.length,
    coworkerCount: coworkers?.length,
    recommendationCount: received?.length,
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
          specialty: TRADE_LABELS[profile.primaryTrade] ?? '',
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
