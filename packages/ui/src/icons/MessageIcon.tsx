/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=188-1643
 */
import type { SVGProps } from 'react'

interface MessageIconProps extends SVGProps<SVGSVGElement> {
  size?: number
  active?: boolean
}

export function MessageIcon({ size = 20, active = false, ...props }: MessageIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 말풍선 — 좌하단만 각진 원형 */}
      <path
        d="M2.5 10A7.5 7.5 0 1 1 10 17.5H3.5A1 1 0 0 1 2.5 16.5Z"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
      />
      <path
        d="M5.6 7.8H13.2M5.6 10.4H13.2M5.6 13H10.2"
        stroke={active ? 'white' : 'currentColor'}
        strokeWidth="1.33"
        strokeLinecap="round"
      />
    </svg>
  )
}
