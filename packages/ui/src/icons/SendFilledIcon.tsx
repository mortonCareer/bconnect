/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=407-3017
 */
import type { SVGProps } from 'react'

interface SendFilledIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

/**
 * 채팅 전송 버튼용 채워진 종이비행기 (Figma `24/send_g0`).
 * 아웃라인 `SendIcon` 과 별개 glyph — 서로 대체 불가.
 */
export function SendFilledIcon({ size = 24, ...props }: SendFilledIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* glyph 는 24 박스 안에서 비대칭 배치 (Figma inset top 3.6744 / left 2.7192) — translate 로 재현 */}
      <g transform="translate(2.7192 3.6744)">
        <path
          d="M17.5158 2.01275C17.9478 0.81775 16.7898 -0.34025 15.5948 0.0927503L0.989804 5.37475C-0.209196 5.80875 -0.354196 7.44475 0.748804 8.08375L5.4108 10.7828L9.5738 6.61975C9.76241 6.43759 10.015 6.3368 10.2772 6.33908C10.5394 6.34135 10.7902 6.44652 10.9756 6.63193C11.161 6.81734 11.2662 7.06815 11.2685 7.33035C11.2708 7.59255 11.17 7.84515 10.9878 8.03375L6.8248 12.1968L9.5248 16.8587C10.1628 17.9617 11.7988 17.8158 12.2328 16.6178L17.5158 2.01275Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
