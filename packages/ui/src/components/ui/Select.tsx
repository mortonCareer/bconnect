/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=188-1130
 */
'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { CheckIcon, ChevronIcon } from '../../icons'
import { FIELD_BASE_CLASSES, FIELD_DEFAULT_VARIANT_CLASSES } from './_field-base'

export interface SelectOption {
  value: string
  label: string
}

const FILTER_TRIGGER =
  'flex h-10 w-[95px] items-center justify-center gap-2.5 rounded-lg border bg-white px-2.5'
const PANEL_CLASSES =
  'absolute left-0 top-[calc(100%+6px)] z-20 max-h-60 w-max min-w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-lg border border-gray-300 bg-white py-1 shadow-[0_6px_20px_rgba(0,0,0,0.1)] outline-none'
const OPTION_CLASSES =
  'flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left hover:bg-secondary data-[active=true]:bg-secondary'

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
  /** 트리거 너비를 풀폭 대신 선택값 콘텐츠 크기에 맞춘다 (폼 모드). 기본 false = w-full */
  fitContent?: boolean
  className?: string
  // ↓ 폼 래퍼(SelectField)가 aria 합성용으로 주입. 필터/제어로 직접 쓸 때는 불필요.
  invalid?: boolean
  triggerId?: string
  describedBy?: string
  onBlur?: () => void
  fieldRef?: React.Ref<HTMLButtonElement>
}

/** listbox 항목 — clearable "전체"(value=null) 와 실제 옵션을 한 배열로 합쳐 키보드 인덱싱한다. */
interface NavItem {
  value: string | null
  label: string
  isClear: boolean
}

/**
 * 제어 select 드롭다운 primitive (single/multi, 폼/필터 트리거).
 *
 * 필터·nuqs 등 제어 상태는 이 컴포넌트를 직접 쓰고(`value`/`onChange`), 폼은 `SelectField`
 * 로 감싼다. `triggerLabel` 이 있으면 필터 모드(카테고리명 고정·색분기), 없으면 선택값 표시.
 *
 * 키보드: 트리거에서 ArrowDown/Enter/Space 로 열고, 패널은 listbox 로 포커스가 이동해
 * 화살표·Home/End·type-ahead 로 활성 옵션을 옮기며(`aria-activedescendant`) Enter/Space 로 선택한다.
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
  fitContent,
  className,
  invalid,
  triggerId,
  describedBy,
  onBlur,
  fieldRef,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | undefined }>({
    buffer: '',
    timer: undefined,
  })
  const baseId = useId()
  const optionId = (i: number) => `${baseId}-opt-${i}`

  const isMulti = !!multiple
  const arr = isMulti ? ((value as string[]) ?? []) : []
  const single = isMulti ? '' : ((value as string) ?? '')
  const hasValue = isMulti ? arr.length > 0 : !!single
  const isSelected = (v: string) => (isMulti ? arr.includes(v) : single === v)
  const selectedLabel = isMulti ? undefined : options.find((o) => o.value === single)?.label

  const navItems: NavItem[] = [
    ...(clearable ? [{ value: null, label: '전체', isClear: true }] : []),
    ...options.map((o) => ({ value: o.value, label: o.label, isClear: false })),
  ]
  const isItemSelected = (item: NavItem) => (item.isClear ? !hasValue : isSelected(item.value!))

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node
    if (typeof fieldRef === 'function') fieldRef(node)
    else if (fieldRef) (fieldRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
  }

  const openPanel = () => {
    const selectedIdx = navItems.findIndex(isItemSelected)
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0)
    setOpen(true)
  }
  const closePanel = (returnFocus = true) => {
    setOpen(false)
    setActiveIndex(-1)
    if (returnFocus) triggerRef.current?.focus()
  }

  const handleSelect = (v: string) => {
    if (isMulti) {
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
    } else {
      onChange(v)
      closePanel()
    }
  }
  const handleClear = () => {
    onChange(isMulti ? [] : '')
    if (!isMulti) closePanel()
  }
  const handleSelectItem = (item: NavItem) => {
    if (item.isClear) handleClear()
    else handleSelect(item.value!)
  }

  const runTypeahead = (key: string) => {
    if (key.length !== 1) return false
    clearTimeout(typeahead.current.timer)
    typeahead.current.buffer += key.toLowerCase()
    const buf = typeahead.current.buffer
    const idx = navItems.findIndex((it) => it.label.toLowerCase().startsWith(buf))
    if (idx >= 0) setActiveIndex(idx)
    typeahead.current.timer = setTimeout(() => {
      typeahead.current.buffer = ''
    }, 500)
    return true
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      openPanel()
    }
  }

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    const last = navItems.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, last))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(last)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0) handleSelectItem(navItems[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        closePanel()
        break
      case 'Tab':
        e.preventDefault()
        closePanel()
        break
      default:
        if (runTypeahead(e.key)) e.preventDefault()
    }
  }

  const handleRootBlur = (e: React.FocusEvent) => {
    if (rootRef.current && !rootRef.current.contains(e.relatedTarget as Node)) onBlur?.()
  }

  const rootRef = useCloseOnOutside(open, () => closePanel(false))

  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const filterMode = !!triggerLabel
  const triggerClass = filterMode
    ? cn(
        FILTER_TRIGGER,
        'text-m-14 cursor-pointer',
        'outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary',
        hasValue ? 'text-gray-900' : 'text-gray-500',
        open ? 'border-primary' : 'border-gray-300 hover:border-gray-400',
        disabled && 'cursor-not-allowed opacity-40'
      )
    : cn(
        FIELD_BASE_CLASSES,
        FIELD_DEFAULT_VARIANT_CLASSES,
        'flex cursor-pointer items-center justify-between gap-2',
        fitContent && 'w-fit',
        !open && 'hover:border-gray-400',
        open && 'border-primary ring-1 ring-primary'
      )

  const triggerText = filterMode ? triggerLabel : (selectedLabel ?? placeholder ?? '')
  const placeholderColor = !filterMode && !selectedLabel

  return (
    <div ref={rootRef} onBlur={handleRootBlur} className={cn('relative', className)}>
      <button
        ref={setTriggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? closePanel(false) : openPanel())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid}
        id={triggerId}
        aria-describedby={describedBy}
        className={triggerClass}
      >
        <span className={cn('truncate', placeholderColor && 'text-gray-500')}>{triggerText}</span>
        <ChevronIcon
          direction="down"
          size={16}
          className={cn('transition-transform motion-reduce:transition-none', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-multiselectable={isMulti || undefined}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          onKeyDown={handleListKeyDown}
          className={PANEL_CLASSES}
        >
          {navItems.map((item, i) => {
            const sel = isItemSelected(item)
            return (
              <li
                key={item.isClear ? '__clear__' : item.value}
                id={optionId(i)}
                role="option"
                aria-selected={sel}
                data-index={i}
                data-active={i === activeIndex}
                onClick={() => handleSelectItem(item)}
                className={cn(OPTION_CLASSES, 'text-m-14', sel ? 'text-primary' : 'text-gray-700')}
              >
                {item.label}
                {sel && <CheckIcon size={14} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
