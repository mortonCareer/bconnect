'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'

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
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.5 15L7.5 10L12.5 5"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export { BackButton }
