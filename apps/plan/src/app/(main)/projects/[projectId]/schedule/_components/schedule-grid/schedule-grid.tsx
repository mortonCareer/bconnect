'use client'

import { usePanelNav } from '@/hooks/usePanelNav'
import Link from 'next/link'
import type { ScheduleGridProps, ScheduleTask, TaskStatus } from './types'

const COL_CATEGORY = 120
const COL_STATUS = 100
const COL_ASSIGNEE = 220

const DAY_WIDTH = 44
const RIGHT_PAD_WIDTH = 88
const ROW_HEIGHT = 52
const HEADER_HEIGHT = 40
const BAR_HEIGHT = 36
const BAR_TOP = 7.5

const ISO_DAY_MS = 86_400_000

// 좌측 고정 컬럼의 sticky left 오프셋 (공종 / 상태 / 기술자)
const STICKY_LEFT = [0, COL_CATEGORY, COL_CATEGORY + COL_STATUS]

const BAR_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  completed: { bg: '#b0b0b0', text: '#5a5a5a' },
  in_progress: { bg: '#284dbc', text: '#ffffff' },
  recruited: { bg: '#569365', text: '#ffffff' },
  recruiting: { bg: '#ffbf70', text: '#2d2d2d' },
  not_started: { bg: '#d0d0d0', text: '#2d2d2d' },
}

const PILL_STYLES: Record<TaskStatus, string> = {
  completed: 'bg-[#f0f0f0] border border-[#d0d0d0] text-[#3d3d3d]',
  in_progress: 'bg-primary text-white',
  recruited: 'bg-primary-50 border border-[#c0d0ff] text-primary',
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

/** gantt 타임라인 셀 내용 — 일자 배경 + 작업 바. relative td 안에 absolute 로 배치된다. */
function GanttBars({
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
    <>
      {dates.map((d, i) => {
        const iso = toIsoDate(d)
        return (
          <div
            key={iso}
            aria-hidden="true"
            className="absolute top-0 border-r border-solid border-[#f5f5f5]"
            style={{
              left: i * DAY_WIDTH,
              width: DAY_WIDTH,
              height: ROW_HEIGHT,
              backgroundColor: iso === todayIso ? '#fff8f8' : undefined,
            }}
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
    </>
  )
}

export function ScheduleGrid({ tasks, startDate, endDate, today }: ScheduleGridProps) {
  const { panelHref } = usePanelNav()
  const dates = buildDates(startDate, endDate)
  const monthGroups = groupByMonth(dates)
  const ganttWidth = dates.length * DAY_WIDTH + RIGHT_PAD_WIDTH

  function handleCreateTask() {
    alert('준비 중')
  }

  function handleFindTechnician() {
    alert('준비 중')
  }

  // 좌측 고정 컬럼 공통 className (sticky + 배경). 헤더는 bg override.
  const stickyCell = 'sticky z-20 bg-white'

  return (
    <div
      data-testid="schedule-grid"
      className="w-full overflow-x-auto bg-white font-sans [scrollbar-color:#d0d0d0_transparent] [scrollbar-width:thin]"
    >
      <table
        aria-label="공정표"
        className="text-left"
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          tableLayout: 'fixed',
          width: COL_CATEGORY + COL_STATUS + COL_ASSIGNEE + ganttWidth,
        }}
      >
        <colgroup>
          <col style={{ width: COL_CATEGORY }} />
          <col style={{ width: COL_STATUS }} />
          <col style={{ width: COL_ASSIGNEE }} />
          <col style={{ width: ganttWidth }} />
        </colgroup>

        <thead>
          {/* 월 헤더 */}
          <tr style={{ height: HEADER_HEIGHT }}>
            <th
              colSpan={3}
              className={`${stickyCell} border-b border-r border-solid border-[#e5e5e5]`}
              style={{ left: 0 }}
            />
            <th className="border-b border-solid border-[#e5e5e5] p-0 font-normal">
              <div className="flex" style={{ width: ganttWidth, height: HEADER_HEIGHT }}>
                {monthGroups.map((g, i) => (
                  <div
                    key={`${g.month}-${i}`}
                    className="flex items-center justify-center"
                    style={{ width: g.count * DAY_WIDTH }}
                  >
                    <span className="text-[13px] font-semibold leading-[19.5px] text-[#3d3d3d]">
                      {g.month}월
                    </span>
                  </div>
                ))}
                <div style={{ width: RIGHT_PAD_WIDTH }} />
              </div>
            </th>
          </tr>

          {/* 공종 / 상태 / 기술자 + 일자 헤더 */}
          <tr style={{ height: HEADER_HEIGHT }}>
            {['공종', '상태', '기술자'].map((label, i) => (
              <th
                key={label}
                scope="col"
                className={`${stickyCell} border-b border-r border-solid text-sb-14 text-[#3d3d3d] ${i === 2 ? 'border-gray-300' : 'border-[#e5e5e5]'}`}
                style={{ left: STICKY_LEFT[i], backgroundColor: '#fafafa' }}
              >
                <span className="block text-center">{label}</span>
              </th>
            ))}
            <th
              className="border-b border-solid border-[#e5e5e5] p-0 font-normal"
              style={{ backgroundColor: '#fafafa' }}
            >
              <div className="flex" style={{ width: ganttWidth, height: HEADER_HEIGHT }}>
                {dates.map((d) => {
                  const iso = toIsoDate(d)
                  const isToday = iso === today
                  return (
                    <div
                      key={iso}
                      className="flex items-center justify-center border-r border-solid border-[#f0f0f0]"
                      style={{ width: DAY_WIDTH, backgroundColor: isToday ? '#fff0f0' : undefined }}
                    >
                      <span
                        className="text-[13px] leading-[19.5px]"
                        style={{
                          color: isToday ? '#e03d3d' : '#3d3d3d',
                          fontWeight: isToday ? 700 : 400,
                        }}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  )
                })}
                <div style={{ width: RIGHT_PAD_WIDTH }} />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} data-testid={`task-row-${task.id}`} style={{ height: ROW_HEIGHT }}>
              <td
                className={`${stickyCell} border-b border-r border-solid border-[#f5f5f5] text-center align-middle text-r-14 text-[#3d3d3d]`}
                style={{ left: STICKY_LEFT[0] }}
              >
                {task.category}
              </td>
              <td
                className={`${stickyCell} border-b border-r border-solid border-[#f5f5f5] text-center align-middle`}
                style={{ left: STICKY_LEFT[1] }}
              >
                <StatusPill status={task.status} />
              </td>
              <td
                className={`${stickyCell} border-b border-r border-solid border-gray-300 p-2 align-middle`}
                style={{ left: STICKY_LEFT[2] }}
              >
                {task.assignee ? (
                  <Link
                    href={panelHref(`profile/${task.assignee.profileId}`)}
                    scroll={false}
                    data-testid="assignee"
                    className="flex w-full items-center gap-2 rounded-[8px] hover:bg-gray-100"
                  >
                    <span
                      aria-hidden="true"
                      className="size-[34px] shrink-0 rounded-full bg-[#d9d9d9]"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sb-14 text-gray-900">{task.assignee.name}</span>
                      <span className="text-r-12 text-gray-500">
                        {task.assignee.region} | {task.assignee.level} | {task.assignee.specialty}
                      </span>
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleFindTechnician}
                    className="text-m-14 h-[33.5px] w-full rounded-[6px] border border-solid border-[#c0d0ff] text-primary hover:bg-primary-50"
                  >
                    + 기술자 탐색
                  </button>
                )}
              </td>
              <td
                className="relative border-b border-solid border-[#f5f5f5] p-0"
                style={{ width: ganttWidth, height: ROW_HEIGHT }}
              >
                <GanttBars task={task} dates={dates} startDate={startDate} todayIso={today} />
              </td>
            </tr>
          ))}

          {/* 작업 생성 행 */}
          <tr style={{ height: ROW_HEIGHT }}>
            <td
              className={`${stickyCell} border-r border-solid border-[#f5f5f5] p-2`}
              style={{ left: STICKY_LEFT[0] }}
            >
              <button
                type="button"
                onClick={handleCreateTask}
                className="text-m-14 h-[33.5px] w-[103px] rounded-[6px] border border-dashed border-[#c0d0ff] text-primary hover:bg-primary-50"
              >
                + 작업 생성
              </button>
            </td>
            <td
              className={`${stickyCell} border-r border-solid border-[#f5f5f5]`}
              style={{ left: STICKY_LEFT[1] }}
            />
            <td
              className={`${stickyCell} border-r border-solid border-gray-300`}
              style={{ left: STICKY_LEFT[2] }}
            />
            <td style={{ width: ganttWidth }} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
