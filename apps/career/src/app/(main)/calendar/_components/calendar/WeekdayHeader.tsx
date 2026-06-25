import { cn } from '@bconnect/ui'
import { WEEKDAY_LABELS } from './date-helpers'

export function WeekdayHeader() {
  return (
    <div className="grid grid-cols-7">
      {WEEKDAY_LABELS.map((label, i) => (
        <div
          key={label}
          className={cn(
            'py-2 text-center text-m-12',
            i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'
          )}
        >
          {label}
        </div>
      ))}
    </div>
  )
}
