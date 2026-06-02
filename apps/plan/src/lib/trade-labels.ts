import { Trade } from '@bconnect/api-client'
import { TRADE_LABELS } from '@bconnect/features'

export { TRADE_LABELS }

export const TRADE_LIST = Object.entries(TRADE_LABELS).map(([value, label]) => ({
  value: value as Trade,
  label,
}))
