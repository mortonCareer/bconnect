'use client'

import type { TaskRow } from './types'
import type { TaskStatus } from './gantt-chart/types'

export type TaskTableProps = {
  tasks: TaskRow[]
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: '완료됨',
  in_progress: '진행 중',
  recruited: '섭외됨',
  recruiting: '섭외 중',
  not_started: '시작 전',
}

/**
 * Status pill 색상 — Figma 1573:15430 spec 기준.
 * gantt-chart.tsx STATUS_STYLES 와 마찬가지로 토큰화되지 않은 색은 inline hex 유지.
 * (#fff3e0, #ffe0b2, #e6780a 는 token 없음, #c0d0ff 는 token 없음)
 */
const STATUS_PILL_STYLES: Record<TaskStatus, string> = {
  completed: 'bg-[#f0f0f0] border border-[#d0d0d0] text-[#3d3d3d]',
  in_progress: 'bg-bconnect-primary text-white',
  recruited: 'bg-bconnect-primary-sub border border-[#c0d0ff] text-bconnect-primary',
  recruiting: 'bg-[#fff3e0] border border-[#ffe0b2] text-[#e6780a]',
  not_started: 'bg-white border border-bconnect-gray-300 text-bconnect-gray-500',
}

function handlePlaceholder() {
  alert('준비 중')
}

function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex h-[26px] items-center justify-center whitespace-nowrap rounded-[4px] px-[9px] text-m-12 ${STATUS_PILL_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function TaskTable(props: TaskTableProps) {
  return (
    <div
      data-testid="task-table"
      role="table"
      aria-label="공종 목록"
      className="flex w-[440px] shrink-0 items-start bg-white font-sans"
    >
      {/* 공종 column */}
      <div
        role="rowgroup"
        className="flex h-[600px] w-[120px] shrink-0 flex-col border-r border-solid border-bconnect-gray-300"
      >
        {/* 빈 spacer row (gantt 의 MonthHeader 위치 맞춤) */}
        <div className="h-[40px] w-full shrink-0 border-b border-solid border-bconnect-gray-300" />
        {/* column header */}
        <div
          role="columnheader"
          className="flex h-[40px] w-full shrink-0 items-center justify-center border-b border-solid border-bconnect-gray-300 bg-[#fafafa]"
        >
          <p className="text-sb-14 text-[#3d3d3d]">공종</p>
        </div>
        {props.tasks.map((task) => (
          <div
            key={`category-${task.id}`}
            role="cell"
            className="flex h-[52px] w-full shrink-0 items-center justify-center border-b border-solid border-[#f5f5f5]"
          >
            <p className="text-r-14 text-[#3d3d3d]">{task.category}</p>
          </div>
        ))}
        {/* 작업 생성 row */}
        <div className="flex h-[52px] w-full shrink-0 items-center justify-center p-2">
          <button
            type="button"
            onClick={handlePlaceholder}
            className="h-[33.5px] w-[103px] rounded-[6px] border border-dashed border-[#c0d0ff] text-m-14 text-bconnect-primary hover:bg-bconnect-primary-sub"
          >
            + 작업 생성
          </button>
        </div>
      </div>

      {/* 상태 column */}
      <div
        role="rowgroup"
        className="flex h-[600px] w-[100px] shrink-0 flex-col border-r border-solid border-bconnect-gray-300"
      >
        <div className="h-[40px] w-full shrink-0 border-b border-solid border-bconnect-gray-300" />
        <div
          role="columnheader"
          className="flex h-[40px] w-full shrink-0 items-center justify-center border-b border-solid border-bconnect-gray-300 bg-[#fafafa]"
        >
          <p className="text-sb-14 text-[#3d3d3d]">상태</p>
        </div>
        {props.tasks.map((task) => (
          <div
            key={`status-${task.id}`}
            role="cell"
            data-testid={`task-row-${task.id}`}
            className="flex h-[52px] w-full shrink-0 items-center justify-center border-b border-solid border-[#f5f5f5]"
          >
            <StatusPill status={task.status} />
          </div>
        ))}
        {/* 작업 생성 row 와 높이 맞춤 (빈 셀) */}
        <div className="h-[52px] w-full shrink-0" />
      </div>

      {/* 기술자 column */}
      <div
        role="rowgroup"
        className="flex h-[600px] min-w-0 flex-1 flex-col border-r border-solid border-bconnect-gray-300"
      >
        <div className="h-[40px] w-full shrink-0 border-b border-solid border-bconnect-gray-300" />
        <div
          role="columnheader"
          className="flex h-[40px] w-full shrink-0 items-center justify-center border-b border-solid border-bconnect-gray-300 bg-[#fafafa]"
        >
          <p className="text-sb-14 text-[#3d3d3d]">기술자</p>
        </div>
        {props.tasks.map((task) => (
          <div
            key={`assignee-${task.id}`}
            role="cell"
            className="flex h-[52px] w-full shrink-0 items-center border-b border-solid border-[#f5f5f5] px-[10px]"
          >
            {task.assignee ? (
              <div data-testid="assignee" className="flex w-full items-center gap-2">
                <div
                  aria-hidden="true"
                  className="size-[34px] shrink-0 rounded-full bg-[#d9d9d9]"
                />
                <div className="flex min-w-0 flex-col">
                  <p className="text-sb-14 text-bconnect-gray-900">{task.assignee.name}</p>
                  <p className="text-r-12 text-bconnect-gray-500">
                    {task.assignee.region} | {task.assignee.level} | {task.assignee.specialty}
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePlaceholder}
                className="h-[33.5px] w-full rounded-[6px] border border-solid border-[#c0d0ff] text-m-14 text-bconnect-primary hover:bg-bconnect-primary-sub"
              >
                + 기술자 탐색
              </button>
            )}
          </div>
        ))}
        <div className="h-[52px] w-full shrink-0" />
      </div>
    </div>
  )
}
