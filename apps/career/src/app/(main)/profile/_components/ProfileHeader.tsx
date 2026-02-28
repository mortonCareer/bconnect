'use client'

import type { Trade, Role } from '@morton/api-client'
import { TRADE_LABELS } from '@/lib/trade-labels'

const ROLE_LABELS: Record<string, string> = {
  GUEST: '게스트',
  ARCHITECT: '건축사',
  CONTRACTOR: '시공사',
  FOREMAN: '반장',
  WORKER: '기술자',
  ADMIN: '관리자',
}

interface ProfileHeaderProps {
  name?: string
  picture?: string
  role?: Role
  primaryTrade?: Trade
  city?: string
}

export function ProfileHeader({ name, picture, role, primaryTrade, city }: ProfileHeaderProps) {
  const roleLabel = role ? (ROLE_LABELS[role] ?? '') : ''
  const tradeLabel = primaryTrade ? (TRADE_LABELS[primaryTrade] ?? '') : ''

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6">
      {/* 프로필 이미지 */}
      <div className="h-20 w-20 overflow-hidden rounded-full bg-morton-gray-300">
        {picture ? (
          <img src={picture} alt={name ?? '프로필'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sb-24 text-morton-gray-500">
            {name?.charAt(0) ?? '?'}
          </div>
        )}
      </div>

      {/* 이름 */}
      <p className="text-sb-24 text-morton-gray-900">{name ?? '이름 없음'}</p>

      {/* 역할 + 대표분야 + 지역 */}
      <div className="flex items-center gap-2">
        {roleLabel && <span className="text-m-14 text-morton-gray-500">{roleLabel}</span>}
        {roleLabel && tradeLabel && <div className="h-3 w-px bg-morton-gray-300" />}
        {tradeLabel && <span className="text-m-14 text-morton-gray-500">{tradeLabel}</span>}
        {(roleLabel || tradeLabel) && city && <div className="h-3 w-px bg-morton-gray-300" />}
        {city && <span className="text-m-14 text-morton-gray-500">{city}</span>}
      </div>
    </div>
  )
}
