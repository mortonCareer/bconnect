'use client'

import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import type { BoardPosition } from '../types'

export interface BoardPositionPickerProps {
  value: BoardPosition
  onChange: (position: BoardPosition) => void
}

const OPTIONS: { pos: BoardPosition; Icon: LucideIcon; label: string }[] = [
  { pos: 'tl', Icon: ArrowUpLeft, label: '좌상단' },
  { pos: 'tr', Icon: ArrowUpRight, label: '우상단' },
  { pos: 'bl', Icon: ArrowDownLeft, label: '좌하단' },
  { pos: 'br', Icon: ArrowDownRight, label: '우하단' },
]

/** 동산보드 스탬프를 사진 어느 코너에 둘지 선택 (career 업로드 배치 게이트). */
export function BoardPositionPicker({ value, onChange }: BoardPositionPickerProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map(({ pos, Icon, label }) => {
        const active = value === pos
        return (
          <button
            key={pos}
            type="button"
            aria-label={`보드 위치 ${label}`}
            aria-pressed={active}
            onClick={() => onChange(pos)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
              active
                ? 'border-primary text-primary'
                : 'border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
          >
            <Icon size={18} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
