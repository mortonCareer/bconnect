/**
 * @figma-scaffold 파일 업로드 primitive — ImageInput 의 문서 버전(썸네일 대신 파일명 칩). 인증 신청 파일 첨부 (#586)
 */
'use client'

import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { XIcon } from '../../icons/XIcon'

export type FileValue = File | string

export interface FileInputProps {
  value: FileValue | FileValue[] | null
  onChange: (value: FileValue | FileValue[] | null) => void
  /** 다중 선택 — value 가 FileValue[] 가 된다 */
  multiple?: boolean
  /** 다중일 때 최대 개수 (기본 5) */
  maxFiles?: number
  /** 개당 최대 용량 MB (기본 10) */
  maxSizeMB?: number
  /** input accept (기본 이미지 + PDF) */
  accept?: string
  /** 비어있을 때 트리거 버튼 라벨 (기본 "파일 업로드") */
  label?: string
  disabled?: boolean
  className?: string
  // ↓ 폼 래퍼(FileField)가 aria 합성용으로 주입. 제어로 직접 쓸 때는 불필요.
  invalid?: boolean
  inputId?: string
  describedBy?: string
  onBlur?: () => void
  fieldRef?: React.Ref<HTMLButtonElement>
}

const toItems = (value: FileInputProps['value']): FileValue[] =>
  value == null ? [] : Array.isArray(value) ? value : [value]

const nameOf = (it: FileValue): string =>
  it instanceof File ? it.name : decodeURIComponent(it.split('/').pop() ?? it)

const sizeOf = (it: FileValue): string | null => {
  if (!(it instanceof File)) return null
  const { size } = it
  if (size < 1024) return `${size}B`
  const kb = size / 1024
  return kb < 1024 ? `${Math.round(kb)}KB` : `${(kb / 1024).toFixed(1)}MB`
}

/**
 * 제어 파일 입력 primitive (single/multi). 파일 선택 + 파일명 칩 + 삭제 + 빈상태(outline 트리거).
 *
 * ImageInput 과 같은 계약: 실제 업로드는 하지 않는다 — 고른 File 을 value 로 보유하고, 업로드는
 * 호출부(폼 제출)가 담당한다. presign 흐름(#340) 확정 시 제출 시점에 File → URL 변환만 끼운다.
 * 폼은 `FileField` 로 감싸고, 제어 상태는 이 컴포넌트를 직접 쓴다.
 */
export function FileInput({
  value,
  onChange,
  multiple,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = 'image/*,application/pdf',
  label = '파일 업로드',
  disabled,
  className,
  invalid,
  inputId,
  describedBy,
  onBlur,
  fieldRef,
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const items = toItems(value)

  const openPicker = () => fileInputRef.current?.click()

  const addFiles = (picked: File[]) => {
    if (picked.length === 0) return
    const maxBytes = maxSizeMB * 1024 * 1024
    const accepted = picked.filter((f) => f.size <= maxBytes)
    setLocalError(
      accepted.length < picked.length ? `개당 ${maxSizeMB}MB 이하만 첨부할 수 있어요.` : null
    )
    if (accepted.length === 0) return
    onChange(multiple ? [...items, ...accepted].slice(0, maxFiles) : accepted[0])
  }

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    addFiles(picked)
  }

  const removeAt = (index: number) => {
    onChange(multiple ? items.filter((_, i) => i !== index) : null)
    setLocalError(null)
  }

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      onChange={handlePick}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
    />
  )

  const canAddMore = multiple ? items.length < maxFiles : items.length === 0

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      {hiddenInput}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2.5',
                invalid && 'border-destructive'
              )}
            >
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-r-14 text-gray-900">{nameOf(it)}</span>
                {sizeOf(it) && (
                  <span className="shrink-0 text-r-12 text-gray-500">{sizeOf(it)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label={`${nameOf(it)} 삭제`}
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 outline-none transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAddMore && (
        <button
          ref={fieldRef}
          type="button"
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onBlur={onBlur}
          onClick={openPicker}
          disabled={disabled}
          className={cn(
            'inline-flex h-[50px] w-full cursor-pointer items-center justify-center rounded-lg border border-primary bg-transparent text-sm font-semibold text-primary outline-none transition-all hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-gray-100 disabled:text-gray-400',
            invalid && 'border-destructive text-destructive'
          )}
        >
          {items.length > 0 ? '파일 추가' : label}
        </button>
      )}

      {localError && (
        <p role="alert" className="text-r-12 text-destructive">
          {localError}
        </p>
      )}
    </div>
  )
}
