'use client'

import { cn } from '@morton/ui'
import type { ConstructionField, FieldCategory } from '../types'

interface FieldSelectorProps {
  categories: FieldCategory[]
  selected: ConstructionField[]
  onToggle: (field: ConstructionField) => void
}

export function FieldSelector({ categories, selected, onToggle }: FieldSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => (
        <div key={category.category} className="flex flex-col gap-3">
          <p className="text-m-14 text-morton-gray-700">{category.category}</p>
          <div className="flex flex-wrap gap-2">
            {category.fields.map((field) => {
              const isSelected = selected.includes(field.id)
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => onToggle(field.id)}
                  className={cn(
                    'flex h-[40px] items-center justify-center rounded-[8px] border px-[14px] py-[3px] text-sm leading-[1.6] transition-colors',
                    isSelected
                      ? 'border-morton-primary bg-morton-primary-sub font-semibold text-morton-primary'
                      : 'border-morton-gray-300 font-medium text-morton-gray-500'
                  )}
                >
                  {field.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
