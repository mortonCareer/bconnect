/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-8420
 */
import type { SVGProps } from 'react'

interface CheckCircleFilledIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function CheckCircleFilledIcon({ size = 18, ...props }: CheckCircleFilledIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="9" cy="9" r="9" fill="currentColor" />
      <path
        d="M5.5 9.2L7.7 11.4L12.5 6.6"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
