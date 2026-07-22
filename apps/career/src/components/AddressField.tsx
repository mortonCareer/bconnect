/**
 * @figma-pending 주소 입력 필드 — 시안 미정
 */
'use client'

import { mapKakaoAddress } from '@bconnect/config/address'
import {
  AddressSearchDrawer,
  cn,
  fieldItem,
  fieldLabel,
  fieldSlot,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  ROW_INPUT_CLASSES,
  type FieldLayout,
} from '@bconnect/ui'
import type { Address } from '@bconnect/api-client'
import { useState } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

interface AddressFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
  /** 레이아웃 변형. row 는 다른 *Field 와 동일 — 현장주소·상세주소 각각 라벨 좌측 고정폭 row. */
  layout?: FieldLayout
}

/** 주소 검색 트리거 + 선택 도로명 표시 + 상세주소 입력. 폼 값은 Address(위경도 0). */
export function AddressField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  layout = 'stacked',
}: AddressFieldProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value as Address | null
        const setDetail = (detail: string) =>
          field.onChange({ ...(value ?? mapKakaoAddress(null)), detail })

        if (layout === 'row') {
          return (
            <>
              <FormItem className={cn('grid', fieldItem({ layout }))}>
                <FormLabel className={fieldLabel({ layout })}>{label ?? '현장주소'}</FormLabel>
                <FormControl className={fieldSlot({ layout })}>
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={cn(
                      ROW_INPUT_CLASSES,
                      'flex w-full cursor-pointer items-center text-left'
                    )}
                  >
                    {value?.street ?? <span className="text-[#777777]">주소를 검색해주세요</span>}
                  </button>
                </FormControl>
                <FormMessage className={fieldSlot({ layout })} />
              </FormItem>

              <div className={cn('grid', fieldItem({ layout }))}>
                <span className={fieldLabel({ layout })}>상세주소</span>
                <Input
                  value={value?.detail ?? ''}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="상세주소를 입력해주세요"
                  className={cn(ROW_INPUT_CLASSES, fieldSlot({ layout }))}
                />
              </div>

              <AddressSearchDrawer
                open={open}
                onOpenChange={setOpen}
                onComplete={(result) =>
                  field.onChange({ ...mapKakaoAddress(result), detail: value?.detail })
                }
              />
            </>
          )
        }

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
                onChange={(e) => setDetail(e.target.value)}
                placeholder="상세주소를 입력해주세요 (동/호 등)"
              />
            )}

            <FormMessage />

            <AddressSearchDrawer
              open={open}
              onOpenChange={setOpen}
              onComplete={(result) =>
                field.onChange({ ...mapKakaoAddress(result), detail: value?.detail })
              }
            />
          </FormItem>
        )
      }}
    />
  )
}
