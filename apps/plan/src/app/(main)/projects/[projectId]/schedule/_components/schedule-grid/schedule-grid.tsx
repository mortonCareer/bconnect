'use client'

import { usePanelNav } from '@/hooks/usePanelNav'
import { Button, ConfirmDialog } from '@bconnect/ui'
import Link from 'next/link'
import type { WheelEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  COL_ASSIGNEE,
  COL_CATEGORY,
  COL_STATUS,
  DAY_WIDTH,
  HEADER_HEIGHT,
  PAST_CONTEXT_DAYS,
  PILL_STYLES,
  RIGHT_PAD_WIDTH,
  ROW_HEIGHT,
  STATUS_LABELS,
  STICKY_LEFT,
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
import type { ScheduleGridProps, TaskStatus } from './types'
import { useScheduleTasks } from './use-schedule-tasks'

function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`text-m-12 inline-flex h-[26px] items-center justify-center whitespace-nowrap rounded-[4px] px-[9px] ${PILL_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function ScheduleGrid({ tasks: initialTasks, today }: ScheduleGridProps) {
  const { panelHref, openPanel } = usePanelNav()
  const { tasks, updateTask, deleteTask } = useScheduleTasks(initialTasks)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

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
  const padWidth = Math.max(
    RIGHT_PAD_WIDTH,
    containerWidth - (COL_CATEGORY + COL_STATUS + COL_ASSIGNEE) - daysWidth
  )
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
    alert('준비 중')
  }

  function handleFindTechnician() {
    alert('준비 중')
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

          {/* 공종 / 상태 / 기술자 + 일자 헤더 */}
          <tr style={{ height: HEADER_HEIGHT }}>
            {['공종', '상태', '기술자'].map((label, i) => (
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
          {tasks.map((task) => (
            <tr key={task.id} style={{ height: ROW_HEIGHT }}>
              <td
                className={`${stickyCell} border-b border-r border-solid border-b-[#f5f5f5] border-r-[#e5e5e5] text-center align-middle text-r-14 text-[#3d3d3d]`}
                style={{ left: STICKY_LEFT[0] }}
              >
                {task.category}
              </td>
              <td
                className={`${stickyCell} border-b border-r border-solid border-b-[#f5f5f5] border-r-[#e5e5e5] text-center align-middle`}
                style={{ left: STICKY_LEFT[1] }}
              >
                <StatusPill status={task.status} />
              </td>
              <td
                className={`${stickyCell} border-b border-r border-solid border-b-[#f5f5f5] border-r-[#e5e5e5] align-middle ${task.assignee ? 'px-1 py-2' : 'p-2'}`}
                style={{ left: STICKY_LEFT[2] }}
              >
                {task.assignee ? (
                  <Link
                    href={panelHref(`profile/${task.assignee.profileId}`)}
                    scroll={false}
                    className="flex w-full items-center gap-2 rounded-[8px] px-1 hover:bg-gray-100"
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
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleFindTechnician}
                    className="text-m-14 h-[33.5px] w-full rounded-[6px] border-[#c0d0ff] px-0 font-medium hover:bg-primary-50"
                  >
                    + 기술자 탐색
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
          ))}

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
            <td style={{ width: ganttWidth }} />
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
