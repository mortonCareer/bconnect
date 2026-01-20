import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-semibold leading-[1.6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[#386DFF] text-white hover:bg-[#2858E0] focus-visible:ring-[#386DFF] disabled:bg-[#F4F4F4] disabled:text-[#9C9C9C]',
        outline:
          'border border-[#386DFF] text-[#386DFF] hover:bg-[#386DFF]/10 focus-visible:ring-[#386DFF] disabled:border-transparent disabled:bg-[#F4F4F4] disabled:text-[#9C9C9C]',
        ghost:
          'text-[#386DFF] hover:bg-[#386DFF]/10 focus-visible:ring-[#386DFF] disabled:text-[#9C9C9C]',
        destructive:
          'bg-[#FF4242] text-white hover:bg-[#E63B3B] focus-visible:ring-[#FF4242] disabled:bg-[#F4F4F4] disabled:text-[#9C9C9C]',
      },
      size: {
        default: 'h-[50px] px-4',
        sm: 'h-9 px-3',
        lg: 'h-14 px-6',
        full: 'h-[50px] w-full px-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * Loading state - shows loading text when true
   */
  isLoading?: boolean
  /**
   * Loading text to display
   */
  loadingText?: string
}

/**
 * 버튼 컴포넌트
 * Morton 디자인 시스템 기반
 */
function Button({
  className,
  variant,
  size,
  isLoading,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && loadingText ? loadingText : children}
    </button>
  )
}

export { Button, buttonVariants }
