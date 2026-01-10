import * as React from 'react'
import { cn } from '../../lib/utils'

interface ProgressBarProps {
  /**
   * Current step (1-indexed)
   */
  step: number
  /**
   * Total number of steps
   */
  total: number
  /**
   * Active segment color
   * @default "bg-[#386DFF]"
   */
  activeColor?: string
  /**
   * Inactive segment color
   * @default "bg-[#E5E7EB]"
   */
  inactiveColor?: string
  /**
   * Additional class name for the container
   */
  className?: string
}

/**
 * 진행 표시줄 컴포넌트
 * step/total 기반으로 진행 상태를 표시
 */
function ProgressBar({
  step,
  total,
  activeColor = 'bg-[#386DFF]',
  inactiveColor = 'bg-[#E5E7EB]',
  className,
}: ProgressBarProps) {
  return (
    <div className={cn('flex h-[3px] w-[330px] gap-1', className)}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn('h-full flex-1 rounded-full', i < step ? activeColor : inactiveColor)}
        />
      ))}
    </div>
  )
}

export { ProgressBar }
