'use client'

import { useState, useEffect } from 'react'
import { Select, Tag, TopBar } from '@bconnect/ui'
import type { Trade } from '@bconnect/api-client'
import { TRADE_GROUPS, TRADE_LABELS } from '@bconnect/api-client'
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

  // Sync store → pending on open transition (render-time setState, avoids effect)
  const [prevIsOpen, setPrevIsOpen] = useState(false)
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setMounted(true)
    setPendingTrades(storeTrades)
    setPendingPrimary(storePrimary)
    setPendingExperience(storeExperience)
  }
  if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
    setVisible(false)
  }

  // Animation only: rAF for enter, setTimeout for exit unmount
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true)
        })
      })
    } else if (mounted) {
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, mounted])

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
    const next = pendingTrades.includes(trade)
      ? pendingTrades.filter((t) => t !== trade)
      : pendingTrades.length < 3
        ? [...pendingTrades, trade]
        : pendingTrades

    setPendingTrades(next)

    // Auto-set primary trade
    if (next.length > 0 && (!pendingPrimary || !next.includes(pendingPrimary))) {
      setPendingPrimary(next[0])
    } else if (next.length === 0) {
      setPendingPrimary(null)
    }
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
            <p className="text-sb-16 text-gray-900">
              시공분야 <span className="text-destructive">*</span>
            </p>
            {TRADE_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className="text-m-14 text-gray-700">{group.label}</p>
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
              <p className="text-sb-16 text-gray-900">
                대표분야 <span className="text-destructive">*</span>
              </p>
              <Select
                className="w-fit"
                value={pendingPrimary || ''}
                onChange={(v) => {
                  if (typeof v === 'string') setPendingPrimary(v as Trade)
                }}
                options={pendingTrades.map((trade) => ({
                  value: trade,
                  label: TRADE_LABELS[trade],
                }))}
              />
            </div>
          )}

          {/* 경력 */}
          <div className="flex flex-col gap-3">
            <p className="text-sb-16 text-gray-900">경력</p>
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
