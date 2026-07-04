/**
 * @figma-scaffold 디자인 시안 미정 — TextField 미러링, 정수 값 필드 (#684)
 */
'use client'

import { Slot } from 'radix-ui'
import * as React from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import { Input } from '../Input'
import { fieldItem, fieldLabel, fieldSlot, ROW_INPUT_CLASSES, type FieldLayout } from './_layout'
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '../shadcn/form'

interface NumberFieldProps<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  'name' | 'onChange' | 'required' | 'value' | 'type'
> {
  control: Control<T>
  name: FieldPath<T>
  /** 필드 라벨 (생략 시 라벨 없음) */
  label?: string
  /** 입력 위 설명문 (생략 가능) */
  description?: string
  /** 입력 아래 보조 텍스트 — 에러(zod ∪ serverError) 발생 시 에러 메시지가 대체 */
  hint?: string
  /** 필수 입력 표시 — 라벨 옆 빨간 별표. 검증은 zod 가 담당. */
  required?: boolean
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
  /** 레이아웃 변형 — row 는 패널형 수평(라벨 좌측 고정폭 + 하단 구분선, #581). 기본 stacked. */
  layout?: FieldLayout
}

/** TextField 와 동일한 aria 합성 (서버 에러 → aria-describedby/invalid). */
function NumberFieldControl({
  serverError,
  ...props
}: React.ComponentProps<typeof Slot.Root> & { serverError?: string }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const invalid = !!error || !!serverError

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!invalid ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={invalid}
      {...props}
    />
  )
}

/**
 * 정수 값 입력용 필드. `TextField` 와 API 는 동일(prop 만 선언)하되 RHF 에 **number** 를 저장한다.
 *
 * `type="number"` 의 스피너·휠 스크롤·`valueAsNumber` quirk 를 피하려고 `type="text"` +
 * `inputMode="numeric"` + 숫자만 필터링으로 구현한다 (프로젝트 숫자 입력 컨벤션과 동일).
 * 빈 입력은 `undefined` 로 저장 — zod `z.number()` 가 required 를 자연스럽게 검증.
 *
 * @example
 *   <NumberField control={control} name="experience" label="경력" required maxLength={2} />
 */
export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  hint,
  required,
  serverError,
  className,
  inputMode = 'numeric',
  layout = 'stacked',
  ...inputProps
}: NumberFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!serverError
        return (
          <FormItem className={fieldItem({ layout })}>
            {label && (
              <FormLabel className={fieldLabel({ layout })}>
                {label}
                {required && (
                  <span className="ml-0.5 text-destructive" aria-hidden>
                    *
                  </span>
                )}
              </FormLabel>
            )}
            {description && (
              <FormDescription className={cn('text-r-14 text-gray-500', fieldSlot({ layout }))}>
                {description}
              </FormDescription>
            )}
            <NumberFieldControl serverError={serverError}>
              <Input
                {...field}
                {...inputProps}
                type="text"
                inputMode={inputMode}
                value={field.value ?? ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '')
                  field.onChange(digits === '' ? undefined : Number(digits))
                }}
                className={cn(
                  layout === 'row' && ROW_INPUT_CLASSES,
                  fieldSlot({ layout }),
                  className
                )}
              />
            </NumberFieldControl>
            <FormMessage className={fieldSlot({ layout })}>{serverError}</FormMessage>
            {hint && !hasError && (
              <p className={cn('text-r-14 text-gray-500', fieldSlot({ layout }))}>{hint}</p>
            )}
          </FormItem>
        )
      }}
    />
  )
}
