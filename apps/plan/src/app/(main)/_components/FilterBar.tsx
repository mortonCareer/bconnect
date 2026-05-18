'use client'

import { Trade } from '@bconnect/api-client'
import { Tag } from '@bconnect/ui'
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
          'flex h-[40px] w-[95px] appearance-none items-center rounded-[8px] border border-bconnect-gray-300 bg-white pl-3 pr-8 text-m-14 text-bconnect-gray-900 focus:outline-none',
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
        className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2"
      >
        <path
          d="M4 6.5L8 10.5L12 6.5"
          stroke="#1B1B1B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M14.5 3.5v3.75h-3.75M3.5 14.5v-3.75h3.75"
          stroke="#7B7B7B"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.07 7.25A4.5 4.5 0 0 1 13.5 8M12.93 10.75A4.5 4.5 0 0 1 4.5 10"
          stroke="#7B7B7B"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
          {region && (
            <Tag variant="filter" size="sm" onRemove={() => setRegion(null)}>
              {region}
            </Tag>
          )}
          {trade && (
            <Tag variant="filter" size="sm" onRemove={() => setTrade(null)}>
              {TRADE_LABELS[trade]}
            </Tag>
          )}
          {experience && (
            <Tag variant="filter" size="sm" onRemove={() => setExperience(null)}>
              {EXPERIENCE_LABELS[experience]}
            </Tag>
          )}
          <RefreshButton onClick={clearFilter} />
        </div>
      )}
    </div>
  )
}
