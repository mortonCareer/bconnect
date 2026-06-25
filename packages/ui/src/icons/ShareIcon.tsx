/**
 * @figma-pending 작업 액션시트 — 공유 (#650)
 */
import type { SVGProps } from 'react'

interface ShareIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function ShareIcon({ size = 20, ...props }: ShareIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </g>
    </svg>
  )
}
