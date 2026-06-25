import { ChevronIcon, cn } from '@bconnect/ui'
import { formatMonthHeader } from './date-helpers'

interface CalendarHeaderProps {
  monthIso: string
  onPrev: () => void
  onNext: () => void
}

/** "1월 2025" + 이전/다음 달 화살표 (데스크탑 월 이동). */
export function CalendarHeader({ monthIso, onPrev, onNext }: CalendarHeaderProps) {
  const { month, year } = formatMonthHeader(monthIso)
  const arrowClass =
    'flex size-8 cursor-pointer items-center justify-center text-gray-500 transition-all hover:opacity-60 active:scale-[0.95]'

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="flex items-baseline gap-1.5">
        <span className="text-sb-20 text-gray-900">{month}</span>
        <span className="text-m-16 text-gray-400">{year}</span>
      </p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onPrev} className={cn(arrowClass)} aria-label="이전 달">
          <ChevronIcon direction="left" />
        </button>
        <button type="button" onClick={onNext} className={cn(arrowClass)} aria-label="다음 달">
          <ChevronIcon direction="right" />
        </button>
      </div>
    </div>
  )
}
