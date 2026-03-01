import type { Trade } from '@morton/api-client'

export type ExperienceLevel = 'newcomer' | '1-3' | '3-5' | '5-10' | '10+'

export interface TradeCategory {
  label: string
  trades: Trade[]
}

export interface ExperienceOption {
  id: ExperienceLevel
  label: string
}
