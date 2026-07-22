import { useQueryStates, parseAsArrayOf, parseAsInteger, parseAsStringLiteral } from 'nuqs'
import { Trade, ProfileRole } from '@bconnect/api-client'
import { REGIONS, type Region } from '@/lib/region'
import { isFullExperienceRange, type ExperienceRange } from '@/lib/experience-range'

const TRADE_VALUES = Object.values(Trade)
const ROLE_VALUES = Object.values(ProfileRole)

const filterParsers = {
  trades: parseAsArrayOf(parseAsStringLiteral(TRADE_VALUES)).withDefault([]),
  roles: parseAsArrayOf(parseAsStringLiteral(ROLE_VALUES)).withDefault([]),
  regions: parseAsArrayOf(parseAsStringLiteral(REGIONS)).withDefault([]),
  exp: parseAsArrayOf(parseAsInteger),
}

export function useFilterParams() {
  const [params, setParams] = useQueryStates(filterParsers)

  const trades = params.trades as Trade[]
  const roles = params.roles as ProfileRole[]
  const regions = params.regions as Region[]
  const { exp } = params

  const experience: ExperienceRange | null = exp?.length === 2 ? [exp[0], exp[1]] : null
  const expRange = experience ? { min: experience[0], max: experience[1] } : undefined

  const toggleTrade = (target: Trade) =>
    setParams({
      trades: trades.includes(target) ? trades.filter((t) => t !== target) : [...trades, target],
    })
  const toggleRole = (target: ProfileRole) =>
    setParams({
      roles: roles.includes(target) ? roles.filter((r) => r !== target) : [...roles, target],
    })
  const toggleRegion = (target: Region) =>
    setParams({
      regions: regions.includes(target)
        ? regions.filter((r) => r !== target)
        : [...regions, target],
    })

  // 슬라이더 full-range 는 필터 해제와 동치 → null
  const setExperience = (range: ExperienceRange | null) =>
    setParams({ exp: range && !isFullExperienceRange(range) ? [range[0], range[1]] : null })

  const removeTrade = (target: Trade) => setParams({ trades: trades.filter((t) => t !== target) })
  const removeRole = (target: ProfileRole) =>
    setParams({ roles: roles.filter((r) => r !== target) })
  const removeRegion = (target: Region) =>
    setParams({ regions: regions.filter((r) => r !== target) })
  const clearExperience = () => setParams({ exp: null })
  const clearFilter = () => setParams({ trades: [], roles: [], regions: [], exp: null })

  return {
    trades,
    roles,
    regions,
    experience,
    expRange,
    toggleTrade,
    toggleRole,
    toggleRegion,
    setExperience,
    removeTrade,
    removeRole,
    removeRegion,
    clearExperience,
    clearFilter,
  }
}
