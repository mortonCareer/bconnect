import { todayIso } from '@bconnect/config/date'
import { useState } from 'react'
import { WeekRow } from './WeekRow'
import { WeekdayHeader } from './WeekdayHeader'
import { buildWeekRows } from './grid-builder'
import type { CalendarTask } from './types'

interface CalendarMonthProps {
  monthIso: string
  tasks: CalendarTask[]
  selectedDay: string
  onSelectDay: (iso: string) => void
}

export function CalendarMonth({ monthIso, tasks, selectedDay, onSelectDay }: CalendarMonthProps) {
  const rows = buildWeekRows(monthIso, tasks)
  const today = todayIso()
  // 주 경계로 분할된 같은 작업의 세그먼트들을 hover 연동 (id 단위)
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null)

  return (
    <div>
      <WeekdayHeader />
      {rows.map((row) => (
        <WeekRow
          key={row.cells[0]}
          row={row}
          monthIso={monthIso}
          today={today}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
          hoveredTaskId={hoveredTaskId}
          onHoverTask={setHoveredTaskId}
        />
      ))}
    </div>
  )
}
