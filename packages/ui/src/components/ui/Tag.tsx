import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { XIcon } from '../../icons/XIcon'

/**
 * Tag variants:
 * - default (기본): 회색 테두리, 회색 텍스트
 * - selected (선택): 파란색 배경/테두리, 파란색 텍스트
 * - filter (필터 삭제): 파란색 배경/테두리 + X 아이콘
 */
const tagVariants = cva(
  'inline-flex items-center justify-center rounded-lg border text-sm leading-[1.6] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#386DFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-pointer active:scale-[0.98] font-[Pretendard_Variable]',
  {
    variants: {
      variant: {
        // 기본 - 회색 테두리
        default:
          'border-[#E5E5E5] bg-transparent text-[#A5A5A5] font-medium hover:border-[#C5C5C5]',
        // 선택 - 파란색 배경/테두리
        selected: 'border-[#386DFF] bg-[#EAEFFF] text-[#386DFF] font-semibold',
        // 필터 삭제 - 파란색 배경/테두리 + X 아이콘
        filter: 'border-[#386DFF] bg-[#EAEFFF] text-[#386DFF] font-semibold gap-1',
      },
      size: {
        // default: h-40px, px-14px
        default: 'h-[40px] px-[14px] py-[3px]',
        // small
        sm: 'h-[32px] px-[10px] py-[2px] text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface TagProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof tagVariants> {
  children?: React.ReactNode
  onRemove?: () => void
}

/**
 * Tag 컴포넌트 (Morton 디자인 시스템)
 *
 * Figma: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=188-1010
 *
 * @example
 * ```tsx
 * // 기본 (Default)
 * <Tag>도배</Tag>
 *
 * // 선택됨 (Selected)
 * <Tag variant="selected">도배</Tag>
 *
 * // 필터 삭제 (Filter with X icon)
 * <Tag variant="filter" onRemove={() => console.log('removed')}>도배</Tag>
 * ```
 */
const Tag = React.forwardRef<HTMLButtonElement, TagProps>(
  ({ className, variant, size, children, onRemove, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === 'filter' && onRemove) {
        onRemove()
      }
      onClick?.(e)
    }

    return (
      <button
        type="button"
        className={cn(tagVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {children}
        {variant === 'filter' && <XIcon size={16} className="shrink-0" />}
      </button>
    )
  }
)
Tag.displayName = 'Tag'

export { Tag, tagVariants }
