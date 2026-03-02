import { TRADE_GROUPS } from '@/lib/trade-labels'
import { EXPERIENCE_OPTIONS } from '@/lib/experience'
import type { TradeCategory } from './types'

export const TRADE_CATEGORIES: TradeCategory[] = TRADE_GROUPS.map((g) => ({
  label: g.label,
  trades: g.trades,
}))

export { EXPERIENCE_OPTIONS }
