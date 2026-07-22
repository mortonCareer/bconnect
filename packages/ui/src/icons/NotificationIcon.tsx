/**
 * @figma-pending 알림(벨) 아이콘 — 시안 미정. lucide `bell` 기반, TopBar 알림 진입점용.
 */
import type { SVGProps } from 'react'

interface NotificationIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function NotificationIcon({ size = 20, ...props }: NotificationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
