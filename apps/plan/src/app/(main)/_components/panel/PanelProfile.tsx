'use client'

import {
  useGetProfile,
  useGetCoworkers,
  useGetCredentials,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  useGetFeeds,
} from '@bconnect/api-client'
import { ProfileView, PanelAside, type ProfileViewData } from '@bconnect/features'
import { useSearchParams } from 'next/navigation'
import { usePanelNav } from '@/hooks/usePanelNav'

export function PanelProfile({ profileId }: { profileId: number }) {
  const { panelHref, closeHref, close } = usePanelNav()
  const searchParams = useSearchParams()

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

  const data: ProfileViewData = {
    member: profileAndMember?.member,
    profile: profileAndMember?.profile,
    postCount: feeds?.content.length,
    coworkerCount: coworkers?.length,
    recommendationCount: received?.length,
    credentials,
    receivedRecommendations: received,
    sentRecommendations: sent,
    isLoading,
    isError,
  }

  return (
    <PanelAside label="기술자 프로필">
      <ProfileView
        profileId={profileId}
        data={data}
        closeHref={closeHref}
        onClose={close}
        statHrefs={{
          works: `?${worksParams.toString()}`,
          coworkers: panelHref(`profile/${profileId}/coworkers`),
          recommendations: panelHref(`profile/${profileId}/recommendations`),
        }}
      />
    </PanelAside>
  )
}
