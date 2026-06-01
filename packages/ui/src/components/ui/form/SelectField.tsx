/**
 * @figma-scaffold shadcn Select 합성 래퍼 — FormField/Trigger/aria 배선 흡수 (#426)
 */
'use client'

import * as React from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select'

export interface SelectFieldOption {
  value: string
  label: string
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  /** 드롭다운 항목 — value 는 RHF 에 저장될 값, label 은 표시 텍스트 */
  options: SelectFieldOption[]
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
  /** 선택 전 placeholder 텍스트 */
  placeholder?: string
  disabled?: boolean
  /** SelectTrigger 너비 등 override (기본은 FIELD_BASE 의 w-full) */
  className?: string
}

/**
 * radix `SelectTrigger` 에 `aria-invalid`/`aria-describedby` 를 zod 에러 OR 서버
 * 에러로 합성한다. TextField 의 `TextFieldControl` 과 동일한 갭(서버 에러만 있을 때
 * 스크린리더가 `<FormMessage>` 를 안내하지 못함, WCAG 1.3.1)을 메운다.
 */
function SelectFieldTrigger({
  serverError,
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectTrigger> & { serverError?: string }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const invalid = !!error || !!serverError

  return (
    <SelectTrigger
      id={formItemId}
      aria-describedby={!invalid ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={invalid}
      className={cn(FIELD_BASE_CLASSES, FIELD_DEFAULT_VARIANT_CLASSES, className)}
      {...props}
    >
      {children}
    </SelectTrigger>
  )
}

/**
 * react-hook-form + shadcn Select 의 표준 단일 선택 필드.
 *
 * TextField 와 동형 API(control/name/label/serverError/hint)에 `options`/`placeholder`
 * 를 더한 래퍼. 기존 raw `<select>` (career signup/profile · profile/edit 대표분야)를
 * 흡수한다. 스타일은 `_field-base.ts` 의 FIELD_BASE 를 TextField 와 공유한다.
 *
 * 표준·레시피: docs/how-to/frontend-forms.md, 근거: ADR 0013.
 */
export function SelectField<T extends FieldValues>({
  control,
  name,
  options,
  label,
  description,
  hint,
  required,
  serverError,
  placeholder,
  disabled,
  className,
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!serverError
        return (
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
              <FormDescription className="text-r-14 text-gray-500">{description}</FormDescription>
            )}
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectFieldTrigger
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                serverError={serverError}
                className={className}
              >
                <SelectValue placeholder={placeholder} />
              </SelectFieldTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{serverError}</FormMessage>
            {hint && !hasError && <p className="text-r-14 text-gray-500">{hint}</p>}
          </FormItem>
        )
      }}
    />
  )
}
