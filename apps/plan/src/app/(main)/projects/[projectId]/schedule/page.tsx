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
    <div data-testid="schedule-page" className="flex flex-col gap-[28px]">
      <ScheduleHeader projectName={MOCK_PROJECT.name} address={MOCK_PROJECT.address} />
      <ScheduleGrid
        tasks={MOCK_SCHEDULE_TASKS}
        startDate={MOCK_DATE_RANGE.startDate}
        endDate={MOCK_DATE_RANGE.endDate}
        today={MOCK_DATE_RANGE.today}
      />
      <ScheduleFooter />
    </div>
  )
}
