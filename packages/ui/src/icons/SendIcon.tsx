import type { SVGProps } from 'react'

interface SendIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function SendIcon({ size = 24, ...props }: SendIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M20.5158 4.01275C20.9478 2.81775 19.7898 1.65975 18.5948 2.09275L3.98981 7.37475C2.79081 7.80875 2.64581 9.44475 3.74881 10.0838L8.41081 12.7828L12.5738 8.61975C12.7624 8.43759 13.015 8.3368 13.2772 8.33908C13.5394 8.34135 13.7902 8.44652 13.9756 8.63193C14.161 8.81734 14.2662 9.06815 14.2685 9.33035C14.2708 9.59255 14.17 9.84515 13.9878 10.0338L9.82481 14.1968L12.5248 18.8588C13.1628 19.9618 14.7988 19.8158 15.2328 18.6178L20.5158 4.01275Z"
        fill="currentColor"
      />
    </svg>
  )
}
