/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-12630
 */
'use client'

import { useParams } from 'next/navigation'
import { ProfileView } from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export default function ProfilePanelPage() {
  const params = useParams<{ profileId: string }>()
  const profileId = Number(params.profileId)
  const { closeHref, close } = usePanelNav()

  return (
    <aside
      aria-label="기술자 프로필"
      className="flex h-full w-[393px] shrink-0 flex-col border-l border-gray-200 shadow-[-4px_0_40px_0_rgba(0,0,0,0.10)]"
    >
      <ProfileView profileId={profileId} closeHref={closeHref} onClose={close} />
    </aside>
  )
}
