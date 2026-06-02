import type { SVGProps } from 'react'

interface UploadIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  active?: boolean
}

export function UploadIcon({ size = 20, active = false, ...props }: UploadIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(9.33 1.833)">
        <path
          d="M0.666 0.666V10.666"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(5.167 1.833)">
        <path
          d="M9.0 4.833L4.833 0.666L0.666 4.833"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(1.833 11.833)">
        <path
          d="M15.666 0.666V4.0C15.666 4.442 15.491 4.866 15.178 5.178C14.866 5.491 14.442 5.666 14.0 5.666H2.333C1.891 5.666 1.467 5.491 1.155 5.178C0.842 4.866 0.666 4.442 0.666 4.0V0.666"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </g>
    </svg>
  )
}
