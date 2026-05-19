'use client'

import { cn } from '@bconnect/ui'
import type { ExperienceLevel, ExperienceOption } from '../types'

interface ExperienceSelectorProps {
  options: ExperienceOption[]
  selected: ExperienceLevel | null
  onSelect: (level: ExperienceLevel) => void
}

export function ExperienceSelector({ options, selected, onSelect }: ExperienceSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const isSelected = selected === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex h-[40px] items-center justify-center rounded-[8px] border px-[14px] py-[3px] text-sm leading-[1.6] transition-colors',
              isSelected
                ? 'border-bconnect-primary bg-bconnect-primary-sub font-semibold text-bconnect-primary'
                : 'border-bconnect-gray-300 font-medium text-bconnect-gray-500'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
