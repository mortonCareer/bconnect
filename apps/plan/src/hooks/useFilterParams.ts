import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { Trade } from '@bconnect/api-client'
import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_RANGES } from '@/lib/experience'

const TRADE_VALUES = Object.values(Trade)
const EXPERIENCE_VALUES = ['newcomer', '1-3', '3-5', '5-10', '10+'] as const

const filterParsers = {
  trade: parseAsStringLiteral(TRADE_VALUES),
  exp: parseAsStringLiteral(EXPERIENCE_VALUES),
  region: parseAsString,
}

export function useFilterParams() {
  const [params, setParams] = useQueryStates(filterParsers)

  const { trade, exp: experience, region } = params

  const expRange = experience ? EXPERIENCE_RANGES[experience as ExperienceLevel] : undefined

  const setTrade = (value: Trade | null) => setParams({ trade: value })
  const setExperience = (value: ExperienceLevel | null) => setParams({ exp: value })
  const setRegion = (value: string | null) => setParams({ region: value })
  const clearFilter = () => setParams({ trade: null, exp: null, region: null })

  return {
    trade: trade as Trade | null,
    experience: experience as ExperienceLevel | null,
    region,
    expRange,
    setTrade,
    setExperience,
    setRegion,
    clearFilter,
  }
}
