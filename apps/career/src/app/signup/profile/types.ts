import type { Trade } from '@bconnect/api-client'

export type { ExperienceLevel, ExperienceOption } from '@/lib/experience'

export interface TradeCategory {
  label: string
  trades: Trade[]
}
