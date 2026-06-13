/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1879-13362
 */
'use client'

import * as React from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import { Input } from '../Input'
import { FormField } from '../shadcn/form'
import { fieldItem, fieldLabel, fieldSlot, type FieldLayout } from './_layout'

interface DateRangeFieldProps<T extends FieldValues> {
  control: Control<T>
  /** 시작일 필드명 — 종료일과 별개 RHF 필드. start>end 류 교차 검증은 zod refine 이 담당. */
  startName: FieldPath<T>
  endName: FieldPath<T>
  /** 필드 라벨 (생략 시 라벨 없음) */
  label?: string
  /** 필수 입력 표시 — 라벨 옆 빨간 별표. 검증은 zod 가 담당. */
  required?: boolean
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
  disabled?: boolean
  /** 레이아웃 변형 — row 는 패널형 수평(라벨 좌측 고정폭 + 하단 구분선, #581). 기본 stacked. */
  layout?: FieldLayout
}

/**
 * 시작일 ~ 종료일 범위 입력 (#581). RHF 필드 2개(startName/endName)를 한 행에 합성한다.
 * 두 필드가 한 시각 단위라 `*Field` 의 단일 FormItem 모델에 안 맞아 aria 를 직접 배선
 * (label→시작일 htmlFor, 종료일은 aria-label, 에러는 aria-describedby).
 */
export function DateRangeField<T extends FieldValues>({
  control,
  startName,
  endName,
  label,
  required,
  serverError,
  disabled,
  layout = 'stacked',
}: DateRangeFieldProps<T>) {
  const baseId = React.useId()
  const startId = `${baseId}-start`
  const messageId = `${baseId}-message`

  return (
    <FormField
      control={control}
      name={startName}
      render={({ field: startField, fieldState: startState }) => (
        <FormField
          control={control}
          name={endName}
          render={({ field: endField, fieldState: endState }) => {
            const errorMessage = startState.error?.message ?? endState.error?.message ?? serverError
            const invalid = !!errorMessage

            return (
              <div className={cn('grid', fieldItem({ layout }))}>
                {label && (
                  <label htmlFor={startId} className={fieldLabel({ layout })}>
                    {label}
                    {required && (
                      <span className="ml-0.5 text-destructive" aria-hidden>
                        *
                      </span>
                    )}
                  </label>
                )}
                <div className={cn('flex items-center gap-2', fieldSlot({ layout }))}>
                  <Input
                    {...startField}
                    id={startId}
                    type="date"
                    size="small"
                    disabled={disabled}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? messageId : undefined}
                  />
                  <span aria-hidden className="shrink-0 text-r-14 text-gray-900">
                    ~
                  </span>
                  <Input
                    {...endField}
                    type="date"
                    size="small"
                    disabled={disabled}
                    aria-label={label ? `${label} 종료일` : '종료일'}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? messageId : undefined}
                  />
                </div>
                {errorMessage && (
                  <p
                    id={messageId}
                    className={cn('text-r-14 text-destructive', fieldSlot({ layout }))}
                  >
                    {errorMessage}
                  </p>
                )}
              </div>
            )
          }}
        />
      )}
    />
  )
}
