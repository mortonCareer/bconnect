/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=407-3509
 */
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
        fillRule="evenodd"
        clipRule="evenodd"
        transform="translate(0 1)"
        d="M16.6667 1.33333L3.33333 1.33336C2.22876 1.33336 1.33333 2.2288 1.33333 3.33336V10C1.33333 11.1047 2.22876 12 3.33333 12H10C10.1769 12 10.3464 12.0703 10.4714 12.1953L13.3333 15.0572V12.6667C13.3333 12.2985 13.6319 12 14 12H16.6667C17.7712 12 18.6667 11.1047 18.6667 10V3.33333C18.6667 2.22876 17.7712 1.33333 16.6667 1.33333ZM3.33332 0L16.6667 0C18.5076 0 20 1.49239 20 3.33333V10C20 11.8409 18.5076 13.3333 16.6667 13.3333H14.6667V16.6667C14.6667 16.9363 14.5043 17.1793 14.2551 17.2825C14.006 17.3857 13.7192 17.3287 13.5285 17.1381L9.72389 13.3333H3.33333C1.49239 13.3333 0 11.8409 0 10V3.33336C0 1.49241 1.49237 0 3.33332 0Z"
        fill="currentColor"
      />
    </svg>
  )
}
