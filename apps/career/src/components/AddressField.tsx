/**
 * @figma-pending 주소 입력 필드 — 시안 미정
 */
'use client'

import { mapKakaoAddress } from '@bconnect/config/address'
import {
  AddressSearchSheet,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@bconnect/ui'
import type { Address } from '@bconnect/api-client'
import { useState } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

interface AddressFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
}

/** 주소 검색 트리거 + 선택 도로명 표시 + 상세주소 입력. 폼 값은 Address(위경도 0). */
export function AddressField<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: AddressFieldProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value as Address | null
        return (
          <FormItem className="gap-3">
            {label && <FormLabel className="text-m-16 text-gray-900">{label}</FormLabel>}
            {description && (
              <FormDescription className="text-r-14 text-gray-500">{description}</FormDescription>
            )}

            <FormControl>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-12 w-full cursor-pointer items-center rounded-lg border border-gray-300 px-3 text-left text-sm text-gray-700 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/50"
              >
                {value?.street ?? <span className="text-gray-400">주소를 검색해주세요</span>}
              </button>
            </FormControl>

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
