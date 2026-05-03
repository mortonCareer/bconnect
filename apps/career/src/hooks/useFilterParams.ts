import { useQueryStates, parseAsArrayOf, parseAsStringLiteral } from 'nuqs'
import { Trade } from '@bconnect/api-client'
import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_RANGES } from '@/lib/experience'

const TRADE_VALUES = Object.values(Trade)
const EXPERIENCE_VALUES = ['newcomer', '1-3', '3-5', '5-10', '10+'] as const

const filterParsers = {
  trades: parseAsArrayOf(parseAsStringLiteral(TRADE_VALUES)).withDefault([]),
  trade: parseAsStringLiteral(TRADE_VALUES),
  exp: parseAsStringLiteral(EXPERIENCE_VALUES),
}

export function useFilterParams() {
  const [params, setParams] = useQueryStates(filterParsers)

  const { trades, trade: primaryTrade, exp: experience } = params

  const expRange = experience ? EXPERIENCE_RANGES[experience as ExperienceLevel] : undefined

  const applyFilters = (
    newTrades: Trade[],
    newPrimaryTrade: Trade | null,
    newExperience: ExperienceLevel | null
  ) => setParams({ trades: newTrades, trade: newPrimaryTrade, exp: newExperience })

  const clearTrade = () => setParams({ trades: [], trade: null })
  const clearExperience = () => setParams({ exp: null })
  const clearFilter = () => setParams({ trades: [], trade: null, exp: null })

  return {
    trades: trades as Trade[],
    primaryTrade: primaryTrade as Trade | null,
    experience: experience as ExperienceLevel | null,
    expRange,
    applyFilters,
    clearTrade,
    clearExperience,
    clearFilter,
  }
}
