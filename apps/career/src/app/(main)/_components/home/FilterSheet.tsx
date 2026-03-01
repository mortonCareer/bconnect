'use client'

import { useState, useEffect } from 'react'
import { Tag, TopBar } from '@morton/ui'
import type { Trade } from '@morton/api-client'
import { TRADE_GROUPS, TRADE_LABELS } from '@/lib/trade-labels'
import { EXPERIENCE_OPTIONS } from '@/lib/experience'
import type { ExperienceLevel } from '@/lib/experience'
import { useFilterParams } from '@/hooks/useFilterParams'

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterSheet({ isOpen, onClose }: FilterSheetProps) {
  const {
    trades: storeTrades,
    primaryTrade: storePrimary,
    experience: storeExperience,
    applyFilters,
  } = useFilterParams()

  const [pendingTrades, setPendingTrades] = useState<Trade[]>(storeTrades)
  const [pendingPrimary, setPendingPrimary] = useState<Trade | null>(storePrimary)
  const [pendingExperience, setPendingExperience] = useState<ExperienceLevel | null>(
    storeExperience
  )

  // Two-phase rendering: mounted keeps DOM alive for exit animation
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setPendingTrades(storeTrades)
      setPendingPrimary(storePrimary)
      setPendingExperience(storeExperience)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true)
        })
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, storeTrades, storePrimary, storeExperience])

  // Auto-set primary trade when trades change
  useEffect(() => {
    if (pendingTrades.length > 0 && (!pendingPrimary || !pendingTrades.includes(pendingPrimary))) {
      setPendingPrimary(pendingTrades[0])
    } else if (pendingTrades.length === 0) {
      setPendingPrimary(null)
    }
  }, [pendingTrades, pendingPrimary])

  const handleClose = () => {
    applyFilters(pendingTrades, pendingPrimary, pendingExperience)
    onClose()
  }

  const handleReset = () => {
    setPendingTrades([])
    setPendingPrimary(null)
    setPendingExperience(null)
  }

  const handleTradeToggle = (trade: Trade) => {
    setPendingTrades((prev) => {
      if (prev.includes(trade)) {
        return prev.filter((t) => t !== trade)
      }
      if (prev.length < 3) {
        return [...prev, trade]
      }
      return prev
    })
  }

  const handleExperienceClick = (level: ExperienceLevel) => {
    setPendingExperience((prev) => (prev === level ? null : level))
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Full-page panel sliding from right */}
      <div
        className={`absolute inset-0 bg-white transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <TopBar
          variant="default"
          title="필터"
          showAction
          actionLabel="초기화"
          onAction={handleReset}
          onBack={handleClose}
        />

        {/* Scrollable content */}
        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4 pt-4">
          {/* 시공분야 */}
          <div className="flex flex-col gap-3">
            <p className="text-sb-16 text-morton-gray-900">
              시공분야 <span className="text-morton-error">*</span>
            </p>
            {TRADE_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className="text-m-14 text-morton-gray-700">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.trades.map((trade) => (
                    <Tag
                      key={trade}
                      variant={pendingTrades.includes(trade) ? 'selected' : 'default'}
                      onClick={() => handleTradeToggle(trade)}
                    >
                      {TRADE_LABELS[trade]}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 대표분야 */}
          {pendingTrades.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sb-16 text-morton-gray-900">
                대표분야 <span className="text-morton-error">*</span>
              </p>
              <div className="relative w-fit">
                <select
                  value={pendingPrimary || ''}
                  onChange={(e) => setPendingPrimary(e.target.value as Trade)}
                  className="flex h-[40px] appearance-none items-center rounded-[8px] border border-morton-gray-300 bg-white py-[3px] pl-[10px] pr-8 text-m-14 text-morton-gray-900"
                >
                  {pendingTrades.map((trade) => (
                    <option key={trade} value={trade}>
                      {TRADE_LABELS[trade]}
                    </option>
                  ))}
                </select>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="#1B1B1B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* 경력 */}
          <div className="flex flex-col gap-3">
            <p className="text-sb-16 text-morton-gray-900">경력</p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((option) => (
                <Tag
                  key={option.id}
                  variant={pendingExperience === option.id ? 'selected' : 'default'}
                  onClick={() => handleExperienceClick(option.id)}
                >
                  {option.label}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
