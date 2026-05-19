/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1573-14926
 */
import {
  GanttChart,
  MemberSidebar,
  MOCK_DATE_RANGE,
  MOCK_GANTT_TASKS,
  MOCK_MESSAGE_COUNT,
  MOCK_NOTIFICATION_COUNT,
  MOCK_PROJECT,
  MOCK_PROJECT_MENU,
  MOCK_TASK_ROWS,
  MOCK_USER,
  ScheduleFooter,
  ScheduleHeader,
  TaskTable,
} from './_components'

export default function SchedulePage() {
  return (
    <div
      data-testid="schedule-page"
      className="flex min-h-screen min-w-[1280px] bg-white font-sans"
    >
      <MemberSidebar
        user={MOCK_USER}
        notificationCount={MOCK_NOTIFICATION_COUNT}
        messageCount={MOCK_MESSAGE_COUNT}
        selectedProject={{ id: MOCK_PROJECT.id, name: MOCK_PROJECT.name }}
        projectMenu={MOCK_PROJECT_MENU}
        activeSlug="schedule"
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ScheduleHeader projectName={MOCK_PROJECT.name} address={MOCK_PROJECT.address} />
        <div data-testid="schedule-body" className="flex min-w-0 flex-1 overflow-x-auto">
          <TaskTable tasks={MOCK_TASK_ROWS} />
          <GanttChart
            tasks={MOCK_GANTT_TASKS}
            startDate={MOCK_DATE_RANGE.startDate}
            endDate={MOCK_DATE_RANGE.endDate}
            today={MOCK_DATE_RANGE.today}
          />
        </div>
        <ScheduleFooter />
      </main>
    </div>
  )
}
