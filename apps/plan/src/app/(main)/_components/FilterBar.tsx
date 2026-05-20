'use client'

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
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'flex h-[40px] w-[95px] appearance-none items-center rounded-[8px] border border-bconnect-gray-300 bg-white pl-[10px] pr-[36px] text-m-14 text-bconnect-gray-900 focus:outline-none',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-bconnect-gray-700"
      >
        <path
          d="M4 6.5L8 10.5L12 6.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
