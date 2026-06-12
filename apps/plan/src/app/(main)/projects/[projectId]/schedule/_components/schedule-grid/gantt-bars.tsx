'use client'

import { ContextMenu } from '@bconnect/ui'
import { BAR_HEIGHT, BAR_STYLES, BAR_TOP, DAY_WIDTH, STATUS_LABELS } from './constants'
import { addDays, daysBetween, toIsoDate } from './date-utils'
import type { ScheduleTask } from './types'
import type { DragMode } from './use-bar-drag'
import { useBarDrag } from './use-bar-drag'

/** 드래그 모드별로 snap 된 deltaDays 를 시작/종료일에 반영. 리사이즈는 최소 1일 보장 클램프. */
function applyDrag(
  task: ScheduleTask,
  mode: DragMode,
  deltaDays: number
): Pick<ScheduleTask, 'startDate' | 'endDate'> {
  const span = daysBetween(task.startDate, task.endDate)
  if (mode === 'move') {
    return {
      startDate: addDays(task.startDate, deltaDays),
      endDate: addDays(task.endDate, deltaDays),
    }
  }
  if (mode === 'resize-start') {
    return { startDate: addDays(task.startDate, Math.min(deltaDays, span)), endDate: task.endDate }
  }
  return { startDate: task.startDate, endDate: addDays(task.endDate, Math.max(deltaDays, -span)) }
}

/** gantt 타임라인 셀 내용 — 일자 배경 + 작업 바. relative td 안에 absolute 로 배치된다. */
export function GanttBars({
  task,
  dates,
  startDate,
  todayIso,
  onUpdate,
  onEdit,
  onDelete,
}: {
  task: ScheduleTask
  dates: Date[]
  startDate: string
  todayIso: string | undefined
  onUpdate: (id: string, patch: Partial<Omit<ScheduleTask, 'id'>>) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { drag, moveHandleProps, startHandleDown, endHandleDown } = useBarDrag(
    DAY_WIDTH,
    (mode, deltaDays) => {
      onUpdate(task.id, applyDrag(task, mode, deltaDays))
    },
    () => onEdit(task.id)
  )

  const preview = drag ? applyDrag(task, drag.mode, drag.deltaDays) : task
  const offsetDays = daysBetween(startDate, preview.startDate)
  const spanDays = daysBetween(preview.startDate, preview.endDate) + 1
  const left = offsetDays * DAY_WIDTH + 2
  const width = spanDays * DAY_WIDTH - 4
  const style = BAR_STYLES[task.status]
  const label = STATUS_LABELS[task.status]

  return (
    <>
      {dates.map((d, i) => {
        const iso = toIsoDate(d)
        const isMonthEnd = d.getMonth() !== dates[i + 1]?.getMonth()
        return (
          <div
            key={iso}
            aria-hidden="true"
            className={`absolute inset-y-0 border-r border-solid ${isMonthEnd ? 'border-[#d0d0d0]' : 'border-[#f5f5f5]'}`}
            style={{
              left: i * DAY_WIDTH,
              width: DAY_WIDTH,
              backgroundColor: iso === todayIso ? '#fff8f8' : undefined,
            }}
          />
        )
      })}
      <ContextMenu
        trigger={
          <div
            {...moveHandleProps}
            className={`absolute flex touch-none items-center rounded pl-2.5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${drag ? 'z-10 cursor-grabbing opacity-90' : 'cursor-grab'}`}
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
              aria-hidden="true"
              onPointerDown={startHandleDown}
              className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l hover:bg-black/15"
            />
            <div
              aria-hidden="true"
              onPointerDown={endHandleDown}
              className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r hover:bg-black/15"
            />
          </div>
        }
        items={[
          { label: '수정', onSelect: () => onEdit(task.id) },
          { label: '삭제', onSelect: () => onDelete(task.id), destructive: true },
        ]}
      />
    </>
  )
}
