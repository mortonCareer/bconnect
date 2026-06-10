/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1573-14926
 */
import {
  MOCK_PROJECT,
  MOCK_SCHEDULE_TASKS,
  MOCK_TODAY,
  ScheduleFooter,
  ScheduleGrid,
  ScheduleHeader,
} from './_components'

export default function SchedulePage() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col">
        <ScheduleHeader projectName={MOCK_PROJECT.name} address={MOCK_PROJECT.address} />
        <ScheduleGrid tasks={MOCK_SCHEDULE_TASKS} today={MOCK_TODAY} />
      </div>
      <div className="flex-1" />
      <ScheduleFooter />
    </div>
  )
}
