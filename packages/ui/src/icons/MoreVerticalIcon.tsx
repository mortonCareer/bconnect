/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1015-8155
 */
import type { SVGProps } from 'react'

interface MoreVerticalIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function MoreVerticalIcon({ size = 16, ...props }: MoreVerticalIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  )
}
