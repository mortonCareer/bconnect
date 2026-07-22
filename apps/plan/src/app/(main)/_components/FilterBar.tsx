'use client'

import { Select, FilterChip, RefreshIcon } from '@bconnect/ui'
import {
  Trade,
  TRADE_LIST,
  TRADE_LABELS,
  REGION_LIST,
  REGION_LABELS,
  type CrawledRegion,
} from '@bconnect/api-client'
import { EXPERIENCE_OPTIONS, EXPERIENCE_LABELS } from '@/lib/experience'
import { GRADE_OPTIONS } from '@/lib/grade'
import type { Grade } from '@/lib/grade'
import { useFilterParams } from '@/hooks/useFilterParams'
import type { ExperienceLevel } from '@/lib/experience'
import { TaskSelectBar } from './TaskSelectBar'

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="필터 초기화"
      className="flex h-[27px] w-[27px] items-center justify-center rounded-full hover:bg-gray-100"
    >
      <RefreshIcon size={18} className="text-gray-500" />
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
      <TaskSelectBar />

      {/* Dropdowns */}
      <div className="flex items-center gap-[9px]">
        <Select
          multiple
          clearable
          triggerLabel="지역"
          value={regions}
          onChange={(v) => setRegion(v as CrawledRegion[])}
          options={REGION_LIST}
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
        <div className="flex flex-wrap items-center gap-[7px]">
          {regions.map((r) => (
            <FilterChip key={r} label={REGION_LABELS[r]} onRemove={() => toggleRegion(r)} />
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
