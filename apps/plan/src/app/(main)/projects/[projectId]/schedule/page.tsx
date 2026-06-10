/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1573-14926
 */
import {
  MOCK_DATE_RANGE,
  MOCK_PROJECT,
  MOCK_SCHEDULE_TASKS,
  ScheduleFooter,
  ScheduleGrid,
  ScheduleHeader,
} from './_components'

export default function SchedulePage() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col">
        <ScheduleHeader projectName={MOCK_PROJECT.name} address={MOCK_PROJECT.address} />
        <ScheduleGrid
          tasks={MOCK_SCHEDULE_TASKS}
          startDate={MOCK_DATE_RANGE.startDate}
          endDate={MOCK_DATE_RANGE.endDate}
          today={MOCK_DATE_RANGE.today}
        />
      </div>
      <div className="flex-1" />
      <ScheduleFooter />
    </div>
  )
}
