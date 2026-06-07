/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9882
 * @figma-state 작업물 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9637
 */
'use client'

import { useParams } from 'next/navigation'
import { ViewerProfileView } from '../_adapters/CareerProfileView'

export default function MemberProfilePage() {
  const params = useParams<{ memberId: string }>()
  return <ViewerProfileView memberId={Number(params.memberId)} />
}
