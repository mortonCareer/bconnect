/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=17-1329
 */
import type { SVGProps } from 'react'

interface ProfileIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  active?: boolean
}

export function ProfileIcon({ size = 20, active = false, ...props }: ProfileIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(3.5 11.833)">
        <path
          d="M12.333 5.666V4.0C12.333 3.116 11.982 2.268 11.357 1.643C10.732 1.018 9.884 0.666 9.0 0.666H4.0C3.116 0.666 2.268 1.018 1.643 1.643C1.018 2.268 0.666 3.116 0.666 4.0V5.666"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(6.0 1.833)">
        <path
          d="M4.0 7.333C5.841 7.333 7.333 5.841 7.333 4.0C7.333 2.159 5.841 0.666 4.0 0.666C2.159 0.666 0.666 2.159 0.666 4.0C0.666 5.841 2.159 7.333 4.0 7.333Z"
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
