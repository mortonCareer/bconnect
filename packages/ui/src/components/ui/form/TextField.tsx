/**
 * @figma-scaffold shadcn Form 합성 래퍼 — FormField/Item/Label/Control/Message 보일러플레이트 흡수 (#400)
 */
'use client'

import * as React from 'react'
import { Slot } from 'radix-ui'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '../shadcn/form'
import { Input } from '../Input'

interface TextFieldProps<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  'name' | 'onChange' | 'required'
> {
  control: Control<T>
  name: FieldPath<T>
  /** 필드 라벨 (생략 시 라벨 없음) */
  label?: string
  /** 입력 위 설명문 (생략 가능) */
  description?: string
  /** 입력 아래 보조 텍스트 — 에러(zod ∪ serverError) 발생 시 에러 메시지가 대체 */
  hint?: string
  /** 필수 입력 표시 — 라벨 옆 빨간 별표. 검증은 zod 가 담당, native required 는 발동 안 함. */
  required?: boolean
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
  /** 입력 우측 adornment (OTP 타이머 등) */
  rightElement?: React.ReactNode
  /** 입력값 변환기 — RHF 에 저장하기 전 가공 (전화번호 포맷팅 등) */
  transform?: (raw: string) => string
}

/**
 * shadcn 의 `FormControl` 을 우리 슬롯으로 갈음한다 — `aria-invalid`/`aria-describedby`
 * 를 zod 에러 OR 서버 에러로 합성한다. shadcn 원본 `FormControl` 은 zod 만 보므로,
 * 서버 에러만 있을 때 스크린리더가 `<FormMessage>` 를 안내하지 못하는 갭을 메운다
 * (WCAG 1.3.1). shadcn primitive 는 vanilla 유지 — 우리 wrapper 에서 책임.
 */
function TextFieldControl({
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
 * react-hook-form + shadcn Form 의 표준 텍스트 필드.
 *
 * `FormField`/`FormItem`/`FormLabel`/`FormDescription`/`Input`/`FormMessage` 조합과,
 * 클라이언트(zod)·서버 에러를 한 슬롯에 합성하는 배선을 한 컴포넌트로 흡수한다.
 * 호출부는 raw `FormField` render-prop 없이 prop 만 선언한다.
 *
 * 서버 에러는 `useServerError` 의 `fieldError(name)` 결과를 `serverError` 로 넘긴다.
 * 표준·레시피: docs/how-to/frontend-forms.md, 근거: ADR 0013.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  hint,
  required,
  serverError,
  rightElement,
  transform,
  className,
  ...inputProps
}: TextFieldProps<T>) {
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
              <FormDescription className="text-r-14 text-gray-700">{description}</FormDescription>
            )}
            <div className="relative">
              <TextFieldControl serverError={serverError}>
                <Input
                  {...field}
                  {...inputProps}
                  onChange={
                    transform ? (e) => field.onChange(transform(e.target.value)) : field.onChange
                  }
                  className={cn(rightElement && 'pr-28', className)}
                />
              </TextFieldControl>
              {rightElement && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
              )}
            </div>
            <FormMessage>{serverError}</FormMessage>
            {hint && !hasError && <p className="text-r-14 text-gray-500">{hint}</p>}
          </FormItem>
        )
      }}
    />
  )
}
