'use client'

import { cn } from '@morton/ui'
import type { ConstructionField, FieldOption } from '../types'

interface FieldSelectorProps {
  options: FieldOption[]
  selected: ConstructionField[]
  onToggle: (field: ConstructionField) => void
}

export function FieldSelector({ options, selected, onToggle }: FieldSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((field) => {
        const isSelected = selected.includes(field.id)
        return (
          <button
            key={field.id}
            type="button"
            onClick={() => onToggle(field.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-[10px] border p-2 transition-colors',
              isSelected ? 'border-[#386DFF] bg-[#EAEFFF]' : 'border-[#E5E7EB] bg-white'
            )}
          >
            <span className="text-lg">{field.emoji}</span>
            <span
              className={cn(
                'text-sm font-medium',
                isSelected ? 'text-[#386DFF]' : 'text-[#9C9C9C]'
              )}
            >
              {field.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
