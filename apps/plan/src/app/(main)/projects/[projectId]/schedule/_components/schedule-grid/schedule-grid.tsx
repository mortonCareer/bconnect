'use client'

import { usePanelNav } from '@/hooks/usePanelNav'
import {
  TASK_PROGRESS_LABELS,
  TASK_STATUS_LABELS,
  TaskProgress,
  TaskStatus,
} from '@bconnect/api-client'
import { Button, ConfirmDialog } from '@bconnect/ui'
import Link from 'next/link'
import type { PointerEvent, WheelEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BAR_HEIGHT,
  BAR_TOP,
  COL_ASSIGNEE,
  COL_CATEGORY,
  COL_LEFT_TOTAL,
  COL_PROGRESS,
  COL_STATUS,
  DAY_WIDTH,
  HEADER_HEIGHT,
  PAST_CONTEXT_DAYS,
  PROGRESS_PILL_STYLES,
  RIGHT_PAD_WIDTH,
  ROW_HEIGHT,
  STATUS_PILL_STYLES,
  STICKY_LEFT,
  taskAssignee,
  tradesLabel,
} from './constants'
import {
  addDays,
  buildDates,
  daysBetween,
  groupByMonth,
  monthEndOf,
  monthStartOf,
  toIsoDate,
} from './date-utils'
import { GanttBars } from './gantt-bars'
import type { ScheduleGridProps, ScheduleTask } from './types'
import { useScheduleTasks } from './use-schedule-tasks'

const PILL_CLASSES =
  'text-m-12 inline-flex h-[26px] items-center justify-center whitespace-nowrap rounded-[4px] px-[9px]'

function StatusPill({ status }: { status: ScheduleTask['status'] }) {
  return (
    <span className={`${PILL_CLASSES} ${STATUS_PILL_STYLES[status]}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  )
}

function ProgressPill({ progress }: { progress: ScheduleTask['progress'] }) {
  return (
    <span className={`${PILL_CLASSES} ${PROGRESS_PILL_STYLES[progress]}`}>
      {TASK_PROGRESS_LABELS[progress]}
    </span>
  )
}

export function ScheduleGrid({ projectId, today: todayProp }: ScheduleGridProps) {
  const { panelHref, openPanel } = usePanelNav()
  const { tasks, updateTask, deleteTask, createTask } = useScheduleTasks(projectId)
  // 오늘 = 클라이언트 시각 (자정 부근 SSR/CSR 불일치는 허용 범위)
  const [today] = useState(() => todayProp ?? toIsoDate(new Date()))
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  // 바텀 row 드래그-생성(구글캘린더식) — 선택 day index 범위
  const createCellRef = useRef<HTMLTableCellElement>(null)
  const [createRange, setCreateRange] = useState<{ start: number; end: number } | null>(null)

  // 범위 = (최초 start -5일)의 달 1일 ~ (최후 end +5일)의 달 말일.
  // tasks 파생이라 drop(상태 변경) 시에만 재계산 (#6)
  const { startDate, endDate } = useMemo(() => {
    const start = tasks[0]?.startDate ?? today ?? ''
    let end = start
    for (const t of tasks) {
      if (t.endDate > end) end = t.endDate
    }
    if (!start) return { startDate: start, endDate: end }
    return { startDate: monthStartOf(addDays(start, -5)), endDate: monthEndOf(addDays(end, 5)) }
  }, [tasks, today])

  const dates = buildDates(startDate, endDate)
  const monthGroups = groupByMonth(dates)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setContainerWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 간트 영역이 컨테이너 잔여 폭을 항상 채우도록 우측 패드를 늘린다 (#3).
  // 콘텐츠(일자 셀)가 더 길면 기존대로 가로 스크롤.
  const daysWidth = dates.length * DAY_WIDTH
  const padWidth = Math.max(RIGHT_PAD_WIDTH, containerWidth - COL_LEFT_TOTAL - daysWidth)
  const ganttWidth = daysWidth + padWidth

  const didInitScroll = useRef(false)
  useEffect(() => {
    if (didInitScroll.current || !today) return
    didInitScroll.current = true
    const todayIndex = daysBetween(startDate, today)
    const el = scrollRef.current
    if (el) el.scrollLeft = Math.max(0, (todayIndex - PAST_CONTEXT_DAYS) * DAY_WIDTH)
  }, [today, startDate])

  function handleCreateTask() {
    openPanel('task/new')
  }

  // 바텀 row 빈 공간 드래그 → 그 기간으로 draft 작업 생성 + 편집 패널 열기 (구글캘린더식)
  function dayIndexFromX(clientX: number): number {
    const rect = createCellRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const idx = Math.floor((clientX - rect.left) / DAY_WIDTH)
    return Math.max(0, Math.min(idx, dates.length - 1))
  }
  function handleCreateDown(e: PointerEvent<HTMLTableCellElement>) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const idx = dayIndexFromX(e.clientX)
    setCreateRange({ start: idx, end: idx })
  }
  function handleCreateMove(e: PointerEvent<HTMLTableCellElement>) {
    if (!createRange) return
    const idx = dayIndexFromX(e.clientX)
    setCreateRange((r) => (r && r.end !== idx ? { ...r, end: idx } : r))
  }
  function handleCreateUp() {
    if (!createRange) return
    const a = Math.min(createRange.start, createRange.end)
    const b = Math.max(createRange.start, createRange.end)
    setCreateRange(null)
    const id = createTask({
      projectId,
      trades: [],
      ganttName: '',
      startDate: addDays(startDate, a),
      endDate: addDays(startDate, b),
      status: TaskStatus.NONE,
      progress: TaskProgress.TODO,
      draft: true,
    })
    openPanel(`task/${id}`)
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollWidth <= el.clientWidth || e.deltaY === 0) return
    const scroller = el.closest('main')
    const canScrollVertically = scroller != null && scroller.scrollHeight > scroller.clientHeight
    if (!canScrollVertically) {
      el.scrollLeft += e.deltaY
    }
  }

  const stickyCell = 'sticky z-20 bg-white'

  const createPreview = createRange
    ? {
        left: Math.min(createRange.start, createRange.end) * DAY_WIDTH + 2,
        width: (Math.abs(createRange.end - createRange.start) + 1) * DAY_WIDTH - 4,
      }
    : null

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="w-full overflow-x-auto bg-white font-sans [scrollbar-color:#d0d0d0_transparent] [scrollbar-width:thin]"
    >
      <table
        aria-label="공정표"
        className="text-left"
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          tableLayout: 'fixed',
          width: COL_LEFT_TOTAL + ganttWidth,
        }}
      >
        <colgroup>
          <col style={{ width: COL_CATEGORY }} />
          <col style={{ width: COL_STATUS }} />
          <col style={{ width: COL_PROGRESS }} />
          <col style={{ width: COL_ASSIGNEE }} />
          <col style={{ width: ganttWidth }} />
        </colgroup>

        <thead>
          {/* 월 헤더 */}
          <tr style={{ height: HEADER_HEIGHT }}>
            <th
              colSpan={4}
              className={`${stickyCell} border-b border-r border-solid border-[#e5e5e5]`}
              style={{ left: 0 }}
            />
            <th className="border-b border-solid border-[#e5e5e5] p-0 font-normal">
              <div className="flex" style={{ width: ganttWidth, height: HEADER_HEIGHT }}>
                {monthGroups.map((g, i) => (
                  <div
                    key={`${g.month}-${i}`}
                    className={`flex items-center justify-center ${i < monthGroups.length - 1 ? 'border-r border-solid border-[#d0d0d0]' : ''}`}
                    style={{ width: g.count * DAY_WIDTH }}
                  >
                    <span className="text-[13px] font-semibold leading-[19.5px] text-[#3d3d3d]">
                      {g.month}월
                    </span>
                  </div>
                ))}
                <div style={{ width: padWidth }} />
              </div>
            </th>
          </tr>

          {/* 공종 / 섭외 상태 / 진행 상태 / 기술자 + 일자 헤더 */}
          <tr style={{ height: HEADER_HEIGHT }}>
            {['공종', '섭외 상태', '진행 상태', '기술자'].map((label, i) => (
              <th
                key={label}
                scope="col"
                className={`${stickyCell} border-b border-r border-solid border-[#e5e5e5] text-sb-14 text-[#3d3d3d]`}
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
                {dates.map((d, i) => {
                  const iso = toIsoDate(d)
                  const isToday = iso === today
                  const isMonthEnd = d.getMonth() !== dates[i + 1]?.getMonth()
                  return (
                    <div
                      key={iso}
                      className={`flex items-center justify-center border-r border-solid ${isMonthEnd ? 'border-[#d0d0d0]' : 'border-[#f0f0f0]'}`}
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
                <div style={{ width: padWidth }} />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => {
            const assignee = taskAssignee(task)
            return (
              <tr key={task.id} style={{ height: ROW_HEIGHT }}>
                <td
                  className={`${stickyCell} border-b border-r border-solid border-b-[#f5f5f5] border-r-[#e5e5e5] text-center align-middle text-r-14 text-[#3d3d3d]`}
                  style={{ left: STICKY_LEFT[0] }}
                >
                  {tradesLabel(task.trades)}
                </td>
                <td
                  className={`${stickyCell} border-b border-r border-solid border-b-[#f5f5f5] border-r-[#e5e5e5] text-center align-middle`}
                  style={{ left: STICKY_LEFT[1] }}
                >
                  <StatusPill status={task.status} />
                </td>
                <td
                  className={`${stickyCell} border-b border-r border-solid border-b-[#f5f5f5] border-r-[#e5e5e5] text-center align-middle`}
                  style={{ left: STICKY_LEFT[2] }}
                >
                  <ProgressPill progress={task.progress} />
                </td>
                <td
                  className={`${stickyCell} border-b border-r border-solid border-b-[#f5f5f5] border-r-[#e5e5e5] align-middle ${assignee ? 'px-1 py-2' : 'p-2'}`}
                  style={{ left: STICKY_LEFT[3] }}
                >
                  {assignee ? (
                    <Link
                      href={panelHref(`profile/${assignee.profileId}`, { task: task.id })}
                      scroll={false}
                      className="flex w-full items-center gap-2 rounded-[8px] px-1 hover:bg-gray-100"
                    >
                      <span
                        aria-hidden="true"
                        className="size-[34px] shrink-0 rounded-full bg-[#d9d9d9]"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sb-14 text-gray-900">{assignee.name}</span>
                        <span className="text-r-12 text-gray-500">
                          {[assignee.region, assignee.level, assignee.specialty]
                            .filter(Boolean)
                            .join(' | ')}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="text-m-14 h-[33.5px] w-full rounded-[6px] border-[#c0d0ff] px-0 font-medium hover:bg-primary-50"
                    >
                      <Link href={`/?task=${task.id}&trade=${task.trades.join(',')}`}>
                        + 기술자 탐색
                      </Link>
                    </Button>
                  )}
                </td>
                <td
                  className="relative border-b border-solid border-[#f5f5f5] p-0"
                  style={{ width: ganttWidth, height: ROW_HEIGHT }}
                >
                  <GanttBars
                    task={task}
                    dates={dates}
                    startDate={startDate}
                    todayIso={today}
                    onUpdate={updateTask}
                    onEdit={(id) => openPanel(`task/${id}`)}
                    onDelete={setDeleteTargetId}
                  />
                </td>
              </tr>
            )
          })}

          {/* 작업 생성 행 */}
          <tr style={{ height: ROW_HEIGHT }}>
            <td
              className={`${stickyCell} border-r border-solid border-[#e5e5e5] p-2`}
              style={{ left: STICKY_LEFT[0] }}
            >
              <Button
                variant="outline"
                type="button"
                onClick={handleCreateTask}
                className="text-m-14 h-[33.5px] w-[103px] rounded-[6px] border-dashed border-[#c0d0ff] px-0 font-medium hover:bg-primary-50"
              >
                + 작업 생성
              </Button>
            </td>
            <td
              className={`${stickyCell} border-r border-solid border-[#e5e5e5]`}
              style={{ left: STICKY_LEFT[1] }}
            />
            <td
              className={`${stickyCell} border-r border-solid border-[#e5e5e5]`}
              style={{ left: STICKY_LEFT[2] }}
            />
            <td
              className={`${stickyCell} border-r border-solid border-[#e5e5e5]`}
              style={{ left: STICKY_LEFT[3] }}
            />
            <td
              ref={createCellRef}
              onPointerDown={handleCreateDown}
              onPointerMove={handleCreateMove}
              onPointerUp={handleCreateUp}
              onPointerCancel={() => setCreateRange(null)}
              className="relative cursor-cell touch-none border-b border-solid border-[#f5f5f5] p-0"
              style={{ width: ganttWidth, height: ROW_HEIGHT }}
            >
              {dates.map((d, i) => {
                const isMonthEnd = d.getMonth() !== dates[i + 1]?.getMonth()
                return (
                  <div
                    key={toIsoDate(d)}
                    aria-hidden="true"
                    className={`absolute inset-y-0 border-r border-solid ${isMonthEnd ? 'border-[#d0d0d0]' : 'border-[#f5f5f5]'}`}
                    style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                  />
                )
              })}
              {createPreview && (
                <div
                  aria-hidden="true"
                  className="absolute rounded border border-primary/60 bg-primary/25"
                  style={{
                    left: createPreview.left,
                    width: createPreview.width,
                    top: BAR_TOP,
                    height: BAR_HEIGHT,
                  }}
                />
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="작업을 삭제할까요?"
        description="삭제한 작업은 복구할 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (deleteTargetId) deleteTask(deleteTargetId)
          setDeleteTargetId(null)
        }}
      />
    </div>
  )
}
