/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-5501
 */
'use client'

import { useState, useEffect } from 'react'
import { Slider, Tag, TopBar } from '@bconnect/ui'
import { TRADE_GROUPS, TRADE_LABELS } from '@bconnect/api-client'
import { FILTER_ROLES, ROLE_LABELS } from '@/lib/role-labels'
import { REGIONS, REGION_LABELS } from '@/lib/region'
import {
  EXPERIENCE_FILTER_MAX,
  EXPERIENCE_MIN,
  EXPERIENCE_THUMB_LABELS,
  FULL_EXPERIENCE_RANGE,
  formatExperienceYears,
} from '@/lib/experience-range'
import { useFilterParams } from '@/hooks/useFilterParams'

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterSheet({ isOpen, onClose }: FilterSheetProps) {
  const {
    trades,
    roles,
    regions,
    experience,
    toggleTrade,
    toggleRole,
    toggleRegion,
    setExperience,
    clearFilter,
  } = useFilterParams()

  // Two-phase rendering: mounted keeps DOM alive for exit animation
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(false)

  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setMounted(true)
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
          onAction={clearFilter}
          onBack={onClose}
        />

        {/* Scrollable content */}
        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4 pt-4">
          {/* 시공분야 */}
          <div className="flex flex-col gap-3">
            <p className="text-sb-16 text-gray-900">시공분야</p>
            {TRADE_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className="text-m-14 text-gray-700">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.trades.map((trade) => (
                    <Tag
                      key={trade}
                      variant={trades.includes(trade) ? 'selected' : 'default'}
                      onClick={() => toggleTrade(trade)}
                    >
                      {TRADE_LABELS[trade]}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 역할 */}
          <div className="flex flex-col gap-3">
            <p className="text-sb-16 text-gray-900">역할</p>
            <div className="flex flex-wrap gap-2">
              {FILTER_ROLES.map((role) => (
                <Tag
                  key={role}
                  variant={roles.includes(role) ? 'selected' : 'default'}
                  onClick={() => toggleRole(role)}
                >
                  {ROLE_LABELS[role]}
                </Tag>
              ))}
            </div>
          </div>

          {/* 경력 */}
          <div className="flex flex-col gap-3">
            <p className="text-sb-16 text-gray-900">경력</p>
            <Slider
              value={experience ?? FULL_EXPERIENCE_RANGE}
              onValueChange={(value) => setExperience([value[0], value[1]])}
              min={EXPERIENCE_MIN}
              max={EXPERIENCE_FILTER_MAX}
              formatLabel={formatExperienceYears}
              thumbLabels={EXPERIENCE_THUMB_LABELS}
            />
          </div>

          {/* 지역 */}
          <div className="flex flex-col gap-3">
            <p className="text-sb-16 text-gray-900">지역</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <Tag
                  key={region}
                  variant={regions.includes(region) ? 'selected' : 'default'}
                  onClick={() => toggleRegion(region)}
                >
                  {REGION_LABELS[region]}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
