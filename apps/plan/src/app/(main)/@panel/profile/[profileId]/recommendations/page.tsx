/**
 * @figma-pending 추천서 패널 — 시안 미정, 프로필 stats 진입 (#557)
 */
'use client'

import { useParams } from 'next/navigation'
import { useGetReceivedRecommendations, useGetSentRecommendations } from '@bconnect/api-client'
import { RecommendationsView, PanelAside, type RecommendationsViewData } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function RecommendationsPanelPage() {
  const params = useParams<{ profileId: string }>()
  const profileId = Number(params.profileId)
  const { panelHref, closeHref, close } = usePanelNav()

  const enabled = Number.isFinite(profileId) && profileId > 0
  const { data: received, isError: receivedError } = useGetReceivedRecommendations(
    { profileId },
    { query: { enabled } }
  )
  const { data: sent, isError: sentError } = useGetSentRecommendations(
    { profileId },
    { query: { enabled } }
  )

  const data: RecommendationsViewData = { received, sent, isError: receivedError || sentError }

  return (
    <PanelAside label="추천서">
      <RecommendationsView
        data={data}
        backHref={panelHref(`/profile/${profileId}`)}
        closeHref={closeHref}
        onClose={close}
      />
    </PanelAside>
  )
}
