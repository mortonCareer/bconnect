import { cn } from '@bconnect/ui'

interface DayCellProps {
  iso: string
  dayNum: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  /** 0=일 … 6=토 (주말 색상). */
  weekday: number
  overflowCount: number
  onSelect: () => void
}

export function DayCell({
  dayNum,
  isCurrentMonth,
  isToday,
  isSelected,
  weekday,
  overflowCount,
  onSelect,
}: DayCellProps) {
  const weekendColor =
    weekday === 0 ? 'text-red-500' : weekday === 6 ? 'text-blue-500' : 'text-gray-900'

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-[72px] cursor-pointer flex-col items-start rounded-lg px-2 pt-1.5 transition-colors hover:bg-primary-100"
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-m-14',
          isToday
            ? 'bg-primary text-white'
            : isSelected
              ? 'bg-secondary text-primary-700'
              : isCurrentMonth
                ? weekendColor
                : 'text-gray-300'
        )}
      >
        {dayNum}
      </span>
      {overflowCount > 0 && (
        <span className="mt-auto pb-1 text-r-12 text-gray-400">+{overflowCount}</span>
      )}
    </button>
  )
}
