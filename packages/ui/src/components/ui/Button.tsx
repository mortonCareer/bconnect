/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=187-607
 */
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * 버튼 variants:
 * - primary: 파란색 배경, 흰색 텍스트 (활성)
 * - secondary: 회색 배경, 회색 텍스트 (비활성)
 * - outline: 파란색 테두리, 파란색 텍스트 (활성_stroke)
 * - ghost: 회색 테두리, 회색 텍스트 (비활성_stroke)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:font-medium cursor-pointer active:scale-[0.98]',
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
        // 파괴적 - 빨강 테두리 (삭제 등)
        destructive:
          'border border-destructive bg-transparent text-destructive font-semibold hover:bg-destructive/10',
        // 텍스트형 - 테두리·채움 없음, 호버 bg (다이얼로그 액션 등)
        text: 'bg-transparent text-gray-700 hover:bg-gray-100',
      },
      size: {
        // default: 360x50
        default: 'h-[50px] w-90 px-4',
        // sm: 206x40
        sm: 'h-10 w-[206px] px-3',
        // small: h-28, 콘텐츠폭 — 행/카드 인라인 액션 (취소/삭제 등)
        small: 'h-7 rounded-md px-3 text-r-12',
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
  ({ className, variant, size, children, isLoading, disabled, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    // 단일 child 표현 필수 — asChild(Slot) 가 React.Children.only 강제.
    // 다중 sibling (`{isLoading && X}{children}`) 은 isLoading=false 라도 children prop 이
    // [false, child] 배열이 돼 Slot 사용처 (LoginPromptModal 등) prerender 가 깨진다.
    const content = isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        {children}
      </>
    ) : (
      children
    )
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
