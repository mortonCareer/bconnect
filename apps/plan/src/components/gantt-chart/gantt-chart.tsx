import type { GanttChartProps, GanttTask, TaskStatus } from './types'

const DAY_WIDTH = 44
const RIGHT_PAD_WIDTH = 88
const ROW_HEIGHT = 52
const HEADER_HEIGHT = 40
const BAR_HEIGHT = 36
const BAR_TOP = 7.5

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  completed: { bg: '#b0b0b0', text: '#5a5a5a' },
  in_progress: { bg: '#284dbc', text: '#ffffff' },
  recruited: { bg: '#569365', text: '#ffffff' },
  recruiting: { bg: '#ffbf70', text: '#2d2d2d' },
  not_started: { bg: '#d0d0d0', text: '#2d2d2d' },
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: '완료됨',
  in_progress: '진행 중',
  recruited: '섭외됨',
  recruiting: '섭외 중',
  not_started: '시작 전',
}

const ISO_DAY_MS = 86_400_000

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / ISO_DAY_MS)
}

function buildDates(start: string, end: string): Date[] {
  const out: Date[] = []
  const cursor = new Date(start)
  const last = new Date(end)
  while (cursor.getTime() <= last.getTime()) {
    out.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

function groupByMonth(dates: Date[]): { month: number; count: number }[] {
  const groups: { month: number; count: number }[] = []
  for (const d of dates) {
    const m = d.getMonth() + 1
    const last = groups[groups.length - 1]
    if (last && last.month === m) {
      last.count += 1
    } else {
      groups.push({ month: m, count: 1 })
    }
  }
  return groups
}

function MonthHeader({ groups }: { groups: { month: number; count: number }[] }) {
  return (
    <div
      className="flex border-b border-solid border-[#e5e5e5]"
      style={{ height: HEADER_HEIGHT - 1 }}
    >
      {groups.map((g, i) => (
        <div
          key={`${g.month}-${i}`}
          className="flex items-center justify-center"
          style={{ width: g.count * DAY_WIDTH }}
        >
          <p className="text-[13px] font-semibold leading-[19.5px] text-[#3d3d3d]">{g.month}월</p>
        </div>
      ))}
      <div style={{ width: RIGHT_PAD_WIDTH }} />
    </div>
  )
}

function DayHeader({ dates, todayIso }: { dates: Date[]; todayIso: string | undefined }) {
  return (
    <div
      className="flex border-b border-solid border-[#e5e5e5] bg-[#fafafa]"
      style={{ height: HEADER_HEIGHT - 1 }}
    >
      {dates.map((d) => {
        const iso = toIsoDate(d)
        const isToday = iso === todayIso
        return (
          <div
            key={iso}
            className="flex items-center justify-center border-r border-solid border-[#f0f0f0]"
            style={{
              width: DAY_WIDTH,
              backgroundColor: isToday ? '#fff0f0' : undefined,
            }}
          >
            <p
              className="text-[13px] leading-[19.5px]"
              style={{
                color: isToday ? '#e03d3d' : '#3d3d3d',
                fontWeight: isToday ? 700 : 400,
              }}
            >
              {d.getDate()}
            </p>
          </div>
        )
      })}
      <div style={{ width: RIGHT_PAD_WIDTH }} />
    </div>
  )
}

function TaskBar({ task, startDate }: { task: GanttTask; startDate: string }) {
  const offsetDays = daysBetween(startDate, task.startDate)
  const spanDays = daysBetween(task.startDate, task.endDate) + 1
  const left = offsetDays * DAY_WIDTH + 2
  const width = spanDays * DAY_WIDTH - 4
  const style = STATUS_STYLES[task.status]
  const label = STATUS_LABELS[task.status]

  return (
    <div
      className="group absolute flex items-center rounded pl-2.5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      style={{
        left,
        top: BAR_TOP,
        width,
        height: BAR_HEIGHT,
        backgroundColor: style.bg,
      }}
      tabIndex={0}
      aria-label={`${task.name} · ${task.startDate} ~ ${task.endDate} · ${label}`}
    >
      <p
        className="truncate text-[12px] font-semibold leading-[18px]"
        style={{ color: style.text }}
      >
        {task.name}
      </p>
      <div
        className="pointer-events-none invisible absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
        role="tooltip"
      >
        <span className="font-semibold">{task.name}</span>
        <span className="mx-1 text-neutral-400">·</span>
        <span>
          {task.startDate} ~ {task.endDate}
        </span>
        <span className="mx-1 text-neutral-400">·</span>
        <span>{label}</span>
      </div>
    </div>
  )
}

function TaskRow({
  task,
  dates,
  startDate,
  todayIso,
}: {
  task: GanttTask
  dates: Date[]
  startDate: string
  todayIso: string | undefined
}) {
  return (
    <div
      className="relative border-b border-solid border-[#f5f5f5] has-[:focus-visible]:z-50 has-[:hover]:z-50"
      style={{ height: ROW_HEIGHT }}
      role="row"
    >
      {dates.map((d, i) => {
        const iso = toIsoDate(d)
        return (
          <div
            key={iso}
            className="absolute top-0 border-r border-solid border-[#f5f5f5]"
            style={{
              left: i * DAY_WIDTH,
              width: DAY_WIDTH,
              height: ROW_HEIGHT - 1,
              backgroundColor: iso === todayIso ? '#fff8f8' : undefined,
            }}
            role="gridcell"
          />
        )
      })}
      <TaskBar task={task} startDate={startDate} />
    </div>
  )
}

export function GanttChart({ tasks, startDate, endDate, today }: GanttChartProps) {
  const dates = buildDates(startDate, endDate)
  const monthGroups = groupByMonth(dates)
  const totalGridWidth = dates.length * DAY_WIDTH + RIGHT_PAD_WIDTH

  return (
    <div
      className="relative flex flex-col bg-white font-sans"
      style={{ width: totalGridWidth }}
      role="grid"
      aria-label="공정표 간트 차트"
      data-testid="gantt-chart"
    >
      <MonthHeader groups={monthGroups} />
      <DayHeader dates={dates} todayIso={today} />
      <div className="flex flex-col" role="rowgroup">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} dates={dates} startDate={startDate} todayIso={today} />
        ))}
      </div>
    </div>
  )
}
