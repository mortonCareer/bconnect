/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-12630
 */
'use client'

import { useParams } from 'next/navigation'
import {
  useGetProfile,
  useGetCoworkers,
  useGetCredentials,
  useGetReceivedRecommendations,
  useGetSentRecommendations,
  useGetFeeds,
} from '@bconnect/api-client'
import { ProfileView, PanelAside, type ProfileViewData } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function ProfilePanelPage() {
  const params = useParams<{ profileId: string }>()
  const profileId = Number(params.profileId)
  const { closeHref, close } = usePanelNav()

  const enabled = Number.isFinite(profileId) && profileId > 0
  const {
    data: profileAndMember,
    isLoading,
    isError,
  } = useGetProfile(profileId, {
    query: { enabled },
  })
  const { data: coworkers } = useGetCoworkers({ profileId }, { query: { enabled } })
  const { data: credentials } = useGetCredentials({ profileId }, { query: { enabled } })
  const { data: received } = useGetReceivedRecommendations({ profileId }, { query: { enabled } })
  const { data: sent } = useGetSentRecommendations({ profileId }, { query: { enabled } })
  const { data: feeds } = useGetFeeds({ profileId }, { query: { enabled } })

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
      <ProfileView profileId={profileId} data={data} closeHref={closeHref} onClose={close} />
    </PanelAside>
  )
}
