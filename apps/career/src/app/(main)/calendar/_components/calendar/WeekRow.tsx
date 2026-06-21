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
}

export function WeekRow({ row, monthIso, today, selectedDay, onSelectDay }: WeekRowProps) {
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
      {/* 바 레이어 — 숫자 아래 overlay, 클릭은 셀로 통과 */}
      <div className="pointer-events-none absolute inset-x-0 top-7 grid grid-cols-7 gap-y-0.5">
        {row.segments.map((seg) => (
          <TaskBar key={`${seg.task.id}-${seg.colStart}`} segment={seg} />
        ))}
      </div>
    </div>
  )
}
