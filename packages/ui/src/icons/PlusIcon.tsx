/**
 * @figma-pending 작업 생성 진입 + 버튼 (#650)
 */
import type { SVGProps } from 'react'

interface PlusIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function PlusIcon({ size = 24, ...props }: PlusIconProps) {
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
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
