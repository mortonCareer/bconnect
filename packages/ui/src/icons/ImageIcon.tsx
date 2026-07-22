/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=364-5520
 */
import type { SVGProps } from 'react'

interface ImageIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function ImageIcon({ size = 24, ...props }: ImageIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="3.75"
        y="3.75"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9.75"
        cy="9.75"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.75 15.75L18.664 12.664C18.2889 12.2891 17.7803 12.0784 17.25 12.0784C16.7197 12.0784 16.2111 12.2891 15.836 12.664L6.75 21.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
