/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=188-1130
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { CheckIcon, ChevronDownIcon } from '../../icons'
import { FIELD_BASE_CLASSES, FIELD_DEFAULT_VARIANT_CLASSES } from './_field-base'

export interface SelectOption {
  value: string
  label: string
}

const FILTER_TRIGGER =
  'flex h-[40px] w-[95px] items-center justify-center gap-[10px] rounded-[8px] border bg-white px-[10px]'
const PANEL_CLASSES =
  'absolute left-0 top-[calc(100%+6px)] z-20 max-h-[240px] w-max min-w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-[8px] border border-gray-300 bg-white py-[4px] shadow-[0_6px_20px_rgba(0,0,0,0.1)]'
const OPTION_CLASSES =
  'flex w-full items-center justify-between gap-2 px-[12px] py-[8px] text-left hover:bg-secondary'

/** open 일 때 바깥 클릭 / Escape 로 닫는다 */
function useCloseOnOutside(open: boolean, close: () => void) {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, close])
  return rootRef
}

export interface SelectProps {
  value: string | string[]
  onChange: (value: string | string[]) => void
  options: SelectOption[]
  /** 다중 선택 — value 가 string[] 가 된다 */
  multiple?: boolean
  placeholder?: string
  /** 트리거에 선택값 대신 고정 표시할 카테고리명 (필터 모드). 미지정 시 선택값 표시. */
  triggerLabel?: string
  /** "전체"(해제) 옵션 추가 — 필터용 */
  clearable?: boolean
  disabled?: boolean
  className?: string
  // ↓ 폼 래퍼(SelectField)가 aria 합성용으로 주입. 필터/제어로 직접 쓸 때는 불필요.
  invalid?: boolean
  triggerId?: string
  describedBy?: string
  onBlur?: () => void
  fieldRef?: React.Ref<HTMLButtonElement>
}

/**
 * 제어 select 드롭다운 primitive (single/multi, 폼/필터 트리거).
 *
 * 필터·nuqs 등 제어 상태는 이 컴포넌트를 직접 쓰고(`value`/`onChange`), 폼은 `SelectField`
 * 로 감싼다. `triggerLabel` 이 있으면 필터 모드(카테고리명 고정·색분기), 없으면 선택값 표시.
 */
export function Select({
  value,
  onChange,
  options,
  multiple,
  placeholder,
  triggerLabel,
  clearable,
  disabled,
  className,
  invalid,
  triggerId,
  describedBy,
  onBlur,
  fieldRef,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useCloseOnOutside(open, () => setOpen(false))

  const isMulti = !!multiple
  const arr = isMulti ? ((value as string[]) ?? []) : []
  const single = isMulti ? '' : ((value as string) ?? '')
  const hasValue = isMulti ? arr.length > 0 : !!single
  const isSelected = (v: string) => (isMulti ? arr.includes(v) : single === v)
  const selectedLabel = isMulti ? undefined : options.find((o) => o.value === single)?.label

  const handleSelect = (v: string) => {
    if (isMulti) {
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
    } else {
      onChange(v)
      setOpen(false)
    }
  }
  const handleClear = () => {
    onChange(isMulti ? [] : '')
    if (!isMulti) setOpen(false)
  }

  const filterMode = !!triggerLabel
  const triggerClass = filterMode
    ? cn(
        FILTER_TRIGGER,
        'text-m-14',
        'outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary',
        hasValue ? 'text-gray-900' : 'text-gray-500',
        open ? 'border-primary' : 'border-gray-300',
        disabled && 'cursor-not-allowed opacity-40'
      )
    : cn(
        FIELD_BASE_CLASSES,
        FIELD_DEFAULT_VARIANT_CLASSES,
        'flex items-center justify-between gap-2',
        open && 'border-primary ring-1 ring-primary'
      )

  const triggerText = filterMode ? triggerLabel : (selectedLabel ?? placeholder ?? '')
  const placeholderColor = !filterMode && !selectedLabel

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={fieldRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onBlur={onBlur}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid}
        id={triggerId}
        aria-describedby={describedBy}
        className={triggerClass}
      >
        <span className={cn('truncate', placeholderColor && 'text-gray-500')}>{triggerText}</span>
        <ChevronDownIcon className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul role="listbox" aria-multiselectable={isMulti || undefined} className={PANEL_CLASSES}>
          {clearable && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!hasValue}
                onClick={handleClear}
                className={cn(
                  OPTION_CLASSES,
                  'text-m-14',
                  !hasValue ? 'text-primary' : 'text-gray-700'
                )}
              >
                전체
                {!hasValue && <CheckIcon size={14} />}
              </button>
            </li>
          )}
          {options.map((opt) => {
            const sel = isSelected(opt.value)
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    OPTION_CLASSES,
                    'text-m-14',
                    sel ? 'text-primary' : 'text-gray-700'
                  )}
                >
                  {opt.label}
                  {sel && <CheckIcon size={14} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
