/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1573-14926
 */
import { ScheduleFooter, ScheduleGrid, ScheduleHeader } from './_components'

export default async function SchedulePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col">
        <ScheduleHeader projectId={projectId} />
        <ScheduleGrid projectId={projectId} />
      </div>
      <div className="flex-1" />
      <ScheduleFooter />
    </div>
  )
}
