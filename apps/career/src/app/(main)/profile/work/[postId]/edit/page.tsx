/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3417-12441
 */
'use client'

import { useParams } from 'next/navigation'
import { WorkForm } from '@/app/(main)/profile/work/_components/WorkForm'

export default function WorkEditPage() {
  const params = useParams<{ postId: string }>()
  return <WorkForm postId={Number(params.postId)} />
}
