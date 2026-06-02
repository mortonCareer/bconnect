/**
 * @figma-scaffold 이미지 영역 시안이 placeholder("이미지" 텍스트)만 — 업로드/미리보기/빈상태 UX 신규 (#424)
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { ImageIcon } from '../../icons'
import { XIcon } from '../../icons/XIcon'

export type ImageValue = File | string

export interface ImageInputProps {
  value: ImageValue | ImageValue[] | null
  onChange: (value: ImageValue | ImageValue[] | null) => void
  /** 다중 선택 — value 가 ImageValue[] 가 된다 */
  multiple?: boolean
  /** 다중일 때 최대 장수 (기본 10) */
  maxFiles?: number
  /** 장당 최대 용량 MB (기본 5) */
  maxSizeMB?: number
  /** input accept (기본 image/*) */
  accept?: string
  disabled?: boolean
  className?: string
  // ↓ 폼 래퍼(ImageField)가 aria 합성용으로 주입. 제어로 직접 쓸 때는 불필요.
  invalid?: boolean
  inputId?: string
  describedBy?: string
  onBlur?: () => void
  fieldRef?: React.Ref<HTMLButtonElement>
}

const toItems = (value: ImageInputProps['value']): ImageValue[] =>
  value == null ? [] : Array.isArray(value) ? value : [value]

const TRIGGER_BASE =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-500 outline-none transition-colors enabled:hover:bg-gray-200 enabled:hover:text-gray-600 focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50'

/**
 * 제어 이미지 입력 primitive (single/multi). 파일 선택 + 로컬 미리보기 + 삭제 + 빈상태.
 *
 * 실제 업로드는 하지 않는다 — 고른 File 을 value 로 보유하고, 업로드/저장은 호출부(폼 제출)가
 * 담당한다. presign 흐름(#340)이 확정되면 제출 시점에 File → URL 변환만 끼우면 된다.
 * 폼은 `ImageField` 로 감싸고, 제어 상태는 이 컴포넌트를 직접 쓴다.
 */
export function ImageInput({
  value,
  onChange,
  multiple,
  maxFiles = 10,
  maxSizeMB = 5,
  accept = 'image/*',
  disabled,
  className,
  invalid,
  inputId,
  describedBy,
  onBlur,
  fieldRef,
}: ImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Map<File, string>>(() => new Map())
  const [dragging, setDragging] = useState(false)

  const items = toItems(value)

  useEffect(() => {
    const map = new Map<File, string>()
    for (const it of toItems(value)) {
      if (it instanceof File) map.set(it, URL.createObjectURL(it))
    }
    setPreviews(map)
    return () => map.forEach((url) => URL.revokeObjectURL(url))
  }, [value])

  const srcOf = (it: ImageValue): string | undefined =>
    typeof it === 'string' ? it : previews.get(it)

  const openPicker = () => fileInputRef.current?.click()

  const addFiles = (picked: File[]) => {
    if (picked.length === 0) return
    const maxBytes = maxSizeMB * 1024 * 1024
    const accepted = picked.filter((f) => f.type.startsWith('image/') && f.size <= maxBytes)
    setLocalError(
      accepted.length < picked.length
        ? `이미지 파일만, 장당 ${maxSizeMB}MB 이하만 추가할 수 있어요.`
        : null
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

  const dropHandlers = disabled
    ? {}
    : {
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault()
          setDragging(true)
        },
        onDragLeave: (e: React.DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
        },
        onDrop: (e: React.DragEvent) => {
          e.preventDefault()
          setDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        },
      }
  const dropClass = dragging && 'rounded-lg outline outline-2 outline-dashed outline-primary'

  const triggerAria = {
    id: inputId,
    'aria-describedby': describedBy,
    'aria-invalid': invalid,
    onBlur,
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

  if (!multiple) {
    const current = items[0]
    const src = current ? srcOf(current) : undefined
    return (
      <div className={cn('w-full', dropClass, className)} {...dropHandlers}>
        {hiddenInput}
        {current ? (
          <div className="relative h-50 w-full">
            <button
              {...triggerAria}
              ref={fieldRef}
              type="button"
              onClick={openPicker}
              disabled={disabled}
              aria-label="이미지 변경"
              className={cn(
                'h-full w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100 outline-none transition-opacity focus-visible:ring-1 focus-visible:ring-primary enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
                invalid && 'ring-1 ring-destructive'
              )}
            >
              {src && <img src={src} alt="" className="h-full w-full object-cover" />}
            </button>
            <RemoveButton onClick={() => removeAt(0)} disabled={disabled} />
          </div>
        ) : (
          <EmptyTrigger
            {...triggerAria}
            ref={fieldRef}
            onClick={openPicker}
            disabled={disabled}
            invalid={invalid}
          />
        )}
        {localError && (
          <p role="alert" className="mt-2 text-r-14 text-destructive">
            {localError}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {hiddenInput}
      {items.length === 0 ? (
        <EmptyTrigger
          {...triggerAria}
          ref={fieldRef}
          onClick={openPicker}
          disabled={disabled}
          invalid={invalid}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it, i) => {
            const src = srcOf(it)
            return (
              <div key={i} className="relative size-24 overflow-hidden rounded-lg bg-gray-100">
                {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                <RemoveButton
                  onClick={() => removeAt(i)}
                  disabled={disabled}
                  label={`${i + 1}번째 이미지 삭제`}
                />
              </div>
            )
          })}
          <button
            {...triggerAria}
            ref={fieldRef}
            type="button"
            onClick={openPicker}
            disabled={disabled || items.length >= maxFiles}
            aria-label="이미지 추가"
            className={cn('size-24', TRIGGER_BASE, 'gap-1', invalid && 'ring-1 ring-destructive')}
          >
            <ImageIcon size={20} className="text-gray-400" />
            <span className="text-r-12">
              {items.length}/{maxFiles}
            </span>
          </button>
        </div>
      )}
      {localError && (
        <p role="alert" className="mt-2 text-r-14 text-destructive">
          {localError}
        </p>
      )}
    </div>
  )
}

function RemoveButton({
  onClick,
  disabled,
  label = '이미지 삭제',
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      aria-label={label}
      className="absolute right-2 top-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white outline-none transition-colors hover:bg-black/70 focus-visible:ring-1 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <XIcon size={14} />
    </button>
  )
}

interface EmptyTriggerProps {
  onClick: () => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

const EmptyTrigger = ({ ref, onClick, disabled, invalid, ...aria }: EmptyTriggerProps) => (
  <button
    {...aria}
    ref={ref}
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn('h-50 w-full', TRIGGER_BASE, invalid && 'ring-1 ring-destructive')}
  >
    <ImageIcon size={28} className="text-gray-400" />
    <span className="text-r-14">이미지 추가</span>
  </button>
)
