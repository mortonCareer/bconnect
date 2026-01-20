'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { ChevronLeftIcon } from '../../icons'

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Stroke color of the chevron icon
   * @default "#9C9C9C"
   */
  strokeColor?: string
}

/**
 * 뒤로가기 버튼 컴포넌트
 * Chevron left 아이콘을 포함한 버튼
 */
function BackButton({ className, strokeColor = '#9C9C9C', onClick, ...props }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex size-5 items-center justify-center', className)}
      aria-label="뒤로가기"
      {...props}
    >
      <ChevronLeftIcon style={{ color: strokeColor }} />
    </button>
  )
}

export { BackButton }
