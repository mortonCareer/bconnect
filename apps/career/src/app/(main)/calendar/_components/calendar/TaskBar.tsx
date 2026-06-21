import { cn } from '@bconnect/ui'
import { barColor } from './constants'
import type { BarSegment } from './types'

/** 한 주(週)행 안에서 작업 한 조각을 그리는 바. gridColumn 으로 열 span, gridRow 로 레인. */
export function TaskBar({ segment }: { segment: BarSegment }) {
  const { task, colStart, colSpan, lane, continuesLeft, continuesRight } = segment
  return (
    <div
      style={{ gridColumn: `${colStart + 1} / span ${colSpan}`, gridRow: lane + 1 }}
      className={cn(
        'mx-px truncate px-1.5 py-px text-m-12 leading-tight',
        barColor(task.colorIndex),
        continuesLeft ? 'rounded-l-none' : 'rounded-l-sm',
        continuesRight ? 'rounded-r-none' : 'rounded-r-sm'
      )}
    >
      {task.title}
    </div>
  )
}
