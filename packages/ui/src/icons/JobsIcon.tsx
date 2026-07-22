/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=17-1331
 */
import type { SVGProps } from 'react'

interface JobsIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  active?: boolean
}

export function JobsIcon({ size = 20, active = false, ...props }: JobsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(2.667 1.0)">
        <path
          d="M2.333 17.333C1.891 17.333 1.467 17.158 1.155 16.845C0.842 16.532 0.666 16.109 0.666 15.666V2.333C0.666 1.891 0.842 1.467 1.155 1.155C1.467 0.842 1.891 0.666 2.333 0.666H9.0C9.264 0.666 9.525 0.718 9.769 0.819C10.012 0.92 10.234 1.068 10.42 1.255L13.41 4.245C13.597 4.431 13.746 4.653 13.847 4.897C13.948 5.141 14.0 5.402 14.0 5.666V15.666C14.0 16.109 13.824 16.532 13.512 16.845C13.199 17.158 12.775 17.333 12.333 17.333H2.333Z"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </g>
      <g transform="translate(11.0 1.0)">
        <path
          d="M0.666 0.666V4.833C0.666 5.054 0.754 5.266 0.911 5.422C1.067 5.579 1.279 5.666 1.5 5.666H5.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(6.0 6.83)">
        <path
          d="M2.333 0.666H0.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(6.0 10.17)">
        <path
          d="M7.333 0.666H0.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(6.0 13.5)">
        <path
          d="M7.333 0.666H0.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
