'use client'

import { cn } from '@morton/ui'
import type { ExperienceLevel, ExperienceOption } from '../types'

interface ExperienceSelectorProps {
  options: ExperienceOption[]
  selected: ExperienceLevel | null
  onSelect: (level: ExperienceLevel) => void
}

export function ExperienceSelector({ options, selected, onSelect }: ExperienceSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex h-[30px] items-center justify-center rounded-lg border px-3.5 py-[3px] text-sm font-medium transition-colors',
              isSelected
                ? 'border-[#386DFF] bg-[#EAEFFF] font-semibold text-[#386DFF]'
                : 'border-[#E5E7EB] text-[#9C9C9C]'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
