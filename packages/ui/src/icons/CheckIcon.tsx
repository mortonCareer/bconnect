import type { SVGProps } from 'react'

interface CheckIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function CheckIcon({ size = 50, ...props }: CheckIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.5 25L21.875 34.375L37.5 15.625"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
