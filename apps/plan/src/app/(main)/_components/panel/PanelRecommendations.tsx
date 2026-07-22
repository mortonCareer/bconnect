'use client'

import { useGetReceivedRecommendations, useGetSentRecommendations } from '@bconnect/api-client'
import { RecommendationsView, PanelAside, type RecommendationsViewData } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export function PanelRecommendations({ profileId }: { profileId: number }) {
  const { panelHref, closeHref, close } = usePanelNav()

  const enabled = Number.isFinite(profileId) && profileId > 0
  const { data: received, isError: receivedError } = useGetReceivedRecommendations(
    { memberId: profileId },
    { query: { enabled } }
  )
  const { data: sent, isError: sentError } = useGetSentRecommendations(
    { memberId: profileId },
    { query: { enabled } }
  )

  const data: RecommendationsViewData = { received, sent, isError: receivedError || sentError }

  return (
    <PanelAside label="추천서">
      <RecommendationsView
        data={data}
        backHref={panelHref(`profile/${profileId}`)}
        closeHref={closeHref}
        onClose={close}
      />
    </PanelAside>
  )
}
