import { cn } from '@bconnect/ui'
import { barColor } from './constants'
import type { BarSegment } from './types'

/** 한 주(週)행 안에서 작업 한 조각을 그리는 바. 클릭 시 해당 일 선택. */
export function TaskBar({ segment, onSelect }: { segment: BarSegment; onSelect: () => void }) {
  const { task, colStart, colSpan, lane, continuesLeft, continuesRight } = segment
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ gridColumn: `${colStart + 1} / span ${colSpan}`, gridRow: lane + 1 }}
      className={cn(
        'pointer-events-auto mx-px flex h-[21px] cursor-pointer items-center overflow-hidden px-1.5 text-left text-[10px] font-medium transition-[filter] hover:brightness-95',
        barColor(task.colorIndex),
        continuesLeft ? 'rounded-l-none' : 'rounded-l-sm',
        continuesRight ? 'rounded-r-none' : 'rounded-r-sm'
      )}
    >
      <span className="truncate">{task.title}</span>
    </button>
  )
}
