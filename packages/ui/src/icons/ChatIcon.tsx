import type { SVGProps } from 'react'

interface ChatIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function ChatIcon({ size = 20, ...props }: ChatIconProps) {
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
        d="M17.5 9.58333C17.5029 10.6832 17.2459 11.7683 16.75 12.75C16.162 13.9265 15.2581 14.916 14.1395 15.6078C13.021 16.2995 11.7319 16.6662 10.4167 16.6667C9.31678 16.6696 8.23176 16.4126 7.25 15.9167L2.5 17.5L4.08333 12.75C3.58744 11.7683 3.33047 10.6832 3.33333 9.58333C3.33384 8.26812 3.70051 6.97905 4.39227 5.86045C5.08402 4.74185 6.07355 3.83797 7.25 3.25C8.23176 2.75411 9.31678 2.49713 10.4167 2.5H10.8333C12.5703 2.59583 14.2109 3.32897 15.4409 4.55907C16.671 5.78917 17.4042 7.42971 17.5 9.16667V9.58333Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
