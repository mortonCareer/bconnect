'use client'

import { useEffect, useRef, useState } from 'react'
import { Trade } from '@bconnect/api-client'
import { cn } from '@bconnect/ui'
import { TRADE_LIST, TRADE_LABELS } from '@/lib/trade-labels'
import { EXPERIENCE_OPTIONS, EXPERIENCE_LABELS } from '@/lib/experience'
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

// 네이티브 <select> 는 펼친 옵션 리스트를 스타일링할 수 없어 커스텀 드롭다운으로 구현.
// 트리거: h-40 rounded-8 / 패널: 흰 배경 + gray-300 border + shadow, 선택 항목은 primary + 체크.
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

  const selected = options.find((opt) => opt.value === value)

  const handleSelect = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      {/* 트리거 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-[40px] w-[95px] items-center justify-between gap-1 rounded-[8px] border bg-white pl-[10px] pr-[8px]',
          M14,
          open ? 'border-bconnect-primary' : 'border-bconnect-gray-300',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <span
          className={cn('truncate', selected ? 'text-bconnect-gray-900' : 'text-bconnect-gray-700')}
        >
          {selected ? selected.label : label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={cn(
            'shrink-0 text-bconnect-gray-700 transition-transform',
            open && 'rotate-180'
          )}
        >
          <path
            d="M4 6.5L8 10.5L12 6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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

// Figma node 1503:12064 — rounded-full pill, no border, primary-sub bg + primary text, M14, x icon
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-bconnect-primary-sub px-3 py-1 text-m-14 text-bconnect-primary transition-opacity hover:opacity-80"
    >
      {label}
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
      {/* Figma node 1470:6746 — 단일 arc + 화살표 refresh icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-bconnect-gray-700"
      >
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <polyline points="3 3 3 8 8 8" />
      </svg>
    </button>
  )
}

export function FilterBar() {
  const { trade, experience, region, setTrade, setExperience, setRegion, clearFilter } =
    useFilterParams()

  const hasFilter = !!trade || !!experience || !!region

  return (
    <div className="flex flex-col gap-[13px]">
      {/* Dropdowns */}
      <div className="flex items-center gap-[9px]">
        <DropdownSelect
          label="지역"
          value={region ?? ''}
          onChange={(v) => setRegion(v || null)}
          options={REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <DropdownSelect
          label="공종"
          value={trade ?? ''}
          onChange={(v) => setTrade((v as Trade) || null)}
          options={TRADE_LIST}
        />
        {/* 직급은 BE 미구현 (#211) — 비활성 */}
        <DropdownSelect label="직급" value="" onChange={() => {}} options={[]} disabled />
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
          {region && <FilterChip label={region} onRemove={() => setRegion(null)} />}
          {trade && <FilterChip label={TRADE_LABELS[trade]} onRemove={() => setTrade(null)} />}
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
