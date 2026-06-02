import type { SVGProps } from 'react'

interface ChevronRightIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function ChevronRightIcon({ size = 16, ...props }: ChevronRightIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 5.067 9.6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0.5 0.5 L4.567 4.8 L0.5 9.1"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
