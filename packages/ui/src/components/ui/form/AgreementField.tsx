/**
 * @figma-scaffold DS 에 동의 체크박스 시안 없음 — 회원가입 약관·개인정보 동의(#733) 표준 필드.
 */
'use client'

import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { CheckIcon } from '../../../icons/CheckIcon'
import { ChevronIcon } from '../../../icons/ChevronIcon'
import { cn } from '../../../lib/utils'
import { FormField, FormItem, FormMessage } from '../shadcn/form'

export interface AgreementItem {
  /** RHF 필드 값 객체의 키 */
  key: string
  /** 체크박스 라벨 (예: "[필수] 이용약관 동의") */
  label: string
  /** "보기" 링크 대상. 생략 시 링크 없음 (예: 만 14세 확인). */
  href?: string
}

interface AgreementFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  items: AgreementItem[]
  /** 전체 동의 라벨 */
  allLabel?: string
}

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
        checked
          ? 'border-primary bg-primary text-white'
          : 'border-gray-300 bg-white text-transparent'
      )}
    >
      <CheckIcon size={14} />
    </span>
  )
}

/**
 * 회원가입 약관·개인정보 동의 필드 (#733).
 *
 * 값은 `Record<string, boolean>` (각 항목 key → 동의 여부). 전체 동의는 파생값이라
 * 스키마에 저장하지 않고 UI 에서 모든 항목을 일괄 토글한다. 필수 게이트는 각 앱 스키마의
 * `z.boolean().refine(v => v)` 가 담당하며, 미동의 시 항목별 에러 메시지가 노출된다.
 *
 * "보기" 는 새 탭으로 전문 페이지(/terms·/privacy)를 열어 가입 폼 상태를 잃지 않는다.
 */
export function AgreementField<T extends FieldValues>({
  control,
  name,
  items,
  allLabel = '약관 전체 동의',
}: AgreementFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value: Record<string, boolean> = field.value ?? {}
        const allChecked = items.every((item) => value[item.key])

        const toggleAll = () => {
          field.onChange(Object.fromEntries(items.map((item) => [item.key, !allChecked])))
        }
        const toggleOne = (key: string) => {
          field.onChange({ ...value, [key]: !value[key] })
        }

        const errors = (fieldState.error ?? {}) as Record<string, { message?: string } | undefined>

        return (
          <FormItem className="gap-4 rounded-xl border border-gray-200 p-4">
            <label className="flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="sr-only"
              />
              <CheckMark checked={allChecked} />
              <span className="text-m-16 text-gray-900">{allLabel}</span>
            </label>

            <div className="h-px w-full bg-gray-200" />

            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const checked = !!value[item.key]
                const error = errors[item.key]?.message
                return (
                  <div key={item.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="flex cursor-pointer select-none items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(item.key)}
                          aria-invalid={!!error}
                          className="sr-only"
                        />
                        <CheckMark checked={checked} />
                        <span className="text-r-14 text-gray-700">{item.label}</span>
                      </label>
                      {item.href && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex shrink-0 items-center gap-0.5 text-r-14 text-gray-400 underline underline-offset-2"
                        >
                          보기
                          <ChevronIcon direction="right" size={16} />
                        </a>
                      )}
                    </div>
                    {error && <p className="pl-7 text-r-12 text-destructive">{error}</p>}
                  </div>
                )
              })}
            </div>

            {/* 필드 전역 메시지 슬롯 (항목별 메시지를 쓰므로 통상 비어있음) */}
            <FormMessage className="sr-only" />
          </FormItem>
        )
      }}
    />
  )
}
