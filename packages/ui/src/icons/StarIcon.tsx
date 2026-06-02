import type { SVGProps } from 'react'

interface StarIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  filled?: boolean
}

export function StarIcon({ size = 16, filled = false, ...props }: StarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15L5 8.42 2 5.5l4.15-.75L8 1z"
        fill={filled ? '#FFB800' : 'var(--color-gray-300)'}
      />
    </svg>
  )
}
