/**
 * @figma-pending 동료 패널 — 시안 미정, 프로필 stats 진입 (#557)
 */
'use client'

import { useParams } from 'next/navigation'
import { useGetCoworkers } from '@bconnect/api-client'
import { CoworkersView, PanelAside, type CoworkersViewData } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function CoworkersPanelPage() {
  const params = useParams<{ profileId: string }>()
  const profileId = Number(params.profileId)
  const { panelHref, closeHref, close } = usePanelNav()

  const enabled = Number.isFinite(profileId) && profileId > 0
  const {
    data: coworkers,
    isLoading,
    isError,
  } = useGetCoworkers({ profileId }, { query: { enabled } })

  const data: CoworkersViewData = { coworkers, isLoading, isError }

  return (
    <PanelAside label="동료">
      <CoworkersView
        data={data}
        backHref={panelHref(`/profile/${profileId}`)}
        closeHref={closeHref}
        onClose={close}
        coworkerHref={(id) => panelHref(`/profile/${id}`)}
      />
    </PanelAside>
  )
}
