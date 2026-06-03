/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-8420
 */
import type { SVGProps } from 'react'

interface CheckCircleIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function CheckCircleIcon({ size = 20, ...props }: CheckCircleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10L9 12.5L13.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
