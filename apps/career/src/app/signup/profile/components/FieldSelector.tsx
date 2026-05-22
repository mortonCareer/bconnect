'use client'

import { cn } from '@bconnect/ui'
import type { Trade } from '@bconnect/api-client'
import { TRADE_LABELS } from '@/lib/trade-labels'
import type { TradeCategory } from '../types'

interface FieldSelectorProps {
  categories: TradeCategory[]
  selected: string[]
  onToggle: (trade: Trade) => void
}

export function FieldSelector({ categories, selected, onToggle }: FieldSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => (
        <div key={category.label} className="flex flex-col gap-3">
          <p className="text-m-14 text-gray-700">{category.label}</p>
          <div className="flex flex-wrap gap-2">
            {category.trades.map((trade) => {
              const isSelected = selected.includes(trade)
              return (
                <button
                  key={trade}
                  type="button"
                  onClick={() => onToggle(trade)}
                  className={cn(
                    'flex h-[40px] items-center justify-center rounded-[8px] border px-[14px] py-[3px] text-sm leading-[1.6] transition-colors',
                    isSelected
                      ? 'border-primary bg-secondary font-semibold text-primary'
                      : 'border-gray-300 font-medium text-gray-500'
                  )}
                >
                  {TRADE_LABELS[trade]}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
