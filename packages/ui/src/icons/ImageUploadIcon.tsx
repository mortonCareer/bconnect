import type { SVGProps } from 'react'

interface ImageUploadIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

/** Figma node 1009-4870 — 이미지 업로드 FAB (사진 + 추가). */
export function ImageUploadIcon({ size = 24, ...props }: ImageUploadIconProps) {
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
        d="M2.66667 24C1.93333 24 1.30556 23.7389 0.783333 23.2167C0.261111 22.6944 0 22.0667 0 21.3333V2.66667C0 1.93333 0.261111 1.30556 0.783333 0.783333C1.30556 0.261111 1.93333 0 2.66667 0H13.3333V2.66667H2.66667V21.3333H21.3333V10.6667H24V21.3333C24 22.0667 23.7389 22.6944 23.2167 23.2167C22.6944 23.7389 22.0667 24 21.3333 24H2.66667ZM4 18.6667H20L15 12L11 17.3333L8 13.3333L4 18.6667ZM18.6667 8V5.33333H16V2.66667H18.6667V0H21.3333V2.66667H24V5.33333H21.3333V8H18.6667Z"
        fill="currentColor"
      />
    </svg>
  )
}
