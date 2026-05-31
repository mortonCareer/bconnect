'use client'

import { TRADE_GROUPS, TRADE_LABELS } from '@/lib/trade-labels'
import type { Trade } from '@bconnect/api-client'
import { FormError, Tag } from '@bconnect/ui'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { FormLabel } from './FormLabel'

interface TradeSelectorProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  /** 최대 선택 개수 */
  max: number
}

/**
 * 시공분야 grouped 멀티 선택 — TRADE_GROUPS 별 Tag row, max 개수 제한.
 * RHF Controller 기반 (value: Trade[]), zod 에러는 FormError 로 표시.
 */
export function TradeSelector<T extends FieldValues>({
  control,
  name,
  max,
}: TradeSelectorProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const selected = (field.value as Trade[] | undefined) ?? []

  const toggle = (trade: Trade) => {
    if (selected.includes(trade)) {
      field.onChange(selected.filter((t) => t !== trade))
    } else if (selected.length < max) {
      field.onChange([...selected, trade])
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <FormLabel required>시공분야</FormLabel>
      <p className="text-r-14 text-gray-500">
        최대 {max}개까지 선택 가능해요 ({selected.length}/{max})
      </p>
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
      <FormError error={fieldState.error?.message} />
    </div>
  )
}
