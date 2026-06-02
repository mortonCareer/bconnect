import type { SVGProps } from 'react'

interface FilterIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function FilterIcon({ size = 20, ...props }: FilterIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 5.83333H17.5M5 10H15M7.5 14.1667H12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
