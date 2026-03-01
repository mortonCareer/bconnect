import { TRADE_GROUPS } from '@/lib/trade-labels'
import type { TradeCategory, ExperienceOption } from './types'

export const TRADE_CATEGORIES: TradeCategory[] = TRADE_GROUPS.map((g) => ({
  label: g.label,
  trades: g.trades,
}))

export const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { id: 'newcomer', label: '신입' },
  { id: '1-3', label: '1~3년' },
  { id: '3-5', label: '3~5년' },
  { id: '5-10', label: '5~10년' },
  { id: '10+', label: '10년 이상' },
]
