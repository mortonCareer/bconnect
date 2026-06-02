import type { SVGProps } from 'react'

interface HomeIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  active?: boolean
}

export function HomeIcon({ size = 20, active = false, ...props }: HomeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(1.833 1.0)">
        <path
          d="M0.666 7.333C0.666 7.091 0.719 6.852 0.821 6.632C0.923 6.412 1.072 6.217 1.257 6.06L7.091 1.06C7.391 0.806 7.773 0.666 8.166 0.666C8.56 0.666 8.941 0.806 9.242 1.06L15.076 6.06C15.261 6.217 15.41 6.412 15.512 6.632C15.614 6.852 15.667 7.091 15.666 7.333V14.833C15.666 15.276 15.491 15.699 15.178 16.012C14.866 16.325 14.442 16.5 14.0 16.5H2.333C1.891 16.5 1.467 16.325 1.155 16.012C0.842 15.699 0.666 15.276 0.666 14.833V7.333Z"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </g>
      <g transform="translate(6.833 9.333)">
        <path
          d="M5.666 8.166V1.5C5.666 1.279 5.579 1.067 5.422 0.911C5.266 0.754 5.054 0.666 4.833 0.666H1.5C1.279 0.666 1.067 0.754 0.911 0.911C0.754 1.067 0.666 1.279 0.666 1.5V8.166"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
