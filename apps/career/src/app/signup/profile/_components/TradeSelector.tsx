'use client'

import { TRADE_GROUPS, TRADE_LABELS } from '@/lib/trade-labels'
import type { Trade } from '@bconnect/api-client'
import { FormDescription, FormField, FormItem, FormLabel, FormMessage, Tag } from '@bconnect/ui'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

interface TradeSelectorProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  /** 최대 선택 개수 */
  max: number
}

/**
 * 시공분야 grouped 멀티 선택 — TRADE_GROUPS 별 Tag row, max 개수 제한.
 * shadcn FormField 합성 (value: Trade[]), 에러는 FormMessage 로 표시.
 */
export function TradeSelector<T extends FieldValues>({
  control,
  name,
  max,
}: TradeSelectorProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = (field.value as Trade[] | undefined) ?? []
        const toggle = (trade: Trade) => {
          if (selected.includes(trade)) {
            field.onChange(selected.filter((t) => t !== trade))
          } else if (selected.length < max) {
            field.onChange([...selected, trade])
          }
        }
        return (
          <FormItem className="gap-3">
            <FormLabel required>시공분야</FormLabel>
            <FormDescription>
              최대 {max}개까지 선택 가능해요 ({selected.length}/{max})
            </FormDescription>
            {TRADE_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className="text-m-14 text-gray-700">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.trades.map((trade) => (
                    <Tag
                      key={trade}
                      variant={selected.includes(trade) ? 'selected' : 'default'}
                      onClick={() => toggle(trade)}
                    >
                      {TRADE_LABELS[trade]}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
