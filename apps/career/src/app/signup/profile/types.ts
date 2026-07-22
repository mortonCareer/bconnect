import type { Trade } from '@bconnect/api-client'

export interface TradeCategory {
  label: string
  trades: Trade[]
}
