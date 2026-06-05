/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-12630
 */
'use client'

import { useParams } from 'next/navigation'
import { ProfileView, PanelAside } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function ProfilePanelPage() {
  const params = useParams<{ profileId: string }>()
  const profileId = Number(params.profileId)
  const { closeHref, close } = usePanelNav()

  return (
    <PanelAside label="기술자 프로필">
      <ProfileView profileId={profileId} closeHref={closeHref} onClose={close} />
    </PanelAside>
  )
}
