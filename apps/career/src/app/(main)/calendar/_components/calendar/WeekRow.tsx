import type { MouseEvent } from 'react'
import { useRef } from 'react'
import { DayCell } from './DayCell'
import { TaskBar } from './TaskBar'
import { isSameMonth } from './date-helpers'
import type { WeekRowModel } from './types'

interface WeekRowProps {
  row: WeekRowModel
  monthIso: string
  today: string
  selectedDay: string
  onSelectDay: (iso: string) => void
  hoveredTaskId: number | null
  onHoverTask: (taskId: number | null) => void
}

export function WeekRow({
  row,
  monthIso,
  today,
  selectedDay,
  onSelectDay,
  hoveredTaskId,
  onHoverTask,
}: WeekRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  // 바 클릭 시 클릭 x좌표가 떨어진 날짜 셀을 선택 (세그먼트 첫날 아님).
  const selectAtPoint = (e: MouseEvent) => {
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect) return
    const col = Math.min(6, Math.max(0, Math.floor((e.clientX - rect.left) / (rect.width / 7))))
    onSelectDay(row.cells[col] ?? row.cells[0]!)
  }

  return (
    <div ref={rowRef} className="relative">
      <div className="grid grid-cols-7">
        {row.cells.map((iso, i) => (
          <DayCell
            key={iso}
            iso={iso}
            dayNum={Number(iso.slice(8, 10))}
            isCurrentMonth={isSameMonth(iso, monthIso)}
            isToday={iso === today}
            isSelected={iso === selectedDay}
            weekday={i}
            overflowCount={row.overflowByDay[i] ?? 0}
            onSelect={() => onSelectDay(iso)}
          />
        ))}
      </div>
      {/* 바 레이어 — 숫자 아래 overlay. 컨테이너는 클릭 통과(셀 선택), 각 바만 클릭 가능 */}
      <div className="pointer-events-none absolute inset-x-0 top-7 grid grid-cols-7 gap-y-0.5">
        {row.segments.map((seg) => (
          <TaskBar
            key={`${seg.task.id}-${seg.colStart}`}
            segment={seg}
            onSelect={selectAtPoint}
            hovered={seg.task.id === hoveredTaskId}
            onHover={onHoverTask}
          />
        ))}
      </div>
    </div>
  )
}
