import type { Trade } from '@morton/api-client'

export type { ExperienceLevel, ExperienceOption } from '@/lib/experience'

export interface TradeCategory {
  label: string
  trades: Trade[]
}
