import { useQueryStates, parseAsArrayOf, parseAsInteger, parseAsStringLiteral } from 'nuqs'
import { Trade } from '@bconnect/api-client'
import type { ExperienceRange } from '@/lib/experience-range'

const TRADE_VALUES = Object.values(Trade)

const filterParsers = {
  trades: parseAsArrayOf(parseAsStringLiteral(TRADE_VALUES)).withDefault([]),
  trade: parseAsStringLiteral(TRADE_VALUES),
  exp: parseAsArrayOf(parseAsInteger),
}

export function useFilterParams() {
  const [params, setParams] = useQueryStates(filterParsers)

  const { trades, trade: primaryTrade, exp } = params

  const experience: ExperienceRange | null = exp?.length === 2 ? [exp[0], exp[1]] : null
  const expRange = experience ? { min: experience[0], max: experience[1] } : undefined

  const applyFilters = (
    newTrades: Trade[],
    newPrimaryTrade: Trade | null,
    newExperience: ExperienceRange | null
  ) => setParams({ trades: newTrades, trade: newPrimaryTrade, exp: newExperience })

  const removeTrade = (target: Trade) => {
    const nextTrades = (trades as Trade[]).filter((t) => t !== target)
    const nextPrimary =
      primaryTrade && nextTrades.includes(primaryTrade as Trade) ? primaryTrade : null
    setParams({ trades: nextTrades, trade: nextPrimary })
  }

  const clearTrade = () => setParams({ trades: [], trade: null })
  const clearExperience = () => setParams({ exp: null })
  const clearFilter = () => setParams({ trades: [], trade: null, exp: null })

  return {
    trades: trades as Trade[],
    primaryTrade: primaryTrade as Trade | null,
    experience,
    expRange,
    applyFilters,
    removeTrade,
    clearTrade,
    clearExperience,
    clearFilter,
  }
}
