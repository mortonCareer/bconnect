import { type ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 스타일 변형 */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean
}

/**
 * Button 컴포넌트
 *
 * @example
 * ```tsx
 * import { Button } from '@morton/ui'
 *
 * <Button variant="primary" size="md">확인</Button>
 * <Button variant="secondary">취소</Button>
 * <Button variant="ghost" size="sm">더보기</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 active:bg-red-700',
      secondary:
        'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:ring-indigo-400 active:bg-indigo-300',
      ghost: 'bg-transparent text-red-500 hover:bg-red-50 focus:ring-red-400',
    }

    const sizeStyles = {
      sm: 'h-[30px] px-3 text-sm',
      md: 'h-[40px] px-4 text-base',
      lg: 'h-[50px] px-6 text-lg',
    }

    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
