import { create } from 'zustand'
import type { Trade } from '@morton/api-client'

interface FeedState {
  selectedTrade: Trade | null
  isFilterOpen: boolean
  setSelectedTrade: (trade: Trade | null) => void
  setFilterOpen: (open: boolean) => void
  clearFilter: () => void
}

export const useFeedStore = create<FeedState>((set) => ({
  selectedTrade: null,
  isFilterOpen: false,
  setSelectedTrade: (trade) => set({ selectedTrade: trade }),
  setFilterOpen: (open) => set({ isFilterOpen: open }),
  clearFilter: () => set({ selectedTrade: null }),
}))
