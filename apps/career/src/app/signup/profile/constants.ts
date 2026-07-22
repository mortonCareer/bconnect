import { TRADE_GROUPS } from '@bconnect/api-client'
import type { TradeCategory } from './types'

export const TRADE_CATEGORIES: TradeCategory[] = TRADE_GROUPS.map((g) => ({
  label: g.label,
  trades: g.trades,
}))
