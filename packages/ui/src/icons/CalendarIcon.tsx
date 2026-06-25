/**
 * @figma-pending 캘린더 하단 네비 아이콘 (#650)
 */
import type { SVGProps } from 'react'

interface CalendarIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  active?: boolean
}

export function CalendarIcon({ size = 20, active = false, ...props }: CalendarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="3"
        y="4.5"
        width="18"
        height="16.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
      />
      <path d="M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
      <path
        d="M3 9.5h18"
        stroke={active ? 'white' : 'currentColor'}
        strokeWidth="1.67"
        strokeLinecap="round"
      />
    </svg>
  )
}
