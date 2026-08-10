/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3765-8699
 */
import type { Metadata } from 'next'

import { ScheduleContent } from './_components'

export const metadata: Metadata = { title: '공정표' }

export default async function SchedulePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params

  return <ScheduleContent projectId={projectId} />
}
