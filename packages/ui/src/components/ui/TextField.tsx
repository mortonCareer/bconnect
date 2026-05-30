/**
 * @figma-scaffold shadcn Form 합성 래퍼 — FormField/Item/Label/Control/Message 보일러플레이트 흡수 (#400)
 */
'use client'

import * as React from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '../../lib/utils'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form'
import { Input } from './Input'

interface TextFieldProps<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  'name' | 'onChange'
> {
  control: Control<T>
  name: FieldPath<T>
  /** 필드 라벨 (생략 시 라벨 없음) */
  label?: string
  /** 입력 위 설명문 (생략 가능) */
  description?: string
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
  /** 입력 우측 adornment (OTP 타이머 등) */
  rightElement?: React.ReactNode
  /** 입력값 변환기 — RHF 에 저장하기 전 가공 (전화번호 포맷팅 등) */
  transform?: (raw: string) => string
}

/**
 * react-hook-form + shadcn Form 의 표준 텍스트 필드.
 *
 * `FormField`/`FormItem`/`FormLabel`/`FormDescription`/`FormControl`/`Input`/
 * `FormMessage` 조합과, 클라이언트(zod)·서버 에러를 한 슬롯에 합성하는 배선
 * (`aria-invalid` OR + `FormMessage` children) 을 한 컴포넌트로 흡수한다. 호출부는
 * raw `FormField` render-prop 없이 prop 만 선언한다.
 *
 * 서버 에러는 `useServerError` 의 `fieldError(name)` 결과를 `serverError` 로 넘긴다.
 * 표준·레시피: docs/how-to/frontend-forms.md, 근거: ADR 0013.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
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
      render={({ field }) => (
        <FormItem className="gap-3">
          {label && <FormLabel className="text-m-16 text-bconnect-gray-900">{label}</FormLabel>}
          {description && (
            <FormDescription className="text-r-14 text-bconnect-gray-700">
              {description}
            </FormDescription>
          )}
          <div className="relative">
            <FormControl serverError={serverError}>
              <Input
                {...field}
                {...inputProps}
                onChange={
                  transform ? (e) => field.onChange(transform(e.target.value)) : field.onChange
                }
                className={cn(rightElement && 'pr-28', className)}
              />
            </FormControl>
            {rightElement && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
            )}
          </div>
          <FormMessage>{serverError}</FormMessage>
        </FormItem>
      )}
    />
  )
}
