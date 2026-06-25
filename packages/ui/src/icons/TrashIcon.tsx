/**
 * @figma-pending 작업 액션시트 — 삭제 (#650)
 */
import type { SVGProps } from 'react'

interface TrashIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function TrashIcon({ size = 20, ...props }: TrashIconProps) {
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
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6M14 11v6" />
      </g>
    </svg>
  )
}
