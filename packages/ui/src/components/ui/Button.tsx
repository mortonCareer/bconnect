/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=187-607
 */
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
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
  'inline-flex items-center justify-center rounded-[8px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        // 활성 - 파란색 배경
        primary: 'bg-primary text-white font-semibold hover:bg-primary-600',
        // 비활성 - 회색 배경
        secondary: 'bg-gray-100 text-gray-500 font-medium',
        // 활성_stroke - 파란색 테두리
        outline:
          'border border-primary bg-transparent text-primary font-semibold hover:bg-primary/10',
        // 비활성_stroke - 회색 테두리
        ghost: 'border border-gray-500 bg-transparent text-gray-500 font-medium',
      },
      size: {
        // default: 360x50
        default: 'h-[50px] w-[360px] px-4',
        // small: 206x40
        sm: 'h-[40px] w-[206px] px-3',
        // full width
        full: 'h-[50px] w-full px-4',
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
  asChild?: boolean
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
 *
 * // 링크로 동작 (semantic <a href>) — asChild 로 자식 <Link> 에 스타일 합성
 * <Button asChild variant="primary">
 *   <Link href="/login">로그인</Link>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      isLoading,
      loadingText,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? loadingText || '로딩 중...' : children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
