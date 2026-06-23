/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1573-14926
 */
import {
  getMockProject,
  MOCK_PROJECT,
  MOCK_TODAY,
  ScheduleFooter,
  ScheduleGrid,
  ScheduleHeader,
} from './_components'

export default async function SchedulePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const project = getMockProject(projectId) ?? MOCK_PROJECT

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col">
        <ScheduleHeader projectName={project.name} address={project.address} />
        <ScheduleGrid projectId={projectId} today={MOCK_TODAY} />
      </div>
      <div className="flex-1" />
      <ScheduleFooter />
    </div>
  )
}
