/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=188-1130
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export interface SelectDropdownOption {
  value: string
  label: string
}

// M14 타이포는 직접 값으로 우회 — cn()의 tailwind-merge가 커스텀 text-m-14를 text-{color}와
// 같은 충돌 그룹으로 오판해 제거하기 때문.
const M14 = 'font-[Pretendard_Variable] text-[14px] font-medium leading-[1.6]'

// TODO: #384 — packages/ui/src/icons 공통 아이콘으로 추출 (인라인 svg 금지)
function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Figma "더보기" 아이콘 (node 188:1118) — 16px 박스 안 inset[40% 20% 28.33% 20%] 배치.
// 색은 currentColor 상속 — 트리거 텍스트 색(gray-500/gray-900)을 그대로 따른다.
// TODO: #384 — packages/ui/src/icons 공통 아이콘으로 추출 (인라인 svg 금지)
function ChevronIcon({ open }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn('shrink-0 transition-transform', open && 'rotate-180')}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        transform="translate(3.2 6.4)"
        d="M0.144247 0.168567C0.345708 -0.0463238 0.683223 -0.0572037 0.898103 0.144247L4.8 3.80228L8.70187 0.144247C8.9168 -0.0572037 9.2543 -0.0463238 9.45579 0.168567C9.65718 0.383458 9.6463 0.720972 9.43147 0.922423L5.16477 4.92246C4.95962 5.11478 4.64039 5.11478 4.43523 4.92246L0.168567 0.922423C-0.0463238 0.720972 -0.0572037 0.383458 0.144247 0.168567Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** open 일 때 바깥 클릭 / Escape 로 닫는다 (단일·다중 공용) */
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

const TRIGGER_CLASSES =
  'flex h-[40px] w-[95px] items-center justify-center gap-[10px] rounded-[8px] border bg-white px-[10px]'
const PANEL_CLASSES =
  'absolute left-0 top-[calc(100%+6px)] z-20 max-h-[240px] w-max min-w-full overflow-y-auto rounded-[8px] border border-gray-300 bg-white py-[4px] shadow-[0_6px_20px_rgba(0,0,0,0.1)]'
const OPTION_CLASSES =
  'flex w-full items-center justify-between gap-2 px-[12px] py-[8px] text-left hover:bg-gray-100'

/**
 * 단일 선택 드롭다운 (필터용). 네이티브 `<select>` 가 펼친 옵션 리스트를 스타일링할 수
 * 없어 커스텀 드롭다운으로 구현. 트리거는 Figma dropdown 컴포넌트(node 188:1129 접힘 /
 * 1498:11472 선택됨)를 따른다 — 항상 카테고리명(label) 표시, 필터 미적용=gray-500 /
 * 적용=gray-900. 옵션 선택 시 닫힌다. `value=''` 가 "전체"(필터 해제).
 */
export function SelectDropdown({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: SelectDropdownOption[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useCloseOnOutside(open, () => setOpen(false))

  const handleSelect = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          TRIGGER_CLASSES,
          M14,
          value ? 'text-gray-900' : 'text-gray-500',
          open ? 'border-primary' : 'border-gray-300',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul role="listbox" className={PANEL_CLASSES}>
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => handleSelect('')}
              className={cn(OPTION_CLASSES, M14, value ? 'text-gray-700' : 'text-primary')}
            >
              전체
              {!value && <CheckMark />}
            </button>
          </li>
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(OPTION_CLASSES, M14, isSelected ? 'text-primary' : 'text-gray-700')}
                >
                  {opt.label}
                  {isSelected && <CheckMark />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * 다중 선택 드롭다운 (필터용). `SelectDropdown` 과 트리거/패널 스타일은 동일하되 옵션
 * 선택 시 닫지 않고 토글한다. 트리거는 선택 개수와 무관하게 항상 카테고리명을 표시하고,
 * 1개 이상 선택 시 gray-900, 미선택 시 gray-500. `onClear` 가 "전체"(필터 해제).
 */
export function MultiSelectDropdown<T extends string>({
  label,
  values,
  onToggle,
  onClear,
  options,
}: {
  label: string
  values: T[]
  onToggle: (v: T) => void
  onClear: () => void
  options: { value: T; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useCloseOnOutside(open, () => setOpen(false))

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          TRIGGER_CLASSES,
          M14,
          values.length > 0 ? 'text-gray-900' : 'text-gray-500',
          open ? 'border-primary' : 'border-gray-300'
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul role="listbox" aria-multiselectable className={PANEL_CLASSES}>
          <li>
            <button
              type="button"
              role="option"
              aria-selected={values.length === 0}
              onClick={onClear}
              className={cn(
                OPTION_CLASSES,
                M14,
                values.length === 0 ? 'text-primary' : 'text-gray-700'
              )}
            >
              전체
              {values.length === 0 && <CheckMark />}
            </button>
          </li>
          {options.map((opt) => {
            const isSelected = values.includes(opt.value)
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onToggle(opt.value)}
                  className={cn(OPTION_CLASSES, M14, isSelected ? 'text-primary' : 'text-gray-700')}
                >
                  {opt.label}
                  {isSelected && <CheckMark />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
