/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1879-13379
 */
'use client'

import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '../../../lib/utils'
import { FilterChip } from '../FilterChip'
import { Select, type SelectOption } from '../Select'
import { FormField, FormItem, FormLabel, FormMessage, useFormField } from '../shadcn/form'
import { fieldItem, fieldLabel, fieldSlot, type FieldLayout } from './_layout'

interface TagSelectFieldProps<T extends FieldValues> {
  control: Control<T>
  /** string[] 값 필드 */
  name: FieldPath<T>
  options: SelectOption[]
  /** 필드 라벨 (생략 시 라벨 없음) */
  label?: string
  /** 추가 트리거 placeholder (기본 "선택") */
  placeholder?: string
  /** 필수 입력 표시 — 라벨 옆 빨간 별표. 검증은 zod 가 담당. */
  required?: boolean
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
  disabled?: boolean
  /** 레이아웃 변형 — row 는 패널형 수평(라벨 좌측 고정폭 + 하단 구분선, #581). 기본 stacked. */
  layout?: FieldLayout
}

type RHFTagsFieldArg = {
  value: string[] | undefined
  onChange: (v: string[]) => void
  onBlur: () => void
}

/** useFormField 로 aria id 합성 후 Select(multiple) 에 주입 — SelectField 의 동일 패턴. */
function TagSelectControl({
  field,
  serverError,
  options,
  placeholder,
  disabled,
}: {
  field: RHFTagsFieldArg
  serverError?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const invalid = !!error || !!serverError
  return (
    <Select
      multiple
      options={options}
      value={field.value ?? []}
      onChange={(v) => field.onChange(Array.isArray(v) ? v : [v])}
      onBlur={field.onBlur}
      placeholder={placeholder ?? '선택'}
      disabled={disabled}
      fitContent
      invalid={invalid}
      triggerId={formItemId}
      describedBy={invalid ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`}
    />
  )
}

/**
 * 멀티 선택 + 선택값 x 칩 필드 (#581, 공종 등). 선택은 Select(multiple) 드롭다운,
 * 선택값은 FilterChip 으로 나열하고 칩 클릭으로 제거한다.
 */
export function TagSelectField<T extends FieldValues>({
  control,
  name,
  options,
  label,
  placeholder,
  required,
  serverError,
  disabled,
  layout = 'stacked',
}: TagSelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const values: string[] = Array.isArray(field.value) ? field.value : []
        const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v
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
            <div className={cn('flex flex-wrap items-center gap-1.5', fieldSlot({ layout }))}>
              {values.map((v) => (
                <FilterChip
                  key={v}
                  label={labelOf(v)}
                  onRemove={() => field.onChange(values.filter((x) => x !== v))}
                  className="bg-[#f4f4f4] text-[#7b7b7b]"
                />
              ))}
              <TagSelectControl
                field={field as unknown as RHFTagsFieldArg}
                serverError={serverError}
                options={options}
                placeholder={placeholder}
                disabled={disabled}
              />
            </div>
            <FormMessage className={fieldSlot({ layout })}>{serverError}</FormMessage>
          </FormItem>
        )
      }}
    />
  )
}
