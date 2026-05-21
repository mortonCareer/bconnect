'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@bconnect/ui'
import { TRADE_LIST, TRADE_LABELS } from '@/lib/trade-labels'
import { EXPERIENCE_OPTIONS, EXPERIENCE_LABELS } from '@/lib/experience'
import { GRADE_OPTIONS } from '@/lib/grade'
import { useFilterParams } from '@/hooks/useFilterParams'
import type { ExperienceLevel } from '@/lib/experience'

const REGION_OPTIONS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
]

interface DropdownOption {
  value: string
  label: string
}

// M14 타이포는 직접 값으로 우회 — cn()의 tailwind-merge가 커스텀 text-m-14를 text-{color}와
// 같은 충돌 그룹으로 오판해 제거하기 때문 (TechnicianCard SkillTag와 동일 사유).
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

// 네이티브 <select> 는 펼친 옵션 리스트를 스타일링할 수 없어 커스텀 드롭다운으로 구현.
// 트리거는 Figma dropdown 컴포넌트(node 188:1129 접힘 / 1498:11472 선택됨)를 따른다:
// - 항상 카테고리명(label) 표시
// - 필터 미적용 = 접힘 → gray-500 / 필터 적용 = 선택됨 → gray-900
function DropdownSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 / Escape 로 닫기
  useEffect(() => {
    if (!open) return
    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleSelect = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      {/* 트리거 — 항상 label 표시, 색만 필터 적용 여부로 분기 (Figma dropdown 2 variant) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-[40px] w-[95px] items-center justify-center gap-[10px] rounded-[8px] border bg-white px-[10px]',
          M14,
          value ? 'text-bconnect-gray-900' : 'text-bconnect-gray-500',
          open ? 'border-bconnect-primary' : 'border-bconnect-gray-300',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {/* 옵션 리스트 */}
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-[240px] w-max min-w-full overflow-y-auto rounded-[8px] border border-bconnect-gray-300 bg-white py-[4px] shadow-[0_6px_20px_rgba(0,0,0,0.1)]"
        >
          {/* 전체 = 필터 해제 */}
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => handleSelect('')}
              className={cn(
                'flex w-full items-center justify-between gap-2 px-[12px] py-[8px] text-left hover:bg-bconnect-gray-100',
                M14,
                value ? 'text-bconnect-gray-700' : 'text-bconnect-primary'
              )}
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
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-[12px] py-[8px] text-left hover:bg-bconnect-gray-100',
                    M14,
                    isSelected ? 'text-bconnect-primary' : 'text-bconnect-gray-700'
                  )}
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

// 다중 선택 드롭다운 (지역·공종·직급 공용). DropdownSelect 와 트리거/패널 스타일은 동일하되
// 옵션 선택 시 닫지 않고 토글한다. 트리거는 선택 개수와 무관하게 항상 카테고리명을 표시하고,
// 1개 이상 선택 시 gray-900(선택됨), 미선택 시 gray-500(접힘).
function MultiDropdownSelect<T extends string>({
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
  const rootRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 / Escape 로 닫기
  useEffect(() => {
    if (!open) return
    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      {/* 트리거 — 항상 label 표시, 색만 필터 적용 여부로 분기 (Figma dropdown 2 variant) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-[40px] w-[95px] items-center justify-center gap-[10px] rounded-[8px] border bg-white px-[10px]',
          M14,
          values.length > 0 ? 'text-bconnect-gray-900' : 'text-bconnect-gray-500',
          open ? 'border-bconnect-primary' : 'border-bconnect-gray-300'
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {/* 옵션 리스트 — 다중 선택이라 선택해도 닫지 않는다 */}
      {open && (
        <ul
          role="listbox"
          aria-multiselectable
          className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-[240px] w-max min-w-full overflow-y-auto rounded-[8px] border border-bconnect-gray-300 bg-white py-[4px] shadow-[0_6px_20px_rgba(0,0,0,0.1)]"
        >
          {/* 전체 = 필터 해제 */}
          <li>
            <button
              type="button"
              role="option"
              aria-selected={values.length === 0}
              onClick={onClear}
              className={cn(
                'flex w-full items-center justify-between gap-2 px-[12px] py-[8px] text-left hover:bg-bconnect-gray-100',
                M14,
                values.length === 0 ? 'text-bconnect-primary' : 'text-bconnect-gray-700'
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
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-[12px] py-[8px] text-left hover:bg-bconnect-gray-100',
                    M14,
                    isSelected ? 'text-bconnect-primary' : 'text-bconnect-gray-700'
                  )}
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

// Figma node 1503:12064 — rounded-full pill, no border, primary-sub bg + primary text, M14, x icon
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-bconnect-primary-sub px-3 py-1 text-m-14 text-bconnect-primary transition-opacity hover:opacity-80"
    >
      {label}
      {/* TODO: #384 — packages/ui/src/icons 공통 아이콘으로 추출 (인라인 svg 금지) */}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="필터 초기화"
      className="flex h-[27px] w-[27px] items-center justify-center rounded-full hover:bg-bconnect-gray-100"
    >
      {/* Figma node 1470:6746 (RefreshIcon) — 단일 fill path, gray-500 */}
      {/* TODO: #384 — packages/ui/src/icons 공통 아이콘으로 추출 (인라인 svg 금지) */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 17.9439 17.9439"
        fill="none"
        className="text-bconnect-gray-500"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.21304 8.97188C2.21304 5.58001 4.85655 2.21301 8.97192 2.21301C12.2955 2.21301 13.9382 4.67302 14.6383 5.98126H12.5607C12.2305 5.98126 11.9626 6.24905 11.9626 6.57938C11.9626 6.90972 12.2305 7.17752 12.5607 7.17752H16.1495C16.4798 7.17752 16.7477 6.90972 16.7477 6.57938V2.9906C16.7477 2.66027 16.4798 2.39247 16.1495 2.39247C15.8193 2.39247 15.5514 2.66027 15.5514 2.9906V5.15964C14.7086 3.67397 12.7592 1.01674 8.97192 1.01674C4.11172 1.01674 1.01677 5.00674 1.01677 8.97188C1.01677 12.9371 4.11172 16.9271 8.97192 16.9271C11.2973 16.9271 13.2333 16.0069 14.6117 14.6044C15.3498 13.8534 15.9262 12.9662 16.3192 12.0113C16.4449 11.7058 16.2992 11.3562 15.9938 11.2305C15.6883 11.1048 15.3387 11.2505 15.2129 11.556C14.877 12.3723 14.3852 13.1284 13.7586 13.7658C12.596 14.9488 10.9638 15.7308 8.97192 15.7308C4.85655 15.7308 2.21304 12.3638 2.21304 8.97188Z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}

export function FilterBar() {
  const {
    trades,
    experience,
    grades,
    regions,
    setTrade,
    setExperience,
    setGrade,
    setRegion,
    toggleTrade,
    toggleGrade,
    toggleRegion,
    clearFilter,
  } = useFilterParams()

  const hasFilter = trades.length > 0 || !!experience || grades.length > 0 || regions.length > 0

  return (
    <div className="flex flex-col gap-[13px]">
      {/* Dropdowns */}
      <div className="flex items-center gap-[9px]">
        <MultiDropdownSelect
          label="지역"
          values={regions}
          onToggle={toggleRegion}
          onClear={() => setRegion(null)}
          options={REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <MultiDropdownSelect
          label="공종"
          values={trades}
          onToggle={toggleTrade}
          onClear={() => setTrade(null)}
          options={TRADE_LIST}
        />
        <MultiDropdownSelect
          label="직급"
          values={grades}
          onToggle={toggleGrade}
          onClear={() => setGrade(null)}
          options={GRADE_OPTIONS}
        />
        <DropdownSelect
          label="경력"
          value={experience ?? ''}
          onChange={(v) => setExperience((v as ExperienceLevel) || null)}
          options={EXPERIENCE_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
        />
      </div>

      {/* Active filter chips + refresh */}
      {hasFilter && (
        <div className="flex items-center gap-[7px]">
          {regions.map((r) => (
            <FilterChip key={r} label={r} onRemove={() => toggleRegion(r)} />
          ))}
          {trades.map((t) => (
            <FilterChip key={t} label={TRADE_LABELS[t]} onRemove={() => toggleTrade(t)} />
          ))}
          {grades.map((g) => (
            <FilterChip key={g} label={g} onRemove={() => toggleGrade(g)} />
          ))}
          {experience && (
            <FilterChip
              label={EXPERIENCE_LABELS[experience]}
              onRemove={() => setExperience(null)}
            />
          )}
          <RefreshButton onClick={clearFilter} />
        </div>
      )}
    </div>
  )
}
