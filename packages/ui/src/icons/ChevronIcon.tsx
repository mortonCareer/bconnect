/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=352-2839
 */
import type { SVGProps } from 'react'

type ChevronDirection = 'up' | 'down' | 'left' | 'right'

const ROTATION: Record<ChevronDirection, number> = { left: 0, up: 90, right: 180, down: 270 }

interface ChevronIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  direction?: ChevronDirection
}

export function ChevronIcon({ size = 20, direction = 'down', ...props }: ChevronIconProps) {
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
        d="M12.5 15L7.5 10L12.5 5"
        transform={`rotate(${ROTATION[direction]} 10 10)`}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
