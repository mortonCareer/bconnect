/**
 * @figma-pending 주소 입력 필드 — 시안 미정
 */
'use client'

import { mapKakaoAddress } from '@bconnect/config/address'
import {
  AddressSearchSheet,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@bconnect/ui'
import type { Address } from '@bconnect/api-client'
import { useState } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

interface AddressFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
  required?: boolean
}

/** 주소 검색 트리거 + 선택 도로명 표시 + 상세주소 입력. 폼 값은 Address(위경도 0). */
export function AddressField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
}: AddressFieldProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = field.value as Address | null
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

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-12 w-full items-center rounded-lg border border-gray-300 px-3 text-left text-sm text-gray-700 data-[invalid=true]:border-destructive"
              data-invalid={!!fieldState.error}
            >
              {value?.street ?? <span className="text-gray-400">주소를 검색해주세요</span>}
            </button>

            {value && (
              <Input
                value={value.detail ?? ''}
                onChange={(e) => field.onChange({ ...value, detail: e.target.value })}
                placeholder="상세주소를 입력해주세요 (동/호 등)"
              />
            )}

            <FormMessage />

            <AddressSearchSheet
              open={open}
              onOpenChange={setOpen}
              onComplete={(result) =>
                field.onChange({ ...mapKakaoAddress(result), detail: value?.detail ?? null })
              }
            />
          </FormItem>
        )
      }}
    />
  )
}
