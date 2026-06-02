/**
 * @figma-scaffold DS Icons 에 cloud-upload 없음 (#458)
 */
import type { SVGProps } from 'react'

interface UploadCloudIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function UploadCloudIcon({ size = 24, className, ...props }: UploadCloudIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  )
}
