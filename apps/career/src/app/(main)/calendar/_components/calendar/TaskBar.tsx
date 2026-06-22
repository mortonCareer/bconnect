import { cn } from '@bconnect/ui'
import { barColor } from './constants'
import type { BarSegment } from './types'

interface TaskBarProps {
  segment: BarSegment
  onSelect: () => void
  /** 같은 작업의 다른 세그먼트(주 경계로 분할)와 hover 연동 — true 면 강조. */
  hovered: boolean
  onHover: (taskId: number | null) => void
}

/** 한 주(週)행 안에서 작업 한 조각을 그리는 바. 클릭 시 해당 일 선택. */
export function TaskBar({ segment, onSelect, hovered, onHover }: TaskBarProps) {
  const { task, colStart, colSpan, lane, continuesLeft, continuesRight } = segment
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
      style={{ gridColumn: `${colStart + 1} / span ${colSpan}`, gridRow: lane + 1 }}
      className={cn(
        'pointer-events-auto mx-px flex h-[21px] cursor-pointer items-center overflow-hidden px-1.5 text-left text-[10px] font-medium transition-[filter]',
        barColor(task.colorIndex),
        hovered && 'brightness-95',
        continuesLeft ? 'rounded-l-none' : 'rounded-l-sm',
        continuesRight ? 'rounded-r-none' : 'rounded-r-sm'
      )}
    >
      <span className="truncate">{task.title}</span>
    </button>
  )
}
