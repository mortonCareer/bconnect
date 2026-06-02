import type { SVGProps } from 'react'

interface SendIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

// Figma 디자인시스템에 독립 아이콘 컴포넌트로 없음(전송은 채팅 입력 디자인 안에만 존재).
// DS 가 컴포넌트화하기 전까지 packages/ui/src/icons 대신 채팅 로컬에 둔다.
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
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
