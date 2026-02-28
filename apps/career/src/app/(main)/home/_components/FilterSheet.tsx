'use client'

import { useState, useEffect } from 'react'
import { Tag } from '@morton/ui'
import type { Trade } from '@morton/api-client'
import { TRADE_LIST } from '../../../../lib/trade-labels'
import { useFeedStore } from '../../../../stores/feed-store'

export function FilterSheet() {
  const isFilterOpen = useFeedStore((s) => s.isFilterOpen)
  const setFilterOpen = useFeedStore((s) => s.setFilterOpen)
  const selectedTrade = useFeedStore((s) => s.selectedTrade)
  const setSelectedTrade = useFeedStore((s) => s.setSelectedTrade)

  const [pendingTrade, setPendingTrade] = useState<Trade | null>(selectedTrade)
  // Two-phase rendering: mounted keeps DOM alive for exit animation
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isFilterOpen) {
      setMounted(true)
      setPendingTrade(selectedTrade)
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true)
        })
      })
    } else {
      setVisible(false)
      // Wait for exit transition to complete before unmounting
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isFilterOpen, selectedTrade])

  const handleClose = () => {
    setFilterOpen(false)
  }

  const handleApply = () => {
    setSelectedTrade(pendingTrade)
    setFilterOpen(false)
  }

  const handleReset = () => {
    setPendingTrade(null)
  }

  const handleTagClick = (trade: Trade) => {
    setPendingTrade((prev) => (prev === trade ? null : trade))
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          visible ? 'opacity-40' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 mx-auto max-w-screen-sm rounded-t-2xl bg-white transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-sb-16">시공분야 필터</h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Trade tags grid */}
        <div className="flex flex-wrap gap-2 px-4 py-4">
          {TRADE_LIST.map(({ value, label }) => (
            <Tag
              key={value}
              variant={pendingTrade === value ? 'selected' : 'default'}
              onClick={() => handleTagClick(value)}
            >
              {label}
            </Tag>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-4 pb-8 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-lg border border-gray-300 py-3 text-m-14 text-gray-600"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-[2] rounded-lg bg-morton-primary py-3 text-m-14 text-white"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}
