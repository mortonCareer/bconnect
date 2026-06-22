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
  return (
    <div className="relative">
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
            onSelect={() => onSelectDay(row.cells[seg.colStart] ?? row.cells[0]!)}
            hovered={seg.task.id === hoveredTaskId}
            onHover={onHoverTask}
          />
        ))}
      </div>
    </div>
  )
}
