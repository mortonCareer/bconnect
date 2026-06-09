'use client'

import type { ScheduleGridProps, ScheduleTask, TaskStatus } from './types'

const COL_CATEGORY = 120
const COL_STATUS = 100
const COL_ASSIGNEE = 220
const LEFT_WIDTH = COL_CATEGORY + COL_STATUS + COL_ASSIGNEE

const DAY_WIDTH = 44
const RIGHT_PAD_WIDTH = 88
const ROW_HEIGHT = 52
const HEADER_HEIGHT = 40
const BAR_HEIGHT = 36
const BAR_TOP = 7.5

const ISO_DAY_MS = 86_400_000

const BAR_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  completed: { bg: '#b0b0b0', text: '#5a5a5a' },
  in_progress: { bg: '#284dbc', text: '#ffffff' },
  recruited: { bg: '#569365', text: '#ffffff' },
  recruiting: { bg: '#ffbf70', text: '#2d2d2d' },
  not_started: { bg: '#d0d0d0', text: '#2d2d2d' },
}

const PILL_STYLES: Record<TaskStatus, string> = {
  completed: 'bg-[#f0f0f0] border border-[#d0d0d0] text-[#3d3d3d]',
  in_progress: 'bg-[#386dff] text-white',
  recruited: 'bg-[#eef4ff] border border-[#c0d0ff] text-[#386dff]',
  recruiting: 'bg-[#fff3e0] border border-[#ffe0b2] text-[#e6780a]',
  not_started: 'bg-white border border-[#d0d0d0] text-[#a5a5a5]',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: '완료됨',
  in_progress: '진행 중',
  recruited: '섭외됨',
  recruiting: '섭외 중',
  not_started: '시작 전',
}

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

function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`text-m-12 inline-flex h-[26px] items-center justify-center whitespace-nowrap rounded-[4px] px-[9px] ${PILL_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

/** 좌측 고정 컬럼 (공종 / 상태 / 기술자). 행 단위로 gantt 트랙과 같은 flex row 안에 들어가 정렬을 보장한다. */
function LeftCells({
  task,
  onFindTechnician,
}: {
  task: ScheduleTask
  onFindTechnician: () => void
}) {
  return (
    <div className="sticky left-0 z-20 flex shrink-0 bg-white" style={{ width: LEFT_WIDTH }}>
      <div
        className="flex items-center justify-center border-r border-solid border-[#f5f5f5]"
        style={{ width: COL_CATEGORY }}
      >
        <p className="text-r-14 text-[#3d3d3d]">{task.category}</p>
      </div>
      <div
        className="flex items-center justify-center border-r border-solid border-[#f5f5f5]"
        style={{ width: COL_STATUS }}
      >
        <StatusPill status={task.status} />
      </div>
      <div
        className="flex items-center border-r border-solid border-gray-300 px-[10px]"
        style={{ width: COL_ASSIGNEE }}
      >
        {task.assignee ? (
          <div data-testid="assignee" className="flex w-full items-center gap-2">
            <div aria-hidden="true" className="size-[34px] shrink-0 rounded-full bg-[#d9d9d9]" />
            <div className="flex min-w-0 flex-col">
              <p className="text-sb-14 text-gray-900">{task.assignee.name}</p>
              <p className="text-r-12 text-gray-500">
                {task.assignee.region} | {task.assignee.level} | {task.assignee.specialty}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onFindTechnician}
            className="text-m-14 h-[33.5px] w-full rounded-[6px] border border-solid border-[#c0d0ff] text-[#386dff] hover:bg-[#eef4ff]"
          >
            + 기술자 탐색
          </button>
        )}
      </div>
    </div>
  )
}

/** gantt 타임라인 트랙 (일자 배경 셀 + 작업 바). LeftCells 와 같은 행 높이를 공유한다. */
function GanttTrack({
  task,
  dates,
  startDate,
  todayIso,
}: {
  task: ScheduleTask
  dates: Date[]
  startDate: string
  todayIso: string | undefined
}) {
  const offsetDays = daysBetween(startDate, task.startDate)
  const spanDays = daysBetween(task.startDate, task.endDate) + 1
  const left = offsetDays * DAY_WIDTH + 2
  const width = spanDays * DAY_WIDTH - 4
  const style = BAR_STYLES[task.status]
  const label = STATUS_LABELS[task.status]

  return (
    <div
      className="relative shrink-0"
      style={{ width: dates.length * DAY_WIDTH + RIGHT_PAD_WIDTH, height: ROW_HEIGHT }}
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
      <div
        className="group absolute flex items-center rounded pl-2.5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        style={{ left, top: BAR_TOP, width, height: BAR_HEIGHT, backgroundColor: style.bg }}
        tabIndex={0}
        aria-label={`${task.ganttName} · ${task.startDate} ~ ${task.endDate} · ${label}`}
      >
        <p
          className="truncate text-[12px] font-semibold leading-[18px]"
          style={{ color: style.text }}
        >
          {task.ganttName}
        </p>
        <div
          className="pointer-events-none invisible absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
          role="tooltip"
        >
          <span className="font-semibold">{task.ganttName}</span>
          <span className="mx-1 text-neutral-400">·</span>
          <span>
            {task.startDate} ~ {task.endDate}
          </span>
          <span className="mx-1 text-neutral-400">·</span>
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}

export function ScheduleGrid({ tasks, startDate, endDate, today }: ScheduleGridProps) {
  const dates = buildDates(startDate, endDate)
  const monthGroups = groupByMonth(dates)
  const ganttWidth = dates.length * DAY_WIDTH + RIGHT_PAD_WIDTH

  function handleCreateTask() {
    alert('준비 중')
  }

  function handleFindTechnician() {
    alert('준비 중')
  }

  return (
    <div
      role="grid"
      aria-label="공정표"
      data-testid="schedule-grid"
      className="w-full overflow-x-auto bg-white font-sans [scrollbar-color:#d0d0d0_transparent] [scrollbar-width:thin]"
    >
      <div className="flex flex-col" style={{ width: LEFT_WIDTH + ganttWidth }}>
        {/* 헤더 1행: 좌측 빈 spacer + 월 헤더 */}
        <div className="flex" style={{ height: HEADER_HEIGHT }} role="row">
          <div
            className="sticky left-0 z-20 shrink-0 border-b border-r border-solid border-[#e5e5e5] bg-white"
            style={{ width: LEFT_WIDTH }}
          />
          <div
            className="flex shrink-0 border-b border-solid border-[#e5e5e5]"
            style={{ width: ganttWidth }}
          >
            {monthGroups.map((g, i) => (
              <div
                key={`${g.month}-${i}`}
                className="flex items-center justify-center"
                style={{ width: g.count * DAY_WIDTH }}
              >
                <p className="text-[13px] font-semibold leading-[19.5px] text-[#3d3d3d]">
                  {g.month}월
                </p>
              </div>
            ))}
            <div style={{ width: RIGHT_PAD_WIDTH }} />
          </div>
        </div>

        {/* 헤더 2행: 공종 / 상태 / 기술자 + 일자 헤더 */}
        <div className="flex" style={{ height: HEADER_HEIGHT }} role="row">
          <div
            className="sticky left-0 z-20 flex shrink-0 bg-[#fafafa]"
            style={{ width: LEFT_WIDTH }}
          >
            <div
              className="flex items-center justify-center border-b border-r border-solid border-[#e5e5e5]"
              style={{ width: COL_CATEGORY }}
            >
              <p className="text-sb-14 text-[#3d3d3d]">공종</p>
            </div>
            <div
              className="flex items-center justify-center border-b border-r border-solid border-[#e5e5e5]"
              style={{ width: COL_STATUS }}
            >
              <p className="text-sb-14 text-[#3d3d3d]">상태</p>
            </div>
            <div
              className="flex items-center justify-center border-b border-r border-solid border-gray-300"
              style={{ width: COL_ASSIGNEE }}
            >
              <p className="text-sb-14 text-[#3d3d3d]">기술자</p>
            </div>
          </div>
          <div
            className="flex shrink-0 border-b border-solid border-[#e5e5e5] bg-[#fafafa]"
            style={{ width: ganttWidth }}
          >
            {dates.map((d) => {
              const iso = toIsoDate(d)
              const isToday = iso === today
              return (
                <div
                  key={iso}
                  className="flex items-center justify-center border-r border-solid border-[#f0f0f0]"
                  style={{ width: DAY_WIDTH, backgroundColor: isToday ? '#fff0f0' : undefined }}
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
        </div>

        {/* 본문 행 (공종/상태/기술자 + gantt 바) — 좌우 같은 flex row 로 정렬 보장 */}
        <div role="rowgroup">
          {tasks.map((task) => (
            <div
              key={task.id}
              role="row"
              data-testid={`task-row-${task.id}`}
              className="flex border-b border-solid border-[#f5f5f5] has-[:focus-visible]:z-50 has-[:hover]:z-50"
              style={{ height: ROW_HEIGHT }}
            >
              <LeftCells task={task} onFindTechnician={handleFindTechnician} />
              <GanttTrack task={task} dates={dates} startDate={startDate} todayIso={today} />
            </div>
          ))}

          {/* 작업 생성 행 */}
          <div className="flex" role="row" style={{ height: ROW_HEIGHT }}>
            <div
              className="sticky left-0 z-20 flex shrink-0 bg-white"
              style={{ width: LEFT_WIDTH }}
            >
              <div
                className="flex items-center justify-center border-r border-solid border-[#f5f5f5] p-2"
                style={{ width: COL_CATEGORY }}
              >
                <button
                  type="button"
                  onClick={handleCreateTask}
                  className="text-m-14 h-[33.5px] w-[103px] rounded-[6px] border border-dashed border-[#c0d0ff] text-[#386dff] hover:bg-[#eef4ff]"
                >
                  + 작업 생성
                </button>
              </div>
              <div
                className="border-r border-solid border-[#f5f5f5]"
                style={{ width: COL_STATUS }}
              />
              <div
                className="border-r border-solid border-gray-300"
                style={{ width: COL_ASSIGNEE }}
              />
            </div>
            <div className="shrink-0" style={{ width: ganttWidth }} />
          </div>
        </div>
      </div>
    </div>
  )
}
