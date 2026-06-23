/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=189-626
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import {
  FIELD_BASE_CLASSES,
  FIELD_DEFAULT_VARIANT_CLASSES,
  FIELD_ERROR_VARIANT_CLASSES,
} from './_field-base'

/**
 * Input variants:
 * - variant: default(회색 테두리) / error(빨간 테두리)
 * - size: default(h-50, text-base) / small(h-33, text-14) — 패널 row 필드(작업기간 등)용
 *
 * Figma: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=189-626
 *        size=small https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1879-13366
 */
const inputVariants = cva(`${FIELD_BASE_CLASSES} flex items-center`, {
  variants: {
    variant: {
      // 기본 상태 — 회색 보더 + primary 포커스
      default: FIELD_DEFAULT_VARIANT_CLASSES,
      // 에러 상태 — destructive 보더·포커스
      error: FIELD_ERROR_VARIANT_CLASSES,
    },
    size: {
      default: 'h-[50px]',
      // 컴팩트 — FIELD_BASE 의 py-[7px]/text-base 를 덮어 Figma 33px 박스에 맞춘다
      small: 'h-[33px] py-0 text-r-14',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** 에러 메시지 (variant="error"일 때 하단에 표시) */
  errorMessage?: string
}

/**
 * Input 컴포넌트 (Morton 디자인 시스템)
 *
 * @example
 * ```tsx
 * // 기본 입력
 * <Input placeholder="내용을 입력해주세요" />
 *
 * // 에러 상태
 * <Input variant="error" placeholder="이메일을 입력해주세요" />
 *
 * // 에러 상태 + 에러 메시지
 * <Input variant="error" errorMessage="올바르지 않은 인증번호입니다." />
 *
 * // 비활성화
 * <Input disabled placeholder="비활성화됨" />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, errorMessage, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(inputVariants({ variant, size, className }))}
        {...props}
      />
    )

    // 에러 메시지가 있으면 wrapper로 감싸서 메시지 표시
    if (errorMessage) {
      return (
        <div className="flex w-full flex-col items-start gap-2">
          {inputElement}
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )
    }

    return inputElement
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
