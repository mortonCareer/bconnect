/**
 * @figma-scaffold 디자인 시스템 시안 미정 — TextField 미러링 임시 구현. 디자이너 확정 시 갈아끼움.
 */
'use client'

import * as React from 'react'
import { Slot } from 'radix-ui'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import { FIELD_BASE_CLASSES, FIELD_DEFAULT_VARIANT_CLASSES } from '../_field-base'
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '../shadcn/form'

interface TextareaFieldProps<T extends FieldValues> extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'name' | 'onChange' | 'required'
> {
  control: Control<T>
  name: FieldPath<T>
  /** 필드 라벨 (생략 시 라벨 없음) */
  label?: string
  /** 입력 위 설명문 (생략 가능) */
  description?: string
  /** 필수 입력 표시 — 라벨 옆 빨간 별표. 검증은 zod 가 담당. */
  required?: boolean
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
  /** 입력값 변환기 — RHF 에 저장하기 전 가공. */
  transform?: (raw: string) => string
}

/**
 * `TextField` 의 textarea 버전. 같은 aria 합성 로직 (서버 에러 → aria-describedby/invalid).
 * 향후 SelectField 등 추가되어 셋 이상 되면 helper 로 추출.
 */
function TextareaFieldControl({
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
 * react-hook-form + shadcn Form 의 표준 멀티라인 텍스트 필드.
 * 패턴은 `TextField` 와 동일 — 호출부 API 도 동일하게 prop 만 선언.
 *
 * @example
 *   <TextareaField control={form.control} name="content" label="후기" rows={4} required />
 */
export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  serverError,
  transform,
  className,
  rows = 4,
  ...textareaProps
}: TextareaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-3">
          {label && (
            <FormLabel className="text-m-16 text-gray-900">
              {label}
              {required && (
                <span className="ml-0.5 text-destructive" aria-hidden>
                  *
                </span>
              )}
            </FormLabel>
          )}
          {description && (
            <FormDescription className="text-r-14 text-gray-700">{description}</FormDescription>
          )}
          <TextareaFieldControl serverError={serverError}>
            <textarea
              {...field}
              {...textareaProps}
              rows={rows}
              onChange={
                transform ? (e) => field.onChange(transform(e.target.value)) : field.onChange
              }
              className={cn(
                FIELD_BASE_CLASSES,
                FIELD_DEFAULT_VARIANT_CLASSES,
                'flex resize-y',
                className
              )}
            />
          </TextareaFieldControl>
          <FormMessage>{serverError}</FormMessage>
        </FormItem>
      )}
    />
  )
}
