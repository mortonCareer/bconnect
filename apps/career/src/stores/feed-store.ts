import { create } from 'zustand'
import type { Trade } from '@morton/api-client'
import type { ExperienceLevel } from '@/lib/experience'

interface FeedState {
  selectedTrades: Trade[]
  primaryTrade: Trade | null
  selectedExperience: ExperienceLevel | null
  isFilterOpen: boolean
  setSelectedTrades: (trades: Trade[]) => void
  setPrimaryTrade: (trade: Trade | null) => void
  setSelectedExperience: (exp: ExperienceLevel | null) => void
  setFilterOpen: (open: boolean) => void
  clearFilter: () => void
  clearTrade: () => void
  clearExperience: () => void
}

export const useFeedStore = create<FeedState>((set) => ({
  selectedTrades: [],
  primaryTrade: null,
  selectedExperience: null,
  isFilterOpen: false,
  setSelectedTrades: (trades) => set({ selectedTrades: trades }),
  setPrimaryTrade: (trade) => set({ primaryTrade: trade }),
  setSelectedExperience: (exp) => set({ selectedExperience: exp }),
  setFilterOpen: (open) => set({ isFilterOpen: open }),
  clearFilter: () => set({ selectedTrades: [], primaryTrade: null, selectedExperience: null }),
  clearTrade: () => set({ selectedTrades: [], primaryTrade: null }),
  clearExperience: () => set({ selectedExperience: null }),
}))
