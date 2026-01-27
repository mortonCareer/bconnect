import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

/**
 * 버튼 variants:
 * - primary: 파란색 배경, 흰색 텍스트 (활성)
 * - secondary: 회색 배경, 회색 텍스트 (비활성)
 * - outline: 파란색 테두리, 파란색 텍스트 (활성_stroke)
 * - ghost: 회색 테두리, 회색 텍스트 (비활성_stroke)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium leading-[1.6] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#386DFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer active:scale-[0.98] font-[Pretendard_Variable]',
  {
    variants: {
      variant: {
        // 활성 - 파란색 배경
        primary: 'bg-[#386DFF] text-white font-semibold hover:bg-[#2858E0]',
        // 비활성 - 회색 배경
        secondary: 'bg-[#F4F4F4] text-[#A5A5A5] font-medium',
        // 활성_stroke - 파란색 테두리
        outline:
          'border border-[#386DFF] bg-transparent text-[#386DFF] font-semibold hover:bg-[#386DFF]/10',
        // 비활성_stroke - 회색 테두리
        ghost: 'border border-[#A5A5A5] bg-transparent text-[#A5A5A5] font-medium',
      },
      size: {
        // default: 360x50
        default: 'h-button-default w-button-default px-4',
        // small: 206x40
        sm: 'h-button-sm w-button-sm px-3',
        // full width
        full: 'h-button-default w-full px-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children?: React.ReactNode
  isLoading?: boolean
  loadingText?: string
}

/**
 * 버튼 컴포넌트 (Morton 디자인 시스템)
 *
 * @example
 * ```tsx
 * // Primary (활성)
 * <Button variant="primary">다음</Button>
 *
 * // Secondary (비활성)
 * <Button variant="secondary">다음</Button>
 *
 * // Outline (활성_stroke)
 * <Button variant="outline">다음</Button>
 *
 * // Ghost (비활성_stroke)
 * <Button variant="ghost">다음</Button>
 *
 * // Small size
 * <Button size="sm">다음</Button>
 *
 * // Full width
 * <Button size="full">다음</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, isLoading, loadingText, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? loadingText || '로딩 중...' : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
