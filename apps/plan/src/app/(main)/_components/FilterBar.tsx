'use client'

import { Select } from '@bconnect/ui'
import { Trade } from '@bconnect/api-client'
import { TRADE_LIST, TRADE_LABELS } from '@/lib/trade-labels'
import { EXPERIENCE_OPTIONS, EXPERIENCE_LABELS } from '@/lib/experience'
import { GRADE_OPTIONS } from '@/lib/grade'
import type { Grade } from '@/lib/grade'
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

/** Figma node 1503:12064 — rounded-full pill, no border, secondary bg + primary text, M14, x icon */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-m-14 text-primary transition-opacity hover:opacity-80"
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
      className="flex h-[27px] w-[27px] items-center justify-center rounded-full hover:bg-gray-100"
    >
      {/* Figma node 1470:6746 (RefreshIcon) — 단일 fill path, gray-500 */}
      {/* TODO: #384 — packages/ui/src/icons 공통 아이콘으로 추출 (인라인 svg 금지) */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 17.9439 17.9439"
        fill="none"
        className="text-gray-500"
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
        <Select
          multiple
          clearable
          triggerLabel="지역"
          value={regions}
          onChange={(v) => setRegion(v as string[])}
          options={REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <Select
          multiple
          clearable
          triggerLabel="공종"
          value={trades}
          onChange={(v) => setTrade(v as Trade[])}
          options={TRADE_LIST}
        />
        <Select
          multiple
          clearable
          triggerLabel="직급"
          value={grades}
          onChange={(v) => setGrade(v as Grade[])}
          options={GRADE_OPTIONS}
        />
        <Select
          clearable
          triggerLabel="경력"
          value={experience ?? ''}
          onChange={(v) =>
            setExperience(typeof v === 'string' && v ? (v as ExperienceLevel) : null)
          }
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
