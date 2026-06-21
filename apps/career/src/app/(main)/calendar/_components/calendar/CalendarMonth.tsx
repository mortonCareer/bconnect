import { todayIso } from '@bconnect/config/date'
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
        />
      ))}
    </div>
  )
}
